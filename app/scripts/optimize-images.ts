/**
 * Image Optimization Script
 *
 * Converts PNG screenshots to WebP format for better web performance.
 * Run with: npx tsx scripts/optimize-images.ts
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'demo-screenshots');
const WEBP_QUALITY = 85; // Good balance of quality and file size
const MAX_WIDTH = 1920;

async function optimizeImage(inputPath: string): Promise<{ input: string; output: string; inputSize: number; outputSize: number }> {
  const filename = path.basename(inputPath, '.png');
  const outputPath = path.join(SCREENSHOTS_DIR, `${filename}.webp`);

  const inputStats = fs.statSync(inputPath);
  const inputSize = inputStats.size;

  await sharp(inputPath)
    .resize(MAX_WIDTH, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);

  const outputStats = fs.statSync(outputPath);
  const outputSize = outputStats.size;

  return {
    input: path.basename(inputPath),
    output: path.basename(outputPath),
    inputSize,
    outputSize,
  };
}

async function main() {
  console.log('Image Optimization Script');
  console.log('=========================\n');
  console.log(`Input directory: ${SCREENSHOTS_DIR}`);
  console.log(`WebP quality: ${WEBP_QUALITY}`);
  console.log(`Max width: ${MAX_WIDTH}px\n`);

  // Find all PNG files
  const files = fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(SCREENSHOTS_DIR, f));

  if (files.length === 0) {
    console.log('No PNG files found in directory.');
    return;
  }

  console.log(`Found ${files.length} PNG files to convert.\n`);
  console.log('Converting...\n');

  let totalInputSize = 0;
  let totalOutputSize = 0;
  const results: Array<{ input: string; output: string; inputSize: number; outputSize: number }> = [];

  for (const file of files) {
    try {
      const result = await optimizeImage(file);
      results.push(result);
      totalInputSize += result.inputSize;
      totalOutputSize += result.outputSize;

      const savings = ((1 - result.outputSize / result.inputSize) * 100).toFixed(1);
      console.log(`  ${result.input} -> ${result.output}`);
      console.log(`    ${(result.inputSize / 1024).toFixed(1)} KB -> ${(result.outputSize / 1024).toFixed(1)} KB (${savings}% smaller)`);
    } catch (error) {
      console.error(`  Error converting ${path.basename(file)}:`, error);
    }
  }

  console.log('\n=========================');
  console.log('Summary');
  console.log('=========================');
  console.log(`Files converted: ${results.length}/${files.length}`);
  console.log(`Total PNG size: ${(totalInputSize / 1024).toFixed(1)} KB`);
  console.log(`Total WebP size: ${(totalOutputSize / 1024).toFixed(1)} KB`);
  console.log(`Total savings: ${((1 - totalOutputSize / totalInputSize) * 100).toFixed(1)}%`);
  console.log(`\nWebP files ready in: ${SCREENSHOTS_DIR}`);
}

main();
