import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, X, Save, ExternalLink, Key } from 'lucide-react';
import { Settings } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

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

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      const result = await window.electronAPI.saveSettings(settings);
      if (result.success) {
        setSaved(true);
        onSave(settings);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-rock-dark border border-rock-gray rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-rock-gray">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="text-rock-accent" size={24} />
            <h2 className="text-xl font-semibold text-white">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="interactive p-2 hover:bg-rock-gray rounded transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white flex items-center space-x-2">
              <Key size={20} className="text-rock-gold" />
              <span>Last.fm API Configuration</span>
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  API Key
                </label>
                <input
                  type="text"
                  value={settings.lastfmApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, lastfmApiKey: e.target.value })}
                  placeholder="Enter your Last.fm API key"
                  className="interactive w-full bg-rock-gray border border-rock-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-rock-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Shared Secret (Optional)
                </label>
                <input
                  type="password"
                  value={settings.lastfmSecret || ''}
                  onChange={(e) => setSettings({ ...settings, lastfmSecret: e.target.value })}
                  placeholder="Enter your Last.fm shared secret"
                  className="interactive w-full bg-rock-gray border border-rock-light rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-rock-accent focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-rock-gray/50 rounded-lg p-4 space-y-3">
              <p className="text-sm text-gray-300">
                <strong>Need API credentials?</strong>
              </p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Visit the Last.fm API page</li>
                <li>Create a new application</li>
                <li>Copy your API key and secret</li>
                <li>Paste them above</li>
              </ol>
              <a
                href="https://www.last.fm/api/account/create"
                target="_blank"
                rel="noopener noreferrer"
                className="interactive inline-flex items-center space-x-2 text-rock-accent hover:text-red-400 transition-colors"
              >
                <span>Get API credentials</span>
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-rock-gray">
          <div className="flex items-center space-x-2">
            {saved && (
              <span className="text-green-400 text-sm font-medium">✓ Settings saved!</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="interactive px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="interactive bg-rock-accent hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              <Save size={16} />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 