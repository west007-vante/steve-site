import { chromium } from '/Users/pyerri/node_modules/playwright/index.mjs';
const E = '/Users/pyerri/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const b = await chromium.launch({ executablePath: E });
for (const [tag, vp, mob] of [['desk', { width: 1440, height: 900 }, false], ['mob', { width: 390, height: 844 }, true]]) {
  const p = await b.newPage({ viewport: vp, isMobile: mob, hasTouch: mob }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto((process.env.BASE || 'http://localhost:8797') + '/'); await p.waitForTimeout(2500);
  const H = await p.evaluate(() => document.getElementById('world').offsetHeight);
  await p.evaluate(y => scrollTo(0, y), Math.round(H * 0.08)); await p.waitForTimeout(3500);
  const v = await p.evaluate(() => [...document.querySelectorAll('video')].map(v => `${v.videoWidth}x${v.videoHeight}@${v.currentTime.toFixed(2)}`));
  await p.screenshot({ path: `qa/out/${tag}_video.jpg`, quality: 70 });
  console.log(tag, 'videos', JSON.stringify(v), 'erros', errs.length); await p.close();
}
await b.close();
