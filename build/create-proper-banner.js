const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function createProperBanner() {
  console.log('🎸 Creating NSIS-compatible banner with your custom icon...');
  
  // Check if custom icon exists
  const customIconPath = path.join(__dirname, '..', 'icon.png');
  if (!fs.existsSync(customIconPath)) {
    console.error('❌ Custom icon.png not found');
    process.exit(1);
  }
  
  // Create custom icon at 50x50 for banner
  const iconBase64 = await sharp(fs.readFileSync(customIconPath))
    .resize(50, 50, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
    .then(buf => buf.toString('base64'));
  
  // Create a rock-themed banner SVG with your custom icon
  const bannerSVG = `<svg width="164" height="314" viewBox="0 0 164 314" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Dark gradient background -->
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#1a1a1a"/>
        <stop offset="50%" style="stop-color:#2a1a2a"/>
        <stop offset="100%" style="stop-color:#1a1a1a"/>
      </linearGradient>
    </defs>
    
    <!-- Background -->
    <rect width="164" height="314" fill="url(#bg)"/>
    
    <!-- Pink accent stripes -->
    <rect x="0" y="0" width="4" height="314" fill="#DC267F"/>
    <rect x="160" y="0" width="4" height="314" fill="#DC267F"/>
    
    <!-- Your custom icon -->
    <image x="57" y="45" width="50" height="50" xlink:href="data:image/png;base64,${iconBase64}"/>
    
    <!-- App title -->
    <text x="82" y="130" font-family="Arial" font-size="12" fill="white" text-anchor="middle" font-weight="bold">MUSIC SCAN PRO</text>
    
    <!-- Decorative elements -->
    <circle cx="30" cy="200" r="2" fill="#DC267F" opacity="0.8"/>
    <circle cx="134" cy="220" r="2" fill="#DC267F" opacity="0.8"/>
    <circle cx="50" cy="250" r="1" fill="#ffffff" opacity="0.6"/>
    <circle cx="114" cy="270" r="1" fill="#ffffff" opacity="0.6"/>
    
    <!-- Bottom scan lines -->
    <rect x="10" y="290" width="144" height="1" fill="#DC267F" opacity="0.7"/>
    <rect x="15" y="295" width="134" height="1" fill="#DC267F" opacity="0.5"/>
  </svg>`;
  
  try {
    // Create true BMP format for NSIS
    const bmpBuffer = await sharp(Buffer.from(bannerSVG))
      .resize(164, 314, { fit: 'fill' })
      .raw({ depth: 'uchar' })
      .toBuffer({ resolveWithObject: true });
    
    // Create proper BMP header
    const { data, info } = bmpBuffer;
    const { width, height, channels } = info;
    
    // BMP file header (14 bytes) + DIB header (40 bytes) + pixel data
    const headerSize = 54;
    const pixelDataSize = width * height * 3; // 24-bit RGB
    const fileSize = headerSize + pixelDataSize;
    
    const bmpFile = Buffer.alloc(fileSize);
    let offset = 0;
    
    // BMP file header
    bmpFile.write('BM', offset); offset += 2; // Signature
    bmpFile.writeUInt32LE(fileSize, offset); offset += 4; // File size
    bmpFile.writeUInt32LE(0, offset); offset += 4; // Reserved
    bmpFile.writeUInt32LE(headerSize, offset); offset += 4; // Pixel data offset
    
    // DIB header
    bmpFile.writeUInt32LE(40, offset); offset += 4; // DIB header size
    bmpFile.writeUInt32LE(width, offset); offset += 4; // Width
    bmpFile.writeUInt32LE(height, offset); offset += 4; // Height
    bmpFile.writeUInt16LE(1, offset); offset += 2; // Planes
    bmpFile.writeUInt16LE(24, offset); offset += 2; // Bits per pixel
    bmpFile.writeUInt32LE(0, offset); offset += 4; // Compression
    bmpFile.writeUInt32LE(pixelDataSize, offset); offset += 4; // Image size
    bmpFile.writeUInt32LE(2835, offset); offset += 4; // X pixels per meter
    bmpFile.writeUInt32LE(2835, offset); offset += 4; // Y pixels per meter
    bmpFile.writeUInt32LE(0, offset); offset += 4; // Colors used
    bmpFile.writeUInt32LE(0, offset); offset += 4; // Important colors
    
    // Convert RGBA to RGB and flip vertically (BMP requirement)
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const srcIndex = (y * width + x) * channels;
        bmpFile[offset++] = data[srcIndex + 2]; // B
        bmpFile[offset++] = data[srcIndex + 1]; // G
        bmpFile[offset++] = data[srcIndex + 0]; // R
      }
    }
    
    // Write the proper BMP file
    fs.writeFileSync(path.join(__dirname, 'installer-banner.bmp'), bmpFile);
    
    console.log('✅ Proper BMP banner created for NSIS');
    console.log(`   Size: ${Math.round(bmpFile.length / 1024)}KB`);
    
  } catch (error) {
    console.error('❌ Error creating banner:', error);
    process.exit(1);
  }
}

createProperBanner(); 