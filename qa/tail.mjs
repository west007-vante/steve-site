import { chromium } from '/Users/pyerri/node_modules/playwright/index.mjs';
const E = '/Users/pyerri/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const BASE = process.env.BASE || 'https://west007-vante.github.io/steve-site';
const b = await chromium.launch({ executablePath: E });
for (const r of ['/casos/', '/']) for (const [tag, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, isMobile: mob, hasTouch: mob }); await p.goto(BASE + r); await p.waitForTimeout(2500);
  const W = await p.evaluate(() => document.getElementById('world').offsetHeight);
  for (const off of [-1.2, -0.6, -0.2, 0.15, 0.6]) {
    await p.evaluate(y => scrollTo(0, y), Math.round(W - vp.height + off * vp.height)); await p.waitForTimeout(900);
    const st = await p.evaluate(() => ({ copy: getComputedStyle(document.querySelector('.sw-copylayer')).opacity, vis: [...document.querySelectorAll('.sw-copy')].map(c => +getComputedStyle(c).opacity).map(x => x.toFixed(1)).join(',') }));
    console.log(r, tag, 'off', off, JSON.stringify(st));
    await p.screenshot({ path: `qa/out/tail_${r.replace(/\//g, '') || 'home'}_${tag}_${String(off).replace('-', 'm')}.jpg`, quality: 60 });
  }
  await p.close();
}
await b.close();
