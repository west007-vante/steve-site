/* ============================================================================
   scroll-sound — camada de som que acompanha o scroll-world (padrão da casa)
   ----------------------------------------------------------------------------
   Zero arquivo, zero crédito: todo som é sintetizado no navegador (Web Audio).
   Duas camadas:
     1. LEITO DE MOVIMENTO — zumbido grave + "whoosh" de ruído filtrado cujo volume
        e brilho seguem a VELOCIDADE do scroll (parou = quase silêncio; rolou rápido
        = vento forte). Funciona igual rolando para cima ou para baixo.
     2. DEIXAS — efeitos presos a um ponto do filme (seção + progresso 0..1).
        Disparam quando a rolagem CRUZA o ponto, nos dois sentidos. Cada deixa pode
        trocar a síntese por um arquivo gerado depois (`src`).

   USO
     const snd = createScrollSound({ cues: [{ s: 0, at: 0.35, fx: 'zip' }, …], bed: { base: 55 } });
     // no onFrame do motor: snd.frame(progressosPorSecao, yEmVh)
     // botão:              snd.toggle()  → true/false (precisa de clique: regra do navegador)
   ========================================================================== */

function createScrollSound(opts = {}) {
  const CUES = (opts.cues || []).map(c => ({ ...c, last: null }));
  const BED = Object.assign({ base: 55, gain: 0.07, whoosh: 0.3 }, opts.bed || {});
  let ctx = null, master, bedGain, whooshGain, whooshFilter, on = false;
  let lastY = null, lastT = 0, vel = 0;
  const buffers = {};
  const log = [];   // deixas disparadas (QA e depuração)

  function noiseBuffer(sec = 2) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function start() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    buffers.noise = noiseBuffer(2);
    // leito: duas senoides levemente desafinadas + sub
    bedGain = ctx.createGain(); bedGain.gain.value = 0; bedGain.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(bedGain);
    [BED.base, BED.base * 1.503, BED.base * 0.5].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); g.gain.value = [0.6, 0.18, 0.5][i];
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + i * 0.05;
      const lg = ctx.createGain(); lg.gain.value = f * 0.004; lfo.connect(lg).connect(o.frequency); lfo.start();
      o.connect(g).connect(lp); o.start();
    });
    // whoosh: ruído em laço → passa-banda que abre com a velocidade
    const n = ctx.createBufferSource(); n.buffer = buffers.noise; n.loop = true;
    whooshFilter = ctx.createBiquadFilter(); whooshFilter.type = 'bandpass'; whooshFilter.Q.value = 0.8; whooshFilter.frequency.value = 300;
    whooshGain = ctx.createGain(); whooshGain.gain.value = 0;
    n.connect(whooshFilter).connect(whooshGain).connect(master); n.start();
  }
  const now = () => ctx.currentTime;
  const env = (g, t, a, peak, d) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  function noise(t, dur, type, f0, f1, peak, q = 1) {
    const s = ctx.createBufferSource(); s.buffer = buffers.noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, Math.min(0.02, dur / 4), peak, dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  }
  function tone(t, f0, f1, dur, peak, type = 'sine') {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    const g = ctx.createGain(); env(g, t, 0.005, peak, dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.1);
  }
  // biblioteca de efeitos sintetizados (nomes estáveis: o prompt-livro referencia por nome)
  const FX = {
    zip(t)      { for (let i = 0; i < 14; i++) noise(t + i * 0.028, 0.03, 'bandpass', 2200 + i * 110, 3400, 0.7, 1.5); noise(t, 0.5, 'bandpass', 700, 3200, 0.35); },
    pop(t)      { [0, .09, .16, .27, .33, .44].forEach((d, i) => tone(t + d, 520 + i * 60, 160, 0.12, 0.5)); },
    whoosh(t)   { noise(t, 1.0, 'bandpass', 160, 2600, 0.7, 0.6); },
    sparkle(t)  { for (let i = 0; i < 9; i++) tone(t + i * 0.055 + Math.random() * 0.03, 2600 + Math.random() * 2200, 1800, 0.22, 0.16, 'triangle'); },
    riser(t)    { noise(t, 1.8, 'bandpass', 200, 5200, 0.45, 1.0); tone(t, 110, 440, 1.8, 0.14, 'sawtooth'); },
    crack(t)    { noise(t, 0.12, 'highpass', 1800, 900, 0.45); for (let i = 0; i < 6; i++) tone(t + 0.05 + i * 0.04, 3000 - i * 250, 1500, 0.25, 0.14, 'triangle'); },
    core(t)     { tone(t, 62, 48, 2.4, 0.35); tone(t, 124, 96, 2.0, 0.08, 'triangle'); },
    flare(t)    { noise(t, 0.08, 'lowpass', 6000, 800, 0.5); tone(t, 90, 30, 1.2, 0.5); noise(t + 0.02, 1.6, 'highpass', 5000, 1200, 0.12); },
    thump(t)    { tone(t, 120, 42, 0.5, 0.55); noise(t, 0.06, 'lowpass', 900, 200, 0.2); },
    ring(t)     { [0, 0.18, 0.36].forEach((d, i) => tone(t + d, 220 - i * 30, 180 - i * 30, 1.2, 0.3 / (i + 1))); },
    type(t)     { for (let i = 0; i < 10; i++) noise(t + i * 0.045, 0.012, 'bandpass', 3500, 3500, 0.12, 4); },
  };
  const samples = {};
  async function playSrc(src, t) {
    try {
      if (!samples[src]) samples[src] = await fetch(src).then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b));
      const s = ctx.createBufferSource(); s.buffer = samples[src]; s.connect(master); s.start(t);
    } catch (e) { /* arquivo faltando: cai no silêncio, nunca quebra a página */ }
  }
  function fire(c) {
    if (!on) return;
    log.push(`${c.s}:${c.fx || c.src}`);
    const t = now() + 0.01;
    if (c.src) playSrc(c.src, t); else if (FX[c.fx]) FX[c.fx](t);
  }

  return {
    get on() { return on; },
    toggle() {
      if (!ctx) start();
      on = !on;
      if (on) ctx.resume();
      const t = now();
      bedGain.gain.cancelScheduledValues(t); bedGain.gain.setTargetAtTime(on ? BED.gain : 0, t, 0.4);
      if (!on) whooshGain.gain.setTargetAtTime(0, t, 0.1);
      return on;
    },
    frame(pr, yVh) {
      // velocidade de rolagem em "telas por segundo", suavizada
      const tNow = performance.now() / 1000;
      if (lastY !== null) { const dt = Math.max(tNow - lastT, 1 / 120); vel = vel * 0.8 + 0.2 * Math.abs(yVh - lastY) / dt; }
      lastY = yVh; lastT = tNow;
      if (on && ctx) {
        const v = Math.min(vel / 1.5, 1), t = now();
        whooshGain.gain.setTargetAtTime(v * BED.whoosh, t, 0.08);
        whooshFilter.frequency.setTargetAtTime(250 + v * 2600, t, 0.08);
      }
      // deixas: dispara quando o progresso da seção cruza o ponto (qualquer sentido)
      CUES.forEach(c => {
        const p = pr[c.s];
        if (c.last !== null && p !== undefined && ((c.last < c.at && p >= c.at) || (c.last > c.at && p <= c.at))) fire(c);
        c.last = p;
      });
    },
    fire(name) { fire({ s: -1, fx: name }); },   // deixa direta por nome (páginas sem motor)
    FX: Object.keys(FX),
    log,
    get ctx() { return ctx; },
    get master() { return master; },
  };
}
