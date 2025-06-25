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
        path.join(__dirname, 'icon.ico'),
        path.join(process.resourcesPath, 'icon.ico'),
        path.join(__dirname, 'build', 'icon.ico'),
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
    } else {
      console.log('❌ No icon found, using default');
    }
  } catch (error) {
    console.log('❌ Failed to load icon:', error.message);
  }
  
  if (!appIcon || appIcon.isEmpty()) {
    console.log('⚠️ No icon available, using default');
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

  // Set app icon explicitly
  if (appIcon && !appIcon.isEmpty()) {
    app.setAppUserModelId('com.musicscanpro.app');
    mainWindow.setIcon(appIcon);
  }

  // Show window when ready to prevent white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
    // In production, Python files are in resources folder
    return path.join(process.resourcesPath, scriptName);
  }
}

// IPC: Open folder dialog and run Python scan
ipcMain.handle('select-folder-and-scan', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled || !filePaths[0]) return { canceled: true };
  const folder = filePaths[0];
  return new Promise((resolve) => {
    const py = spawn('python', [getPythonScriptPath('scan_music.py'), folder]);
    let data = '';
    let err = '';
    py.stdout.on('data', (chunk) => { data += chunk; });
    py.stderr.on('data', (chunk) => { err += chunk; });
    py.on('close', () => {
      data = data.trim();
      if (err) {
        resolve({ error: 'Python error: ' + err, raw: data });
        return;
      }
      try {
        resolve({ result: JSON.parse(data) });
      } catch {
        resolve({ error: 'Failed to parse scan result', raw: data });
      }
    });
  });
});

ipcMain.handle('compareWithLastFM', async (event, scanResult, apiKey) => {
  const tmpPath = path.join(os.tmpdir(), `music_scan_${Date.now()}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(scanResult, null, 2), 'utf-8');
  return new Promise((resolve) => {
    const args = [getPythonScriptPath('lastfm_compare.py'), tmpPath];
    if (apiKey) {
      args.push(apiKey);
    }
    const py = spawn('python', args);
    let data = '';
    let err = '';
    py.stdout.on('data', (chunk) => { data += chunk; });
    py.stderr.on('data', (chunk) => { err += chunk; });
    py.on('close', () => {
      data = data.trim();
      fs.unlinkSync(tmpPath);
      
      try {
        const result = JSON.parse(data);
        resolve({ result: result });
        return;
      } catch (parseError) {
        if (err) {
          resolve({ error: 'Python error: ' + err, raw: data });
        } else {
          resolve({ error: 'Failed to parse compare result', raw: data });
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