/* Vitrine com prévia embutida (§08): cartão → painel de tela cheia com iframe carregado SÓ no clique.
   Desktop / Celular (moldura 390×844) · abrir em nova aba · Esc fecha. */
(function () {
  const esc = STEVE.esc;
  const css = `
  .vt { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-top: 40px; }
  .vt__card { position: relative; text-align: left; background: var(--superficie); border: 0; padding: 0; cursor: pointer; color: var(--prata); font: inherit; overflow: hidden; border-radius: 2px; transform-style: preserve-3d; transition: transform .35s ease; }
  .vt__card:hover { transform: perspective(900px) rotateX(2deg) rotateY(-3deg) translateY(-2px); }
  .vt__card img { display: block; width: 100%; aspect-ratio: 16/10; object-fit: cover; opacity: .92; }
  .vt__card figcaption { padding: 20px 22px 24px; }
  .vt__card h3 { margin-bottom: 6px; }
  .vt__card .mono { display: block; margin-top: 12px; }
  .vt__card p { color: var(--metal); font-size: .95rem; }
  .vt__abrir { position: absolute; top: 16px; right: 16px; font-family: var(--mono); font-size: .68rem; letter-spacing: .18em; color: var(--prata); background: rgba(11,12,15,.7); padding: 8px 10px; }
  @media (max-width: 760px) { .vt { grid-template-columns: 1fr; } }
  .pv { position: fixed; inset: 0; z-index: 400; background: rgba(11,12,15,.96); display: none; flex-direction: column; }
  .pv.is-open { display: flex; }
  .pv__bar { display: flex; align-items: center; gap: 14px; padding: 14px var(--gutter); border-bottom: 1px solid rgba(228,229,232,.08); font-family: var(--mono); font-size: .72rem; letter-spacing: .16em; text-transform: uppercase; color: var(--metal); }
  .pv__bar b { color: var(--prata); font-weight: 400; margin-right: auto; }
  .pv__bar button, .pv__bar a { background: none; border: 0; color: var(--metal); font: inherit; letter-spacing: inherit; text-transform: inherit; cursor: pointer; padding: 8px 10px; text-decoration: none; }
  .pv__bar button[aria-pressed="true"] { color: var(--prata); box-shadow: inset 0 -1px 0 var(--prata); }
  .pv__stage { flex: 1; display: grid; place-items: center; padding: 20px; min-height: 0; }
  .pv__frame { width: 100%; height: 100%; background: #000; border: 0; }
  .pv--cel .pv__frame { width: 390px; height: 844px; max-height: 100%; border-radius: 28px; box-shadow: 0 0 0 10px #1A1C22, 0 0 0 11px #2A2E35; }
  .pv__fallback { color: var(--metal); text-align: center; }
  @media (max-width: 860px) { .pv__stage { padding: 0; } .pv--cel .pv__frame { width: 100%; height: 100%; border-radius: 0; box-shadow: none; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let pv = null, iframe = null, cur = null, slow = null;
  function panel() {
    if (pv) return pv;
    pv = document.createElement('div'); pv.className = 'pv'; pv.setAttribute('role', 'dialog'); pv.setAttribute('aria-modal', 'true');
    pv.innerHTML = `<div class="pv__bar"><b></b><button data-m="desk" aria-pressed="true">Desktop</button><button data-m="cel" aria-pressed="false">Celular</button><a target="_blank" rel="noopener">abrir em nova aba ↗</a><button data-x>Fechar · Esc</button></div><div class="pv__stage"></div>`;
    document.body.appendChild(pv);
    pv.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { pv.classList.toggle('pv--cel', b.dataset.m === 'cel'); pv.querySelectorAll('[data-m]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
    pv.querySelector('[data-x]').addEventListener('click', close);
    addEventListener('keydown', e => { if (e.key === 'Escape' && pv.classList.contains('is-open')) close(); });
    return pv;
  }
  function open(item) {
    const p = panel(); cur = item;
    p.querySelector('b').textContent = item.nome; p.querySelector('a').href = item.url;
    const stage = p.querySelector('.pv__stage'); stage.innerHTML = '';
    // o iframe só existe no DOM depois do clique (cada site tem ~90 MB de vídeo)
    iframe = document.createElement('iframe'); iframe.className = 'pv__frame'; iframe.title = item.nome; iframe.loading = 'eager'; iframe.src = item.url;
    stage.appendChild(iframe);
    slow = setTimeout(() => { if (!iframe.__ok) stage.insertAdjacentHTML('afterbegin', `<p class="pv__fallback">Carregando devagar. <a href="${esc(item.url)}" target="_blank" rel="noopener">Abrir em nova aba ↗</a></p>`); }, 8000);
    iframe.addEventListener('load', () => { iframe.__ok = true; const f = stage.querySelector('.pv__fallback'); if (f) f.remove(); });
    p.classList.add('is-open'); document.body.style.overflow = 'hidden';
    p.querySelector('[data-x]').focus();
    STEVE.fire('pop');
  }
  function close() { if (!pv) return; pv.classList.remove('is-open'); pv.querySelector('.pv__stage').innerHTML = ''; iframe = null; clearTimeout(slow); document.body.style.overflow = ''; }

  async function mount(el) {
    const itens = await STEVE.json('vitrine.json');
    const B = STEVE.BASE;
    el.innerHTML = `<div class="vt">${itens.map(i => `
      <figure class="vt__card" tabindex="0" role="button" data-id="${esc(i.id)}" aria-label="Abrir a prévia de ${esc(i.nome)}">
        <img src="${B}/assets/vitrine-${esc(i.id)}.jpg" alt="Prévia do site ${esc(i.nome)}" loading="lazy" onerror="this.style.background='var(--superficie)';this.removeAttribute('src')">
        <span class="vt__abrir">ABRIR A PRÉVIA</span>
        <figcaption><h3>${esc(i.nome)}</h3><p>${esc(i.tipo)}</p><p style="margin-top:6px">${esc(i.nota)}</p><span class="mono">FEITO PELO STEVE · ${esc(i.data)}</span></figcaption>
      </figure>`).join('')}</div>`;
    el.querySelectorAll('.vt__card').forEach(c => {
      const item = itens.find(i => i.id === c.dataset.id);
      c.addEventListener('click', () => open(item));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); } });
    });
  }
  window.VITRINE = { mount, open, close };
})();
