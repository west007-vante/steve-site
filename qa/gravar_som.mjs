// Grava vídeo + som da própria página (§16 item 8): rola a página com o som ligado, captura o master do Web Audio, junta com ffmpeg.
// uso: node qa/gravar_som.mjs / DEMO-HOME-COM-SOM   ·   node qa/gravar_som.mjs /diagnostico/ DEMO-DIAGNOSTICO-COM-SOM
import { chromium } from '/Users/pyerri/node_modules/playwright/index.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const E = '/Users/pyerri/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';
const [rota = '/', nome = 'DEMO'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:8797'; const DIR = '/Users/pyerri/steve-site/site/qa/rec'; fs.mkdirSync(DIR, { recursive: true });
const b = await chromium.launch({ executablePath: E, args: ['--autoplay-policy=no-user-gesture-required'] });
const c = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: DIR, size: { width: 1280, height: 720 } } });
const p = await c.newPage(); const t0 = Date.now();
await p.goto(BASE + rota); await p.waitForTimeout(2500);
await p.click('#som');
await p.evaluate(() => { const s = __snd, d = s.ctx.createMediaStreamDestination(); s.master.connect(d); window.__chunks = []; const r = new MediaRecorder(d.stream, { mimeType: 'audio/webm' }); r.ondataavailable = e => __chunks.push(e.data); r.start(); window.__rec = r; });
const tAudio = Date.now();
if (rota.startsWith('/diagnostico')) {
  const step = async () => { await p.click('#vai'); await p.waitForTimeout(900); };
  await p.route('**/functions/v1/**', r => r.abort());
  await p.waitForTimeout(1500); await p.type('#in', 'Ana', { delay: 90 }); await step();
  await p.type('#in', 'Loja da Ana', { delay: 80 }); await step();
  await p.click('input[value="E-commerce / marketplace"]'); await p.waitForTimeout(700); await step();
  await p.click('input[value="2–5"]'); await p.waitForTimeout(700); await step();
  await p.click('input[value="Cadastro e anúncio de produto"]'); await p.waitForTimeout(500); await p.click('input[value="Planilha e lançamento manual"]'); await p.waitForTimeout(700); await step();
  await p.click('input[value="Planilha"]'); await p.waitForTimeout(700); await step();
  await p.evaluate(() => { const h = document.getElementById('in'); h.value = 20; h.dispatchEvent(new Event('input')); }); await p.waitForTimeout(700); await step();
  await p.type('#in', 'subir meus produtos na shopee sem retrabalho', { delay: 45 }); await step();
  await p.click('input[value="Esta semana"]'); await p.waitForTimeout(700); await step();
  await p.click('input[value="R$ 2.500 a 5.000"]'); await p.waitForTimeout(700); await step();
  await p.type('#in', '16999990000', { delay: 60 }); await p.click('input[name=consentimento]'); await p.waitForTimeout(600); await step(); await p.waitForTimeout(4500);
} else {
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight); const N = 900;
  for (let i = 0; i <= N; i++) { const f = 0.98 * (i / N); await p.evaluate(y => scrollTo(0, y), Math.round(H * f)); await p.waitForTimeout(i % 150 < 110 ? 40 : 95); }
  await p.waitForTimeout(1500);
}
const b64 = await p.evaluate(async () => { __rec.stop(); await new Promise(r => setTimeout(r, 500)); const blob = new Blob(__chunks, { type: 'audio/webm' }); const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000)); return btoa(s); });
fs.writeFileSync(`${DIR}/audio.webm`, Buffer.from(b64, 'base64'));
const vpath = await p.video().path(); await c.close(); await b.close();
fs.renameSync(vpath, `${DIR}/video.webm`);
const off = ((tAudio - t0) / 1000).toFixed(2);
const out = `/Users/pyerri/steve-site/${nome}.mp4`;
execSync(`ffmpeg -v error -y -i "${DIR}/video.webm" -itsoffset ${off} -i "${DIR}/audio.webm" -map 0:v -map 1:a -c:v libx264 -crf 22 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest "${out}"`);
console.log('ok', out, 'offset', off);
