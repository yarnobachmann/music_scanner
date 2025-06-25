const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function addIconToExecutable() {
  console.log('🎸 Post-build: Adding icon to Windows executable...');
  
  const exePath = path.join(__dirname, '..', 'dist', 'win-unpacked', 'Music Scan Pro.exe');
  const iconPath = path.join(__dirname, 'icon.ico');
  
  if (!fs.existsSync(exePath)) {
    console.error('❌ Executable not found:', exePath);
    return;
  }
  
  if (!fs.existsSync(iconPath)) {
    console.error('❌ Icon file not found:', iconPath);
    return;
  }
  
  try {
    // Try using rcedit-x64 directly
    const rceditPath = path.join(__dirname, '..', 'node_modules', 'rcedit', 'bin', 'rcedit-x64.exe');
    
    if (fs.existsSync(rceditPath)) {
      console.log('Using rcedit-x64.exe directly...');
      
      const result = await new Promise((resolve, reject) => {
        const process = spawn(rceditPath, [exePath, '--set-icon', iconPath], {
          stdio: 'inherit'
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            resolve(true);
          } else {
            reject(new Error(`rcedit failed with code ${code}`));
          }
        });
        
        process.on('error', reject);
      });
      
      if (result) {
        console.log('✅ Icon successfully added to executable!');
        return;
      }
    }
    
    // Fallback: try using PowerShell and ResourceHacker if available
    console.log('Trying alternative methods...');
    
    // Check if we can use PowerShell to modify the executable
    const psScript = `
      $bytes = [System.IO.File]::ReadAllBytes('${iconPath.replace(/\\/g, '\\\\')}')
      # This is a simplified approach - in reality we'd need a proper PE editor
      Write-Host "Icon file size: $($bytes.Length) bytes"
    `;
    
    const psResult = await new Promise((resolve) => {
      const process = spawn('powershell', ['-Command', psScript], {
        stdio: 'inherit'
      });
      
      process.on('close', (code) => {
        resolve(code === 0);
      });
      
      process.on('error', () => {
        resolve(false);
      });
    });
    
    if (psResult) {
      console.log('ℹ️ Icon file is accessible, but manual embedding failed');
      console.log('ℹ️ The executable may need to be rebuilt with proper signing tools');
    }
    
  } catch (error) {
    console.error('❌ Failed to add icon:', error.message);
  }
}

if (require.main === module) {
  addIconToExecutable();
}

module.exports = addIconToExecutable; 