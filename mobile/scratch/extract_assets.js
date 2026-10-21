const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const brainDir = 'C:/Users/Shruti/.gemini/antigravity-ide/brain/43ed7db9-ca1b-461b-9209-bdb0c26587c4';
const outputDir = 'D:/ingrezy/mobile/assets/splash';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Flood fill / color-key background removal
async function removeWhiteBackground(inputBuffer, threshold = 246, feather = 10) {
  const image = sharp(inputBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  
  // Create RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  
  for (let i = 0; i < width * height; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    
    // Check if pixel is background (near white)
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const diff = maxVal - minVal;
    
    // Background is near white with low color saturation
    let alpha = 255;
    if (minVal >= threshold && diff < 15) {
      // Fully transparent
      alpha = 0;
    } else if (minVal >= threshold - feather && diff < 20) {
      // Soft feather edge
      const t = (minVal - (threshold - feather)) / feather;
      alpha = Math.round(255 * (1 - t));
    }
    
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = alpha;
  }
  
  return sharp(rgba, {
    raw: {
      width,
      height,
      channels: 4
    }
  }).png();
}

async function run() {
  console.log('Testing extraction script...');
}
run();
