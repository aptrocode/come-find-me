const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputDir = path.join(__dirname, 'public', 'models', 'Gracie');
const outputDir = path.join(inputDir, 'webp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
console.log(`Found ${files.length} PNGs to convert...`);

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const inputPath = path.join(inputDir, file);
  const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
  
  if (i % 10 === 0) console.log(`Converting ${i}/${files.length}...`);
  
  try {
    execSync(`ffmpeg -v error -i "${inputPath}" -vf scale=540:-1 -vcodec libwebp -lossless 0 -q:v 70 -y "${outputPath}"`);
  } catch (err) {
    console.error(`Failed to convert ${file}:`, err.message);
  }
}
console.log('Conversion complete!');
