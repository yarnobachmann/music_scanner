import React, { useState, useEffect } from 'react';
import { Track, Settings } from '@/types';
import TitleBar from '@/components/TitleBar';
import Dashboard from '@/components/Dashboard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SettingsModal from '@/components/Settings';
import { FolderOpen, Music, Settings as SettingsIcon } from 'lucide-react';

const HomePage: React.FC = () => {
  const [scanResult, setScanResult] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [hasScanned, setHasScanned] = useState(false);

  const handleScan = async () => {
    if (!window.electronAPI) {
      setError('Electron API not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.selectFolderAndScan();
      
      if (result.canceled) {
        setLoading(false);
        return;
      }

      if (result.error) {
        setError(result.error);
      } else if (result.result) {
        setScanResult(result.result);
        setHasScanned(true);
      }
    } catch (err) {
      setError('Failed to scan folder');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const result = await window.electronAPI.getSettings();
      if (result.result) {
        setSettings(result.result);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSettingsSave = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  return (
    <div className="h-screen bg-rock-black flex flex-col">
      <TitleBar />
      <div style={{ height: 'calc(100vh - 48px)' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center bg-gradient-to-b from-rock-black via-rock-dark to-rock-black">
            <LoadingSpinner />
          </div>
        ) : (
          <Dashboard 
            scanResult={scanResult} 
            onAnalyze={handleScan}
            hasScanned={hasScanned}
            error={error}
          />
        )}
      </div>
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default HomePage; 