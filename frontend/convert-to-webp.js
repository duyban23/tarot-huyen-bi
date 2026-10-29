
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imageDirs = [
    'public/images/cards',
    'public/images/feedbacks',
    'public/images/feedbacks/thumbs',
    'public/idols'
];

async function convertToWebP() {
    let converted = 0;
    let errors = 0;
    
    for (const dir of imageDirs) {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            console.log(`Directory not found: ${fullPath}`);
            continue;
        }
        
        const files = fs.readdirSync(fullPath);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png'].includes(ext)) {
                try {
                    const inputPath = path.join(fullPath, file);
                    const outputPath = path.join(fullPath, file.replace(ext, '.webp'));
                    
                    await sharp(inputPath)
                        .webp({ quality: 80 })
                        .toFile(outputPath);
                    
                    console.log(`Converted: ${file} -> ${file.replace(ext, '.webp')}`);
                    converted++;
                } catch (err) {
                    console.error(`Error converting ${file}:`, err.message);
                    errors++;
                }
            }
        }
    }
    
    console.log(`\nTotal: ${converted} converted, ${errors} errors`);
}

convertToWebP().catch(console.error);
