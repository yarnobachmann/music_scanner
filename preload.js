const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolderAndScan: () => ipcRenderer.invoke('select-folder-and-scan'),
  compareWithLastFM: (scanResult, apiKey) => ipcRenderer.invoke('compareWithLastFM', scanResult, apiKey),

  getSettings: () => ipcRenderer.invoke('getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('saveSettings', settings),
  windowClose: () => ipcRenderer.send('window-close'),
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
}); 