import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const publicDir = path.resolve('frontend/apps/web/public');

if (!fs.existsSync(edge)) {
  console.error('Edge executable not found at:', edge);
  process.exit(1);
}

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Saúde Memora">
  <rect width="64" height="64" rx="15" fill="#1D4ED8"/>
  <path d="M9 38 L18 38 L25.5 19.5 L32 44 L38.5 19.5 L46 38 L51 38" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="54" cy="38" r="3.2" fill="#EB6A4A"/>
</svg>`;

// Write favicon.svg and logo.svg
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf-8');
console.log('Saved: favicon.svg and logo.svg');

// Temporary HTML for Edge headless rendering
const tmpHtml = path.join(os.tmpdir(), 'render_favicon.html');
fs.writeFileSync(tmpHtml, `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: transparent; }
  svg { width: 100%; height: 100%; display: block; }
</style>
</head>
<body>
${svgContent}
</body>
</html>`, 'utf-8');

const fileUrl = 'file:///' + tmpHtml.replace(/\\/g, '/');

function renderPng(size, outPath) {
  execFileSync(edge, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=00000000',
    `--window-size=${size},${size}`,
    `--screenshot=${outPath}`,
    fileUrl
  ]);
  const buf = fs.readFileSync(outPath);
  console.log(`Rendered ${size}x${size} -> ${path.basename(outPath)} (${buf.length} bytes)`);
  return buf;
}

// Render individual sizes
const png16 = renderPng(16, path.join(publicDir, 'favicon-16x16.png'));
const png32 = renderPng(32, path.join(publicDir, 'favicon-32x32.png'));
const png48 = renderPng(48, path.join(publicDir, 'favicon-48x48.png'));

// Render PWA and Apple touch icons
renderPng(180, path.join(publicDir, 'apple-touch-icon.png'));
renderPng(180, path.join(publicDir, 'apple-touch-icon-180x180.png'));
renderPng(192, path.join(publicDir, 'pwa-192x192.png'));
renderPng(512, path.join(publicDir, 'pwa-512x512.png'));
renderPng(512, path.join(publicDir, 'logo.png'));

// Render Maskable icons (with safe zone padding: 80% icon size centered in 100% blue box)
const tmpMaskableHtml = path.join(os.tmpdir(), 'render_maskable.html');
fs.writeFileSync(tmpMaskableHtml, `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #1D4ED8; display: flex; align-items: center; justify-content: center; }
  svg { width: 80%; height: 80%; display: block; }
</style>
</head>
<body>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img">
  <path d="M9 38 L18 38 L25.5 19.5 L32 44 L38.5 19.5 L46 38 L51 38" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="54" cy="38" r="3.2" fill="#EB6A4A"/>
</svg>
</body>
</html>`, 'utf-8');

const maskableUrl = 'file:///' + tmpMaskableHtml.replace(/\\/g, '/');
function renderMaskablePng(size, outPath) {
  execFileSync(edge, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--default-background-color=1D4ED8FF',
    `--window-size=${size},${size}`,
    `--screenshot=${outPath}`,
    maskableUrl
  ]);
  console.log(`Rendered maskable ${size}x${size} -> ${path.basename(outPath)}`);
}

renderMaskablePng(192, path.join(publicDir, 'pwa-maskable-192x192.png'));
renderMaskablePng(512, path.join(publicDir, 'pwa-maskable-512x512.png'));

// Build favicon.ico (multi-size: 16x16, 32x32, 48x48)
function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(images.length, 4); // count

  let offset = 6 + images.length * 16;
  const entries = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image size in bytes
    entry.writeUInt32LE(offset, 12); // Offset to image data
    entries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map(img => img.buffer)]);
}

const icoBuffer = createIco([
  { width: 16, height: 16, buffer: png16 },
  { width: 32, height: 32, buffer: png32 },
  { width: 48, height: 48, buffer: png48 },
]);

const icoPath = path.join(publicDir, 'favicon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`Created favicon.ico with 16x16, 32x32, 48x48 (${icoBuffer.length} bytes) at ${icoPath}`);

// Cleanup temporary files
try { fs.unlinkSync(tmpHtml); } catch {}
try { fs.unlinkSync(tmpMaskableHtml); } catch {}

console.log('All favicons and icons created successfully!');
