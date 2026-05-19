import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const inputDir = path.resolve('public/models/Gracie');
const outputDir = path.resolve('public/models/Gracie/webp');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processImages() {
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.png'));
  
  console.log(`Found ${files.length} images to process.`);
  
  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file.replace('.png', '.webp'));
    
    await sharp(inputPath)
      .resize({ width: 540 }) // downscale to half 1080p width
      .webp({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`Processed: ${file}`);
  }
  
  console.log('Done!');
}

processImages().catch(console.error);
