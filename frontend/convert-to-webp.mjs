import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const imageDirs = [
    'public/images/cards',
    'public/images/feedbacks',
    'public/images/feedbacks/thumbs',
    'public/idols',
    'public/logo',
    'public/images/press'
];

const logoDir = 'public/images';

async function convertToWebP() {
    let converted = 0;
    let errors = 0;
    
    // Add logo directory
    imageDirs.push(logoDir);
    
    for (const dir of imageDirs) {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            console.log(`⚠️  Directory not found: ${fullPath}`);
            continue;
        }
        
        const files = fs.readdirSync(fullPath);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                try {
                    const inputPath = path.join(fullPath, file);
                    const outputPath = path.join(fullPath, file.replace(ext, '.webp'));
                    
                    // Skip if WebP already exists
                    if (fs.existsSync(outputPath)) {
                        console.log(`⏭️  Skip (exists): ${file}`);
                        continue;
                    }
                    
                    await sharp(inputPath)
                        .webp({ quality: 80, lossless: false })
                        .toFile(outputPath);
                    
                    console.log(`✅ Converted: ${file} -> ${file.replace(ext, '.webp')}`);
                    converted++;
                } catch (err) {
                    console.error(`❌ Error converting ${file}:`, err.message);
                    errors++;
                }
            }
        }
    }
    
    console.log(`\n📊 Total: ${converted} converted, ${errors} errors`);
}

convertToWebP().catch(console.error);
