#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const shopierUrl = process.argv[2] || 'https://www.shopier.com/loopdesignbags';
const scriptDir = dirname(fileURLToPath(import.meta.url));
const extractor = readFileSync(resolve(scriptDir, 'shopier-browser-extractor.js'), 'utf8');

function copyToClipboard(text) {
  if (process.platform === 'darwin') {
    return spawnSync('pbcopy', { input: text }).status === 0;
  }

  if (process.platform === 'linux') {
    return spawnSync('xclip', ['-selection', 'clipboard'], { input: text }).status === 0;
  }

  return false;
}

function openUrl(url) {
  if (process.platform === 'darwin') {
    spawnSync('open', [url], { stdio: 'ignore' });
    return;
  }

  if (process.platform === 'win32') {
    spawnSync('cmd', ['/c', 'start', '', url], { stdio: 'ignore' });
    return;
  }

  spawnSync('xdg-open', [url], { stdio: 'ignore' });
}

const copied = copyToClipboard(extractor);
openUrl(shopierUrl);

console.log('Opened:', shopierUrl);
console.log(copied ? 'Extractor script copied to clipboard.' : 'Could not copy automatically. Open scripts/shopier-browser-extractor.js and copy it manually.');
console.log('Steps:');
console.log('1. Wait until the Shopier page fully loads. Complete any browser challenge manually.');
console.log('2. Open DevTools Console.');
console.log('3. Paste the extractor script and press Enter.');
console.log('4. A CSV will be copied to clipboard and downloaded as loop-shopier-products.csv.');
console.log('5. Paste the CSV into the Google Sheet with columns: active, sortOrder, title, description, priceText, imageUrl, productUrl.');
