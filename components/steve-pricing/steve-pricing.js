// Seção de planos do Steve. Reconstrução do "Pricing Section" (UI Layouts, 21st.dev)
// em JS puro: mesmo layout, animações e interação; cores, fontes e dados do Steve.
// Valores sempre em centavos. Nada aqui inventa número: tudo sai de `plans`.

const MONTH = 'month';
const YEAR = 'year';

const ICONS = {
  ads: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  stores: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0a3 3 0 0 0 6 0a3 3 0 0 0 6 0"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  check: '<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>',
};
const svg = (name, size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name]}</svg>`;

const intFmt = new Intl.NumberFormat('pt-BR');
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

// "R$ 2.789,17" -> { int: "2.789", frac: ",17" }; centavos zerados somem.
export function brl(cents) {
  const showCents = cents % 100 !== 0;
  const parts = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: showCents ? 2 : 0, maximumFractionDigits: showCents ? 2 : 0,
  }).formatToParts(cents / 100);
  let int = '', frac = '';
  for (const p of parts) {
    if (p.type === 'integer' || p.type === 'group') int += p.value;
    if (p.type === 'decimal' || p.type === 'fraction') frac += p.value;
  }
  return { int, frac, text: `R$ ${int}${frac}` };
}

// Tudo que o card mostra para um plano num período, calculado dos dados.
export function priceView(plan, interval) {
  const m = plan.monthlyAmount, a = plan.annualAmount;
  const monthsFree = (12 * m - a) / m;
  return {
    big: brl(interval === YEAR ? Math.round(a / 12) : m),
    monthly: brl(m),
    annual: brl(a),
    savings: brl(12 * m - a),
    monthsFree,
    pct: (1 - a / (12 * m)) * 100,
  };
}

const freeLabel = (n) => (Number.isInteger(n) ? `${n} ${n === 1 ? 'mês grátis' : 'meses grátis'}` : null);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Dígitos que rolam como no NumberFlow do original: se o "formato" (posição dos
// separadores) é o mesmo, cada dígito desliza até o novo valor; senão, remonta com entrada.
function setRolling(box, str) {
  const prev = box.dataset.v;
  box.dataset.v = str;
  const mask = (s) => s.replace(/\d/g, '0');
  if (prev != null && prev !== str && mask(prev) === mask(str)) {
    [...str].forEach((ch, i) => {
      const strip = box.children[i].firstElementChild;
      if (strip) strip.style.transform = `translateY(${-Number(ch) * 10}%)`;
    });
    return;
  }
  if (prev === str) return;
  box.replaceChildren(...[...str].map((ch) => {
    if (!/\d/.test(ch)) return el('span', 'sp__sym', esc(ch));
    const d = el('span', 'sp__d');
    const strip = el('span', 'sp__strip', '0123456789'.split('').map((n) => `<span>${n}</span>`).join(''));
    strip.style.transform = `translateY(${-Number(ch) * 10}%)`;
    d.append(strip);
    return d;
  }));
  if (prev != null) { box.classList.remove('is-enter'); void box.offsetWidth; box.classList.add('is-enter'); }
}

let uid = 0;

export function mountStevePricing(root, {
  plans,
  initialInterval = MONTH,
  onSelect = () => {},
  ctaLabel = 'Assinar agora',
  title = 'Planos do tamanho da sua',
  highlight = 'operação',
  subtitle = 'Seus anúncios e seu atendimento, no mesmo lugar.',
} = {}) {
  if (!root || !Array.isArray(plans) || !plans.length) throw new TypeError('mountStevePricing: root e plans são obrigatórios');
  for (const p of plans) {
    if (!Number.isInteger(p.monthlyAmount) || !Number.isInteger(p.annualAmount) || p.monthlyAmount <= 0) {
      throw new TypeError(`mountStevePricing: plano ${p.id} sem valores em centavos`);
    }
  }
  if (!document.querySelector('link[data-steve-pricing]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = new URL('./steve-pricing.css', import.meta.url).href; css.dataset.stevePricing = '1';
    document.head.append(css);
  }
  const id = `sp${++uid}`;
  let interval = initialInterval === YEAR ? YEAR : MONTH;

  // Selo da chave: "2 meses grátis" se todos os planos dão o mesmo; senão o maior %.
  const views = plans.map((p) => priceView(p, YEAR));
  const sameFree = views.every((v) => v.monthsFree === views[0].monthsFree) && freeLabel(views[0].monthsFree);
  const saveLabel = sameFree || `até ${pctFmt.format(Math.max(...views.map((v) => v.pct)))}% off`;

  const section = el('section', 'sp');
  section.setAttribute('aria-labelledby', `${id}-t`);
  section.innerHTML = `
    <div class="sp__glow" aria-hidden="true"></div>
    <header class="sp__head">
      <h2 class="sp__title" id="${id}-t" data-r="0">${esc(title)} <span class="sp__hl" data-r="1">${esc(highlight)}</span></h2>
      <p class="sp__sub" data-r="2">${esc(subtitle)}</p>
    </header>
    <div class="sp__switchwrap" data-r="3">
      <div class="sp__switch" role="radiogroup" aria-label="Período de cobrança">
        <span class="sp__thumb" aria-hidden="true"></span>
        <button type="button" class="sp__opt" role="radio" data-interval="${MONTH}"><span>Mensal</span></button>
        <button type="button" class="sp__opt" role="radio" data-interval="${YEAR}"><span class="sp__optin">Anual <span class="sp__save">${esc(saveLabel)}</span></span></button>
      </div>
    </div>
    <p class="sp__sr" aria-live="polite"></p>
    <div class="sp__grid"></div>`;

  const grid = section.querySelector('.sp__grid');
  const cards = plans.map((p, i) => {
    const pid = `${id}-p${i}`;
    const chat = p.chatConversations == null ? 'Atendimento ilimitado' : `${intFmt.format(p.chatConversations)} conversas de atendimento por mês`;
    const cell = el('div', 'sp__cell');
    cell.dataset.r = String(4 + i);
    cell.innerHTML = `
      <article class="sp__card${p.popular ? ' is-popular' : ''}" aria-labelledby="${pid}">
        <div class="sp__cardhead">
          <div class="sp__namerow">
            <h3 class="sp__name" id="${pid}">${esc(p.name)}</h3>
            ${p.popular ? '<span class="sp__badge">Popular</span>' : ''}
          </div>
          ${p.description ? `<p class="sp__desc">${esc(p.description)}</p>` : ''}
          <div class="sp__price">
            <span class="sp__amount"><span class="sp__cur">R$</span><span class="sp__int" aria-hidden="true"></span><span class="sp__frac" aria-hidden="true"></span><span class="sp__sr sp__amtsr"></span></span>
            <span class="sp__per">/mês</span>
          </div>
          <div class="sp__bill">
            <p class="sp__row1"></p>
            <p class="sp__row2"></p>
          </div>
        </div>
        <div class="sp__cardbody">
          <button type="button" class="sp__cta">${esc(ctaLabel)}</button>
          <ul class="sp__feats">
            <li><span class="sp__ic">${svg('ads', 20)}</span><span>${intFmt.format(p.ads)} anúncios por mês</span></li>
            <li><span class="sp__ic">${svg('stores', 20)}</span><span>Até ${intFmt.format(p.maxStores)} lojas</span></li>
            <li><span class="sp__ic">${svg('chat', 20)}</span><span>${chat}</span></li>
          </ul>
          <div class="sp__inc">
            <h4 class="sp__inch">${intFmt.format(p.credits)} créditos por mês</h4>
            <ul class="sp__incl">
              <li><span class="sp__ck">${svg('check', 16)}</span><span>Créditos novos a cada mês</span></li>
              <li class="sp__yearonly"><span class="sp__ck">${svg('check', 16)}</span><span>No plano anual, os créditos continuam mensais</span></li>
            </ul>
            <p class="sp__fine">Créditos não usados expiram no fim de cada mês.</p>
          </div>
        </div>
      </article>`;
    grid.append(cell);
    const q = (s) => cell.querySelector(s);
    const cta = q('.sp__cta');
    cta.addEventListener('click', () => onSelect(p.id, interval));
    return { p, cell, cta, int: q('.sp__int'), frac: q('.sp__frac'), amtsr: q('.sp__amtsr'), row1: q('.sp__row1'), row2: q('.sp__row2') };
  });

  const opts = [...section.querySelectorAll('.sp__opt')];
  const thumb = section.querySelector('.sp__thumb');
  const live = section.querySelector('.sp__sr[aria-live]');

  function placeThumb() {
    const b = opts.find((o) => o.dataset.interval === interval);
    thumb.style.width = `${b.offsetWidth}px`;
    thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`;
  }

  function paint(announce) {
    const year = interval === YEAR;
    section.classList.toggle('is-year', year);
    for (const o of opts) {
      const on = o.dataset.interval === interval;
      o.setAttribute('aria-checked', String(on));
      o.tabIndex = on ? 0 : -1;
    }
    placeThumb();
    for (const c of cards) {
      const v = priceView(c.p, interval);
      setRolling(c.int, v.big.int);
      setRolling(c.frac, v.big.frac);
      c.amtsr.textContent = `${v.big.text} por mês`;
      if (year) {
        const free = freeLabel(v.monthsFree);
        c.row1.innerHTML = `<s class="sp__was"><span class="sp__sr">Sem desconto: </span>${v.monthly.text}/mês</s> <span class="sp__chip">${esc(free || `${pctFmt.format(v.pct)}% off`)}</span>`;
        c.row2.textContent = `${v.annual.text} por ano · você economiza ${v.savings.text}`;
      } else {
        c.row1.textContent = 'Cobrança mensal';
        c.row2.textContent = `No anual: ${v.annual.text} por ano`;
      }
      c.cta.setAttribute('aria-label', `${ctaLabel}: ${c.p.name}, cobrança ${year ? "anual" : "mensal"}`);
    }
    if (announce) live.textContent = year ? `Preços do plano anual, ${saveLabel}.` : 'Preços do plano mensal.';
  }

  function choose(next, focus) {
    next = next === YEAR ? YEAR : MONTH;
    if (next === interval) return;
    interval = next;
    paint(true);
    if (focus) opts.find((o) => o.dataset.interval === interval).focus();
  }

  const onClick = (e) => { const b = e.target.closest('.sp__opt'); if (b) choose(b.dataset.interval); };
  const onKey = (e) => {
    if (!e.target.closest('.sp__opt')) return;
    if (['ArrowLeft', 'ArrowUp'].includes(e.key)) { e.preventDefault(); choose(MONTH, true); }
    if (['ArrowRight', 'ArrowDown'].includes(e.key)) { e.preventDefault(); choose(YEAR, true); }
  };
  const sw = section.querySelector('.sp__switch');
  sw.addEventListener('click', onClick);
  sw.addEventListener('keydown', onKey);

  // Entrada em cascata como o TimelineContent do original (blur + y, 0,4 s por passo).
  // ponytail: anima uma vez só (o original repete ao voltar à tela); repetir apagava o título em captura/troca de aba.
  const io = new IntersectionObserver(([en]) => {
    if (en.isIntersecting) { section.classList.add('is-in'); io.disconnect(); }
  }, { threshold: 0.05 });
  io.observe(section);
  const ro = new ResizeObserver(placeThumb);
  ro.observe(sw);

  root.replaceChildren(section);
  paint(false);
  if (document.fonts) document.fonts.ready.then(placeThumb);

  return {
    setInterval(next) { choose(next); },
    destroy() {
      io.disconnect(); ro.disconnect();
      sw.removeEventListener('click', onClick); sw.removeEventListener('keydown', onKey);
      section.remove();
    },
  };
}
