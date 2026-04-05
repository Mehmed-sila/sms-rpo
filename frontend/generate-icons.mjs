// Node.js da ikonka yaratish uchun
// npx node generate-icons.mjs

import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#4f46e5';
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // SMS harfi
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SMS', size / 2, size / 2);

  writeFileSync(outputPath, canvas.toBuffer('image/png'));
  console.log(`Generated: ${outputPath}`);
}

generateIcon(192, 'public/icon-192.png');
generateIcon(512, 'public/icon-512.png');
