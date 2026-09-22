// Portão P7: os 6 planos tocam pela rolagem nos 2 tamanhos; quadro ≥ 0 em cada seção; console limpo.
import { chromium } from '/Users/pyerri/node_modules/playwright/index.mjs';
const E = '/Users/pyerri/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = process.env.BASE || 'http://localhost:8797';
const b = await chromium.launch({ executablePath: E }); let bad = 0;
for (const [tag, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, isMobile: mob, hasTouch: mob }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(BASE + '/'); await p.waitForTimeout(2500);
  const H = await p.evaluate(() => document.getElementById('world').offsetHeight - innerHeight);
  const seen = [];
  for (const f of [0.05, 0.2, 0.37, 0.53, 0.7, 0.86, 0.97]) {
    await p.evaluate(y => scrollTo(0, y), Math.round(H * f)); await p.waitForTimeout(2200);
    const v = await p.evaluate(() => [...document.querySelectorAll('.sw-scene')].map((s, i) => ({ i, op: +getComputedStyle(s).opacity, v: s.querySelector('video') ? `${s.querySelector('video').videoWidth}x${s.querySelector('video').videoHeight}@${s.querySelector('video').currentTime.toFixed(1)}` : '-' })).filter(x => x.op > 0.5));
    seen.push(...v.map(x => x.i)); console.log(tag, f, JSON.stringify(v));
    await p.screenshot({ path: `qa/out/${tag}_filme_${Math.round(f * 100)}.jpg`, quality: 60 });
  }
  const ok = [0, 1, 2, 3, 4, 5].every(i => seen.includes(i));
  console.log(tag, ok ? 'OK  6 planos vistos' : 'FAIL planos vistos ' + [...new Set(seen)], 'erros', errs.length); if (!ok || errs.length) bad++;
  await p.close();
}
await b.close(); console.log(bad ? 'FALHA' : 'FILME OK'); process.exit(bad ? 1 : 0);
