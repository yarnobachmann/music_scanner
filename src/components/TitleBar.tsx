import React from 'react';
import { Minus, Square, X } from 'lucide-react';

const TitleBar: React.FC = () => {
  const handleClose = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.windowClose();
    }
  };

  const handleMinimize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.windowMinimize();
    }
  };

  const handleMaximize = () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.windowMaximize();
    }
  };

  return (
    <div className="title-bar flex justify-between items-center h-12 bg-rock-black border-b border-rock-gray px-4">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-rock-accent rounded-full"></div>
        <span className="text-white font-semibold text-sm">Music Scan Pro</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={handleMinimize}
          className="interactive p-2 hover:bg-rock-gray rounded transition-colors"
          title="Minimize"
        >
          <Minus size={14} className="text-gray-400" />
        </button>
        <button
          onClick={handleMaximize}
          className="interactive p-2 hover:bg-rock-gray rounded transition-colors"
          title="Maximize"
        >
          <Square size={14} className="text-gray-400" />
        </button>
        <button
          onClick={handleClose}
          className="interactive p-2 hover:bg-red-600 rounded transition-colors"
          title="Close"
        >
          <X size={14} className="text-gray-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default TitleBar; 