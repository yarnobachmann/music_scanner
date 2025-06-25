#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get version from command line argument
const version = process.argv[2];

if (!version) {
  console.error('❌ Please provide a version number');
  console.error('Usage: npm run release <version>');
  console.error('Example: npm run release 1.0.1');
  process.exit(1);
}

// Validate version format
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('❌ Version must be in format x.y.z (e.g., 1.0.1)');
  process.exit(1);
}

console.log(`🚀 Creating release for Music Scan Pro v${version}`);

try {
  // Check if we're on dev branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  if (currentBranch !== 'dev') {
    console.error('❌ Please switch to dev branch first');
    console.error('Run: git checkout dev');
    process.exit(1);
  }

  // Check for uncommitted changes
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ You have uncommitted changes. Please commit or stash them first.');
    process.exit(1);
  }

  console.log('✅ On dev branch with clean working directory');

  // Update package.json version
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const oldVersion = packageJson.version;
  packageJson.version = version;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

  console.log(`📝 Updated package.json version: ${oldVersion} → ${version}`);

  // Commit version change
  execSync(`git add package.json`);
  execSync(`git commit -m "chore: bump version to ${version}"`);

  console.log('✅ Committed version change');

  // Merge to main
  console.log('🔄 Switching to main branch...');
  execSync('git checkout main');
  execSync('git pull origin main');
  execSync('git merge dev');

  console.log('✅ Merged dev → main');

  // Create and push tag
  const tagName = `v${version}`;
  execSync(`git tag -a ${tagName} -m "Release ${tagName}"`);
  execSync(`git push origin main`);
  execSync(`git push origin ${tagName}`);

  console.log(`✅ Created and pushed tag: ${tagName}`);

  // Switch back to dev
  execSync('git checkout dev');
  execSync('git merge main');
  execSync('git push origin dev');

  console.log('✅ Merged back to dev and pushed');

  console.log('\n🎉 Release created successfully!');
  console.log(`📦 GitHub Actions will now build and create release: ${tagName}`);
  console.log(`🔗 Check progress at: https://github.com/yarnobachmann/music_scanner/actions`);
  console.log(`🎯 Release will be available at: https://github.com/yarnobachmann/music_scanner/releases/tag/${tagName}`);

} catch (error) {
  console.error('❌ Release failed:', error.message);
  console.error('\nTo recover:');
  console.error('1. Check git status: git status');
  console.error('2. If needed, reset: git reset --hard HEAD~1');
  console.error('3. Switch back to dev: git checkout dev');
  process.exit(1);
} 