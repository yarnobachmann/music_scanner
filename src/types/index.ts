export interface Track {
  artist: string;
  album: string;
  track: string;
  file?: string;
}

export interface ScanResult {
  tracks: Track[];
  totalFiles: number;
  artistCount: number;
  albumCount: number;
}

export interface LastFMComparison {
  missing_tracks: {
    artist: string;
    album: string;
    track: string;
    year?: number;
  }[];
  new_albums: {
    artist: string;
    album: string;
    playcount: number;
    year?: number;
  }[];
  new_songs: {
    artist: string;
    track: string;
    playcount: number;
    year?: number;
  }[];
  recommendations?: {
    artist: string;
    similarity: number;
    listeners: number;
    playcount: number;
    tags: string[];
    image?: string;
  }[];
  total_local_tracks: number;
  total_artists: number;
}

export interface Settings {
  lastfmApiKey?: string;
  lastfmSecret?: string;
}

export interface ElectronAPI {
  selectFolderAndScan: () => Promise<{
    canceled?: boolean;
    result?: Track[];
    error?: string;
    raw?: string;
  }>;
  compareWithLastFM: (scanResult: Track[], apiKey?: string) => Promise<{
    result?: LastFMComparison;
    error?: string;
    raw?: string;
  }>;
  getSettings: () => Promise<{
    result?: Settings;
    error?: string;
  }>;
  saveSettings: (settings: Settings) => Promise<{
    success?: boolean;
    error?: string;
  }>;
  windowClose: () => void;
  windowMinimize: () => void;
  windowMaximize: () => void;
  openExternal: (url: string) => Promise<{
    success?: boolean;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 