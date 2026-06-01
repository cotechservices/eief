const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputImage = path.join(__dirname, 'public', 'img', 'logo.jpg');
const outputDir = path.join(__dirname, 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(inputImage)
        .resize(size, size)
        .toFormat('png')
        .toFile(outputPath);
      console.log(`Generated: icon-${size}x${size}.png`);
    }
    
    // Also generate apple-touch-icon.png
    await sharp(inputImage)
        .resize(180, 180)
        .toFormat('png')
        .toFile(path.join(outputDir, `apple-touch-icon.png`));
    console.log(`Generated: apple-touch-icon.png`);
        
    console.log('All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
