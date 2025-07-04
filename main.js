const { app, BrowserWindow, ipcMain, dialog, nativeImage, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  // Load custom icon - prefer ICO on Windows for better compatibility
  let appIcon;
  
  try {
    let iconPath;
    
    // On Windows, try ICO first for better integration
    if (process.platform === 'win32') {
      // Try multiple icon locations
      const possiblePaths = [
        path.join(__dirname, 'build', 'icon.ico'),
        path.join(__dirname, 'bin', 'icon-256.ico'),
        path.join(__dirname, 'icon.ico'),
        path.join(process.resourcesPath, 'icon.ico'),
        path.join(__dirname, 'icon.png')
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          iconPath = testPath;
          console.log(`✅ Found icon at: ${iconPath}`);
          break;
        }
      }
    } else {
      // On other platforms, use PNG
      iconPath = path.join(__dirname, 'icon.png');
    }
    
    if (iconPath && fs.existsSync(iconPath)) {
      appIcon = nativeImage.createFromPath(iconPath);
      console.log(`✅ Custom icon loaded from ${iconPath}`);
      console.log(`Icon size: ${appIcon.getSize().width}x${appIcon.getSize().height}`);
      console.log(`Icon is empty: ${appIcon.isEmpty()}`);
    } else {
      console.log('❌ No icon found, using default');
    }
  } catch (error) {
    console.log('❌ Failed to load icon:', error.message);
  }
  
  if (!appIcon || appIcon.isEmpty()) {
    console.log('⚠️ No icon available, using default');
  }

  // Set app user model ID BEFORE creating window for better Windows taskbar integration
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.musicscanpro.app');
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#18181b',
    show: false,
    icon: appIcon, // Use native image for better compatibility
  });

  // Remove menu bar
  mainWindow.setMenu(null);

  // Set app icon explicitly for Windows taskbar
  if (appIcon && !appIcon.isEmpty()) {
    mainWindow.setIcon(appIcon);
    // Also set overlay icon for Windows taskbar
    if (process.platform === 'win32') {
      mainWindow.setOverlayIcon(appIcon, 'Music Scan Pro');
    }
  }

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Set icon again after window is shown (sometimes needed for Windows)
    if (appIcon && !appIcon.isEmpty() && process.platform === 'win32') {
      mainWindow.setIcon(appIcon);
    }
  });

  // Handle external links - open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Also handle navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  // Check if we're in development or production
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    // Development: load Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production: load exported static files
    mainWindow.loadFile(path.join(__dirname, 'out/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Helper function to get Python script path
function getPythonScriptPath(scriptName) {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    return path.join(__dirname, scriptName);
  } else {
    // In production, try multiple possible locations
    const possiblePaths = [
      // Standard electron-builder resources location
      path.join(process.resourcesPath, scriptName),
      // Alternative resource paths
      path.join(process.resourcesPath, 'app', scriptName),
      path.join(process.resourcesPath, 'app.asar.unpacked', scriptName),
      // Fallback to app directory
      path.join(__dirname, scriptName),
      // Try relative to executable
      path.join(path.dirname(process.execPath), 'resources', scriptName),
    ];
    
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        console.log(`✅ Found Python script at: ${testPath}`);
        return testPath;
      }
    }
    
    // If none found, log all attempted paths and return the standard one
    console.error('❌ Python script not found in any of these locations:');
    possiblePaths.forEach(p => console.error(`  - ${p}`));
    console.error(`Process resourcesPath: ${process.resourcesPath}`);
    console.error(`__dirname: ${__dirname}`);
    console.error(`process.execPath: ${process.execPath}`);
    
    // Return the most likely path anyway (first option)
    return possiblePaths[0];
  }
}

