#!/usr/bin/env node
/**
 * Image Optimization Script for Tarot Booking
 * Run this script locally to convert all images to WebP
 * 
 * Requirements:
 *   npm install sharp
 *   node convert-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuration
const QUALITY = 80; // WebP quality (0-100)
const IMAGE_DIRS = [
    'public/images/cards',
    'public/images/feedbacks',
    'public/images/feedbacks/thumbs',
    'public/idols'
];

// Also need to handle logo images
const LOGO_DIR = 'public/logo';

async function convertDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory not found: ${dirPath}`);
        return { converted: 0, errors: 0 };
    }
    
    const files = fs.readdirSync(dirPath);
    let converted = 0;
    let errors = 0;
    
    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            try {
                const inputPath = path.join(dirPath, file);
                const outputPath = path.join(dirPath, file.replace(ext, '.webp'));
                
                // Skip if WebP already exists
                if (fs.existsSync(outputPath)) {
                    console.log(`⏭️  Skip (exists): ${file}`);
                    converted++;
                    continue;
                }
                
                await sharp(inputPath)
                    .webp({ 
                        quality: QUALITY,
                        effort: 6, // Max compression effort
                        alphaQuality: 100
                    })
                    .toFile(outputPath);
                
                const inputSize = fs.statSync(inputPath).size;
                const outputSize = fs.statSync(outputPath).size;
                const savings = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
                
                console.log(`✅ Converted: ${file} (${(inputSize/1024).toFixed(1)}KiB → ${(outputSize/1024).toFixed(1)}KiB, -${savings}%)`);
                converted++;
            } catch (err) {
                console.error(`❌ Error converting ${file}:`, err.message);
                errors++;
            }
        }
    }
    
    return { converted, errors };
}

async function main() {
    console.log('🚀 Starting image conversion to WebP...
');
    console.log(`Quality: ${QUALITY}, Format: WebP
`);
    
    let totalConverted = 0;
    let totalErrors = 0;
    
    // Convert image directories
    for (const dir of IMAGE_DIRS) {
        console.log(`
📁 Processing: ${dir}`);
        const result = await convertDirectory(path.join(__dirname, dir));
        totalConverted += result.converted;
        totalErrors += result.errors;
    }
    
    // Convert logo directory
    console.log(`
📁 Processing: ${LOGO_DIR}`);
    const logoResult = await convertDirectory(path.join(__dirname, LOGO_DIR));
    totalConverted += logoResult.converted;
    totalErrors += logoResult.errors;
    
    console.log('
' + '='.repeat(60));
    console.log(`📊 SUMMARY:`);
    console.log(`   Total images converted: ${totalConverted}`);
    console.log(`   Total errors: ${totalErrors}`);
    console.log('='.repeat(60));
    
    if (totalErrors > 0) {
        console.log('
⚠️  Some images failed to convert. Check errors above.');
    } else {
        console.log('
🎉 All images converted successfully!');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
