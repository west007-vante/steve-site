/* STEVE — camada compartilhada de todas as páginas (PROMPT-LIVRO §02, §03, §15).
   Decodificação · grafite desenhado pela rolagem · som global · cabeçalho · utilitários.
   Nada aqui executa conteúdo vindo de formulário: texto do visitante é sempre escapado. */
(function () {
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ss = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } },
  };
  const BASE = document.documentElement.dataset.base || '.';
  const json = async p => { const r = await fetch(`${BASE}/data/${p}`, { cache: 'no-cache' }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
  const brl = n => 'R$ ' + Math.round(n).toLocaleString('pt-BR');

  /* ---------- cabeçalho ---------- */
  function header() {
    const here = location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    const links = [['manifesto', 'Quem somos'], ['provas', 'Provas'], ['casos', 'Casos'], ['servicos', 'Serviços'], ['docs', 'Docs'], ['diagnostico', 'Diagnóstico']];
    const h = document.createElement('header'); h.className = 'hd';
    h.innerHTML = `<a class="hd__logo" href="${BASE}/"><img src="${BASE}/assets/S.png" alt="" width="20" height="26">STEVE</a>
      <button class="hd__menu" aria-expanded="false" aria-controls="nav">MENU</button>
      <nav class="hd__nav" id="nav">${links.map(([r, t]) => `<a href="${BASE}/${r}/"${here.endsWith('/' + r) ? ' aria-current="page"' : ''}>${t}</a>`).join('')}</nav>`;
    document.body.prepend(h);
    const b = h.querySelector('.hd__menu'), n = h.querySelector('.hd__nav');
    b.addEventListener('click', () => { const o = n.classList.toggle('is-open'); b.setAttribute('aria-expanded', o); b.textContent = o ? 'FECHAR' : 'MENU'; });
  }

  /* ---------- som global (sessionStorage; precisa de clique) ---------- */
  let snd = null;
  function sound(cues, bed) {
    if (typeof createScrollSound !== 'function') return null;
    snd = createScrollSound({ cues: cues || [], bed: Object.assign({ base: 49 }, bed || {}) });
    window.__snd = snd;
    const btn = document.createElement('button'); btn.id = 'som'; btn.setAttribute('aria-pressed', 'false');
    btn.innerHTML = '<i><b></b><b></b><b></b></i><span>ATIVAR SOM</span>';
    document.body.appendChild(btn);
    const set = on => { btn.setAttribute('aria-pressed', on); btn.querySelector('span').textContent = on ? 'SOM LIGADO' : 'ATIVAR SOM'; ss.set('steve.som', on ? '1' : '0'); };
    btn.addEventListener('click', () => set(snd.toggle()));
    // estado pedido em outra página: liga no primeiro gesto do visitante (regra do navegador)
    if (ss.get('steve.som') === '1' && !REDUCE) {
      const arm = () => { if (!snd.on) set(snd.toggle()); ['pointerdown', 'keydown', 'touchstart'].forEach(e => removeEventListener(e, arm)); };
      ['pointerdown', 'keydown', 'touchstart'].forEach(e => addEventListener(e, arm, { once: true, passive: true }));
    }
    // páginas sem motor: o leito segue a rolagem nativa da página
    if (!document.getElementById('world')) {
      let y = 0; const tick = () => { snd.frame([], scrollY / innerHeight); };
      addEventListener('scroll', () => { if (Math.abs(scrollY - y) > 2) { y = scrollY; requestAnimationFrame(tick); } }, { passive: true });
    }
    return snd;
  }
  /* ---------- decodificação (§02) ---------- */
  const ALFA = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+=/\\<>[]{}';
  const PLAIN = /[\s.,;:!?()«»"'’\-–—·/%$]/;
  function decodePrep(el) {
    if (el.__dc) return; el.__dc = true;
    const text = el.textContent; el.setAttribute('aria-label', text);
    if (REDUCE) { el.classList.add('is-done'); return; }
    // mede a largura de cada caractere na fonte final antes de trocar (a linha não pula)
    const frag = document.createDocumentFragment();
    [...text].forEach(ch => {
      const s = document.createElement('span'); s.setAttribute('aria-hidden', 'true');
      if (PLAIN.test(ch) || ch === '\n') { s.textContent = ch; s.className = 'dc ok'; }
      else { s.textContent = ch; s.className = 'dc pend'; s.dataset.ch = ch; }
      frag.appendChild(s);
    });
    el.textContent = ''; el.appendChild(frag);
    el.querySelectorAll('.dc.pend').forEach(s => { s.style.display = 'inline-block'; s.style.width = s.getBoundingClientRect().width + 'px'; s.style.textAlign = 'center'; });
  }
  function decodeRun(el) {
    if (el.__ran) return; el.__ran = true;
    const spans = [...el.querySelectorAll('.dc.pend')]; let settled = 0;
    spans.forEach((s, i) => {
      const n = 6 + Math.floor(Math.random() * 9); let k = 0;
      const start = i * 18;
      const step = () => {
        if (k < n) { s.textContent = ALFA[Math.floor(Math.random() * ALFA.length)]; k++; setTimeout(step, 40); }
        else { s.textContent = s.dataset.ch; s.classList.add('ok'); s.style.display = ''; s.style.width = ''; settled++; if (settled % 12 === 0) fire('type'); if (settled === spans.length) el.classList.add('is-done'); }
      };
      setTimeout(step, start);
    });
    if (!spans.length) el.classList.add('is-done');
  }
  function decodeNow(el) { decodePrep(el); decodeRun(el); }
  function decodeObserve(root = document) {
    const els = [...root.querySelectorAll('[data-decode]')]; els.forEach(decodePrep);
    if (REDUCE) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { decodeRun(e.target); io.unobserve(e.target); } }), { threshold: 0.35 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- fim do motor: copy, rota e HUD esmaecem depois da última seção (não sobrepõem a página que vem atrás) ---------- */
  function worldTail(pr, extras = []) {
    const p = pr[pr.length - 1]; if (p === undefined) return;
    // some ANTES do fim da última seção (0,80→0,98): quando a página seguinte entra por baixo, a copy fixa já não está lá (reprova do dono 22/09)
    const op = p < 0.8 ? 1 : Math.max(0, 1 - (p - 0.8) / 0.18).toFixed(3);
    ['.sw-copylayer', '.sw-route', '.sw-hint'].forEach(sel => { const e = document.querySelector(sel); if (e) { e.style.opacity = op; e.style.pointerEvents = op > 0 ? '' : 'none'; } });
    extras.forEach(e => { if (e) e.style.opacity = Math.min(Number(e.dataset.op ?? 1), op); });
  }

  /* ---------- deixas diretas ---------- */
  function fire(name) { if (snd && snd.on && snd.fire) snd.fire(name); }

  /* ---------- grafite (§03): SVG revelado pela rolagem, escorridos crescem depois ---------- */
  async function graffiti() {
    const els = [...document.querySelectorAll('.graf[data-tag]')];
    for (const el of els) {
      try {
        const r = await fetch(`${BASE}/assets/tags/${el.dataset.tag}.svg`); if (!r.ok) throw 0;
        el.innerHTML = await r.text();
        const svg = el.querySelector('svg'); const vb = (svg.getAttribute('viewBox') || '0 0 100 100').split(/\s+/).map(Number);
        const id = 'm' + Math.random().toString(36).slice(2, 8);
        const NS = 'http://www.w3.org/2000/svg';
        const mask = document.createElementNS(NS, 'mask'); mask.id = id;
        const rect = document.createElementNS(NS, 'rect'); rect.setAttribute('x', vb[0]); rect.setAttribute('y', vb[1]); rect.setAttribute('height', vb[3]); rect.setAttribute('width', REDUCE ? vb[2] : 0); rect.setAttribute('fill', '#fff');
        mask.appendChild(rect); svg.prepend(mask);
        const g = document.createElementNS(NS, 'g'); g.setAttribute('mask', `url(#${id})`);
        [...svg.children].filter(c => c !== mask && c.tagName !== 'defs').forEach(c => g.appendChild(c));
        svg.appendChild(g);
        el.__rect = rect; el.__w = vb[2]; el.__p = 0;
        if (REDUCE) el.classList.add('is-drawn');
      } catch (e) { el.innerHTML = `<span class="mono" style="font-size:1.1rem;letter-spacing:.08em;color:var(--prata)">${esc(el.dataset.texto || el.dataset.tag)}</span>`; el.classList.add('is-drawn'); }
    }
    if (REDUCE) return;
    const draw = () => {
      els.forEach(el => {
        if (!el.__rect) return;
        const b = el.getBoundingClientRect(); const vh = innerHeight;
        // desenha entre 85% e 45% da altura da tela (≈ 1 tela de rolagem)
        const p = Math.min(1, Math.max(0, (vh * 0.85 - b.top) / (vh * 0.4)));
        if (p !== el.__p) { el.__p = p; el.__rect.setAttribute('width', el.__w * p); }
        if (p >= 1 && !el.classList.contains('is-drawn')) { el.classList.add('is-drawn'); fire('zip'); }
      });
    };
    addEventListener('scroll', () => requestAnimationFrame(draw), { passive: true }); draw();
  }
  // risco de correção: palavra riscada + palavra pichada por cima
  function riscos() {
    document.querySelectorAll('.risco').forEach(el => {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 20'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M2 12 C 30 6, 60 16, 98 8'); p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1'; p.style.strokeDashoffset = REDUCE ? '0' : '1';
      svg.appendChild(p); el.appendChild(svg);
      const novo = document.createElement('span'); novo.className = 'risco__novo'; novo.textContent = el.dataset.novo; el.appendChild(novo);
      el.setAttribute('aria-label', el.dataset.novo);
      if (REDUCE) { el.classList.add('is-drawn'); return; }
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { p.style.transition = 'stroke-dashoffset .5s ease-out'; p.style.strokeDashoffset = '0'; el.classList.add('is-drawn'); fire('zip'); io.disconnect(); } }), { threshold: 0.5 });
      setTimeout(() => io.observe(el), 600);
    });
  }

  /* ---------- parallax do retrato ---------- */
  function parallax() {
    const els = [...document.querySelectorAll('.retrato img')]; if (!els.length || REDUCE) return;
    const run = () => els.forEach(img => { const b = img.parentElement.getBoundingClientRect(); const t = (b.top + b.height / 2 - innerHeight / 2) / innerHeight; img.style.transform = `translateY(${(t * 8).toFixed(2)}%)`; });
    addEventListener('scroll', () => requestAnimationFrame(run), { passive: true }); run();
  }

  /* ---------- estimador por palavras (fallback do §09, mesmo no cliente) ---------- */
  let PAL = null, PRE = null;
  async function estimarLocal(texto) {
    PAL = PAL || await json('palavras.json'); PRE = PRE || await json('precos.json');
    const t = String(texto).toLowerCase();
    const ids = PAL.regras.filter(r => new RegExp(r.padrao, 'i').test(t)).map(r => r.servico);
    const porte = new RegExp(PAL.grande, 'i').test(t) ? 'grande' : 'padrao';
    return montar(ids, porte, 'palavras');
  }
  function montar(ids, porte, via) {
    const uniq = [...new Set(ids)].slice(0, 5);
    const servs = uniq.map(id => PRE.servicos.find(s => s.id === id)).filter(Boolean);
    let total = 0;
    const lista = servs.map((s, i) => { const preco = s.fora_da_escada ? null : PRE.escada[Math.min(i, PRE.escada.length - 1)]; if (preco) total += preco; return { id: s.id, nome: s.nome, preco, prazo: s.prazo }; });
    return { servicos: lista, porte, total, via };
  }
  async function estimar(texto) {
    let cfg = null; try { cfg = await json('config.json'); } catch (e) { }
    if (cfg && cfg.fn_estimar) {
      try {
        const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 5000);
        const r = await fetch(cfg.fn_estimar, { method: 'POST', headers: { 'content-type': 'application/json', apikey: cfg.anon_key || '' }, body: JSON.stringify({ texto }), signal: ctrl.signal });
        clearTimeout(to); if (r.ok) { const j = await r.json(); if (j && j.servicos) { PRE = PRE || await json('precos.json'); return j; } }
      } catch (e) { }
    }
    return estimarLocal(texto);
  }

  /* ---------- rodapé ---------- */
  function footer() {
    const f = document.createElement('footer'); f.className = 'ft';
    f.innerHTML = `<div class="in">
      <div><div class="mono" style="margin:0 0 12px">STEVE · AUTONOMOUS OPERATIONS</div><p>Operador de negócio. Lembra, decide, enxerga a tela, clica e prova o que fez.</p><p style="margin-top:10px">Nascidos em Franca-SP.</p></div>
      <div><a href="${BASE}/manifesto/">Quem somos</a><a href="${BASE}/provas/">Provas</a><a href="${BASE}/casos/">Casos e cenários</a><a href="${BASE}/servicos/">Serviços e orçamento</a></div>
      <div><a href="${BASE}/docs/">Documentação</a><a href="${BASE}/diagnostico/">Diagnóstico</a><a href="${BASE}/privacidade/">Privacidade</a><a href="${BASE}/termos/">Termos</a></div>
    </div><span class="mono">NUNCA PROMETEMOS VENDA. PROMETEMOS EXECUÇÃO QUE VOCÊ CONFERE. · ${new Date().getFullYear()}</span>`;
    document.body.appendChild(f);
  }

  window.STEVE = { esc, ss, json, brl, header, footer, sound, fire, decodeObserve, decodeNow, decodePrep, graffiti, worldTail, riscos, parallax, estimar, estimarLocal, montar, REDUCE, BASE,
    get snd() { return snd; }, get precos() { return PRE; }, setPrecos(p) { PRE = p; } };
})();