// Return the correct Python executable (embedded in production, system Python in development)
function getPythonExecutable() {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    return 'python'; // rely on developer machine Python
  }

  // Candidate locations for the embedded interpreter
  const candidates = [
    path.join(process.resourcesPath, 'python_embed', 'python.exe'),
    path.join(__dirname, 'python_embed', 'python.exe'),
    path.join(path.dirname(process.execPath), 'resources', 'python_embed', 'python.exe'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`✅ Using embedded Python at: ${candidate}`);
      
      // Set SSL certificate path for embedded Python
      const pythonDir = path.dirname(candidate);
      const certPath = path.join(pythonDir, 'Lib', 'site-packages', 'certifi', 'cacert.pem');
      if (fs.existsSync(certPath)) {
        process.env.SSL_CERT_FILE = certPath;
        process.env.REQUESTS_CA_BUNDLE = certPath;
        console.log(`✅ SSL certificates configured: ${certPath}`);
      }
      
      return candidate;
    }
  }

  console.log('⚠️ Embedded Python not found, falling back to system Python');
  return 'python';
}

// IPC: Open folder dialog and run Python scan
ipcMain.handle('select-folder-and-scan', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || !filePaths[0]) return { canceled: true };
  const folder = filePaths[0];
  return new Promise((resolve) => {
    const scriptPath = getPythonScriptPath('scan_music.py');
    const pythonExe = getPythonExecutable();
    console.log(`🐍 Running Python script: ${pythonExe} ${scriptPath} "${folder}"`);
    
    const py = spawn(pythonExe, [scriptPath, folder], { env: process.env });
    let data = '';
    let err = '';
    
    py.on('error', (error) => {
      console.error('❌ Failed to spawn Python process:', error.message);
      resolve({ error: `Failed to start Python: ${error.message}` });
    });
    
    py.stdout.on('data', (chunk) => { data += chunk; });
    py.stderr.on('data', (chunk) => { err += chunk; });
    py.on('close', (code) => {
      data = data.trim();
      console.log(`🐍 Python process exited with code: ${code}`);
      
      if (code !== 0 || err) {
        console.error('❌ Python stderr:', err);
        resolve({ error: 'Python error: ' + err, raw: data, exitCode: code });
        return;
      }
      try {
        resolve({ result: JSON.parse(data) });
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.error('❌ Raw Python output:', data);
        resolve({ error: 'Failed to parse scan result', raw: data, parseError: parseError.message });
      }
    });
  });
});

ipcMain.handle('compareWithLastFM', async (event, scanResult, apiKey) => {
  const tmpPath = path.join(os.tmpdir(), `music_scan_${Date.now()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(scanResult, null, 2), 'utf-8');
  return new Promise((resolve) => {
    const scriptPath = getPythonScriptPath('lastfm_compare.py');
    const pythonExe = getPythonExecutable();
    const args = [scriptPath, tmpPath];
    if (apiKey) {
      args.push(apiKey);
    }
    
    console.log(`🐍 Running Last.fm comparison: ${pythonExe} ${args.join(' ')}`);
    const py = spawn(pythonExe, args, { env: process.env });
    let data = '';
    let err = '';
    
    py.on('error', (error) => {
      console.error('❌ Failed to spawn Python process:', error.message);
      fs.unlinkSync(tmpPath);
      resolve({ error: `Failed to start Python: ${error.message}` });
    });
    
    py.stdout.on('data', (chunk) => { data += chunk; });
    py.stderr.on('data', (chunk) => { err += chunk; });
    py.on('close', (code) => {
      data = data.trim();
      fs.unlinkSync(tmpPath);
      
      console.log(`🐍 Last.fm Python process exited with code: ${code}`);
      
      try {
        const result = JSON.parse(data);
        resolve({ result: result });
        return;
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        console.error('❌ Raw Python output:', data);
        if (code !== 0 || err) {
          console.error('❌ Python stderr:', err);
          resolve({ error: 'Python error: ' + err, raw: data, exitCode: code });
        } else {
          resolve({ error: 'Failed to parse compare result', raw: data, parseError: parseError.message });
        }
      }
    });
  });
});

// Settings management
const settingsPath = path.join(os.homedir(), '.music-scan-pro-settings.json');

ipcMain.handle('getSettings', async () => {
  try {
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      return { result: settings };
    }
    return { result: {} };
  } catch (error) {
    return { error: 'Failed to load settings' };
  }
});

ipcMain.handle('saveSettings', async (event, settings) => {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to save settings' };
  }
});



// Window control handlers
ipcMain.on('window-close', () => {
  mainWindow.close();
});

ipcMain.on('window-minimize', () => {
  mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// Handle opening external URLs in browser
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}); 