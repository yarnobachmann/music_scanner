const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const PYTHON_VERSION = '3.12.1';
const PYTHON_URL = `https://www.python.org/ftp/python/${PYTHON_VERSION}/python-${PYTHON_VERSION}-embed-amd64.zip`;
const EMBED_DIR = 'python_embed';

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(dest, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

async function setupEmbeddedPython() {
  console.log('🐍 Setting up embedded Python runtime...');
  
  // Skip if already exists
  if (fs.existsSync(EMBED_DIR)) {
    console.log('✅ Python embed directory already exists, skipping setup');
    return;
  }
  
  const zipFile = 'python_embed.zip';
  
  try {
    // Download Python embeddable package
    console.log(`📥 Downloading Python ${PYTHON_VERSION} embeddable package...`);
    await downloadFile(PYTHON_URL, zipFile);
    console.log('✅ Download completed');
    
    // Create directory
    fs.mkdirSync(EMBED_DIR, { recursive: true });
    
    // Extract using PowerShell on Windows, unzip on Unix
    console.log('📦 Extracting Python package...');
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      execSync(`powershell -Command "Expand-Archive -Path '${zipFile}' -DestinationPath '${EMBED_DIR}' -Force"`, {
        stdio: 'inherit'
      });
    } else {
      execSync(`unzip -q "${zipFile}" -d "${EMBED_DIR}"`, {
        stdio: 'inherit'
      });
    }
    
    // Enable site packages by uncommenting import site
    const pthFile = path.join(EMBED_DIR, `python${PYTHON_VERSION.replace('.', '').substring(0, 3)}._pth`);
    if (fs.existsSync(pthFile)) {
      let content = fs.readFileSync(pthFile, 'utf8');
      content = content.replace(/^#import site$/m, 'import site');
      fs.writeFileSync(pthFile, content);
      console.log('✅ Enabled site packages');
    }
    
    // Download and install pip
    console.log('📥 Installing pip...');
    const getPipUrl = 'https://bootstrap.pypa.io/get-pip.py';
    await downloadFile(getPipUrl, 'get-pip.py');
    
    const pythonExe = isWindows ? path.join(EMBED_DIR, 'python.exe') : path.join(EMBED_DIR, 'python');
    execSync(`"${pythonExe}" get-pip.py --no-warn-script-location`, {
      stdio: 'inherit'
    });
    
    // Install required packages
    console.log('📦 Installing required packages...');
    execSync(`"${pythonExe}" -m pip install mutagen requests --no-warn-script-location`, {
      stdio: 'inherit'
    });
    
    // Download SSL certificates
    console.log('🔒 Installing SSL certificates...');
    const certUrl = 'https://curl.se/ca/cacert.pem';
    const certPath = path.join(EMBED_DIR, 'Lib', 'site-packages', 'certifi', 'cacert.pem');
    
    // Ensure directory exists
    fs.mkdirSync(path.dirname(certPath), { recursive: true });
    await downloadFile(certUrl, certPath);
    
    // Test installation
    console.log('🧪 Testing installation...');
    execSync(`"${pythonExe}" -c "import mutagen; import requests; print('✅ All modules imported successfully')"`, {
      stdio: 'inherit'
    });
    
    // Cleanup
    fs.unlinkSync(zipFile);
    fs.unlinkSync('get-pip.py');
    
    console.log('🎉 Embedded Python setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Failed to setup embedded Python:', error.message);
    
    // Cleanup on failure
    try {
      if (fs.existsSync(zipFile)) fs.unlinkSync(zipFile);
      if (fs.existsSync('get-pip.py')) fs.unlinkSync('get-pip.py');
      if (fs.existsSync(EMBED_DIR)) {
        fs.rmSync(EMBED_DIR, { recursive: true, force: true });
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup:', cleanupError.message);
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupEmbeddedPython();
}

module.exports = { setupEmbeddedPython }; 