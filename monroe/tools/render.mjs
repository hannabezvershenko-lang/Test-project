// Renders the still images in ../assets/img. Run from repo root:
//   python3 -m http.server 8123 &  node monroe/tools/render.mjs
import { chromium } from 'playwright';
const shots = [
  ['nails', 1000, 1250], ['lashes', 1000, 1250], ['hair', 1000, 1250],
  ['skin', 1000, 1250], ['makeup', 1000, 1250], ['studio', 1000, 1250], ['pearls', 1600, 1000],
  ['pearls', 1100, 1000, 'none', 'pearls-cut'],
  ['studio', 1800, 1100, '', 'studio-wide', '&x=1.15&s=0.95'],
];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [kind, w, h, bg = '', name = kind, extra = ''] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('console', (m) => console.log(kind, m.text()));
  page.on('pageerror', (e) => console.log(kind, 'ERR', e.message));
  await page.goto(`http://localhost:8123/monroe/tools/render.html?kind=${kind}&bg=${bg}${extra}`);
  await page.waitForSelector('body[data-ready]', { timeout: 120000 });
  await page.screenshot({ path: `monroe/tools/out/${name}.png`, omitBackground: bg === 'none' });
  console.log('done', kind);
  await page.close();
}
await browser.close();
