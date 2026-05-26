// 猫イラスト最適化スクリプト。
// image/{jimu,sagyo}-{smile,neutral,worried}.png（1254x1254 RGBA, 各 500〜750KB）を
// 512x512 の WebP（透過保持）へ縮小・変換し src/assets/cats/ に出力する。
//
// sharp 等の追加依存を増やさず、既に入っている Playwright/Chromium の
// canvas.toDataURL('image/webp') を使う。アセットを差し替えたら再実行:
//   pnpm optimize-cats
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const SIZE = 512;
const QUALITY = 0.82;
const SRC_DIR = 'image';
const OUT_DIR = path.join('src', 'assets', 'cats');
const PATTERN = /^(jimu|sagyo)-(smile|neutral|worried)\.png$/;

fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(SRC_DIR).filter((f) => PATTERN.test(f));
if (files.length === 0) {
  console.error(`No matching PNGs in ${SRC_DIR}/`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const file of files) {
  const b64 = fs.readFileSync(path.join(SRC_DIR, file)).toString('base64');
  await page.setContent(`<canvas id="c" width="${SIZE}" height="${SIZE}"></canvas>`);
  const dataUrl = await page.evaluate(
    async ({ b64, SIZE, QUALITY }) => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const canvas = document.getElementById('c');
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      return canvas.toDataURL('image/webp', QUALITY);
    },
    { b64, SIZE, QUALITY },
  );
  const out = Buffer.from(dataUrl.split(',')[1], 'base64');
  const outName = file.replace(/\.png$/, '.webp');
  fs.writeFileSync(path.join(OUT_DIR, outName), out);
  console.log(`${file} -> ${outName} (${Math.round(out.length / 1024)}KB)`);
}

await browser.close();
console.log(`Done. ${files.length} files written to ${OUT_DIR}/`);
