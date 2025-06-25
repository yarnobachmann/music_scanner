const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const toIco = require('to-ico');

async function createICOFromCustomIcon() {
  try {
    console.log('🎸 Creating ICO from your custom icon.png...');
    console.log('Working directory:', process.cwd());
    console.log('Script directory:', __dirname);
    
    const customIconPath = path.join(__dirname, '..', 'icon.png');
    
    if (!fs.existsSync(customIconPath)) {
      console.error('❌ Custom icon.png not found in root directory');
      process.exit(1);
    }
    
    console.log('✅ Found custom icon.png');
    
    // Read the custom icon
    const customIconBuffer = fs.readFileSync(customIconPath);
    
    console.log('  🎯 Generating multiple ICO sizes from your custom icon...');
    
    // Create multiple sizes for ICO
    const sizes = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256];
    const pngBuffers = [];
    
    for (const size of sizes) {
      console.log(`    Creating ${size}x${size} PNG from your custom icon...`);
      const buffer = await sharp(customIconBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ 
          compressionLevel: 9,
          adaptiveFiltering: true,
          force: true
        })
        .toBuffer();
      pngBuffers.push(buffer);
    }
    
    console.log('  📦 Converting to ICO format...');
    
    // Convert to ICO using to-ico library
    const icoBuffer = await toIco(pngBuffers);
    
    // Write ICO file
    const icoPath = path.join(__dirname, 'icon.ico');
    fs.writeFileSync(icoPath, icoBuffer);
    
    console.log('✅ Custom ICO created successfully!');
    console.log(`   🎯 build/icon.ico - ICO file from your custom icon (${Math.round(icoBuffer.length / 1024)}KB)`);
    console.log('   📱 Your original icon.png is preserved for app runtime');
    
  } catch (error) {
    console.error('❌ Error creating ICO from custom icon:', error.message);
    process.exit(1);
  }
}

createICOFromCustomIcon(); 