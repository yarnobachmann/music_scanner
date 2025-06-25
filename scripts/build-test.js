#!/usr/bin/env node

/**
 * Build Test Script for Music Scan Pro
 * Tests the complete build and packaging process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎸 Music Scan Pro - Build Test\n');

// Check if we have the required files
const requiredFiles = [
  'main.js',
  'preload.js',
  'scan_music.py',
  'lastfm_compare.py',
  'package.json'
];

console.log('📁 Checking required files...');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✓ ${file}`);
  } else {
    console.log(`  ✗ ${file} - MISSING!`);
    process.exit(1);
  }
}

// Check for icons (warn if missing)
const iconFiles = [
  'build/icon.ico',
  'build/icon.icns',
  'build/icon.png'
];

console.log('\n🎨 Checking icons...');
let iconsPresent = 0;
for (const icon of iconFiles) {
  if (fs.existsSync(icon)) {
    console.log(`  ✓ ${icon}`);
    iconsPresent++;
  } else {
    console.log(`  ⚠ ${icon} - Missing (will use default)`);
  }
}

if (iconsPresent === 0) {
  console.log('  ℹ Add custom icons to build/ directory for professional look');
}

// Test dependencies
console.log('\n📦 Testing dependencies...');
try {
  execSync('python --version', { stdio: 'pipe' });
  console.log('  ✓ Python available');
  
  try {
    execSync('python -c "import mutagen, requests"', { stdio: 'pipe' });
    console.log('  ✓ Python packages available');
  } catch (e) {
    console.log('  ⚠ Python packages missing - installer will handle this');
  }
} catch (e) {
  console.log('  ⚠ Python not found - installer will handle this');
}

// Test build process
console.log('\n🔨 Testing build process...');
try {
  console.log('  Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('  ✓ Next.js build successful');
  
  // Check if out directory was created
  if (fs.existsSync('out')) {
    console.log('  ✓ Static export created');
  } else {
    console.log('  ✗ Static export failed');
    process.exit(1);
  }
  
} catch (e) {
  console.log('  ✗ Build failed:', e.message);
  process.exit(1);
}

// Test type checking
console.log('\n🔍 Testing TypeScript...');
try {
  execSync('npm run type-check', { stdio: 'pipe' });
  console.log('  ✓ TypeScript types valid');
} catch (e) {
  console.log('  ✗ TypeScript errors found');
  process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\n🚀 Ready to package:');
console.log('  npm run dist         - Build for current platform');
console.log('  npm run dist:win     - Build Windows installer');
console.log('  npm run dist:mac     - Build macOS installer');
console.log('  npm run dist:linux   - Build Linux installer');
console.log('\n💡 Note: Add icons to build/ directory for production builds'); 