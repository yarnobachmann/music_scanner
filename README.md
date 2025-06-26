# 🎸 Music Scan Pro

A powerful, rock-themed desktop music collection analyzer built with Electron, Next.js, and Last.fm integration. Scans **all music genres** with a cool rock aesthetic - discover missing tracks, find new releases, and keep your music collection legendary!

## 📦 Download

[![Latest Release](https://img.shields.io/github/v/release/yarnobachmann/music_scanner?style=for-the-badge&logo=github)](https://github.com/yarnobachmann/music_scanner/releases/latest)

**Download the latest version:**
- 🪟 **Windows**: `Music Scan Pro-Setup.exe`
- 🍎 **macOS**: `Music Scan Pro.dmg` 
- 🐧 **Linux**: `Music Scan Pro.AppImage` or `.deb`

> 📝 **Note**: Music Scan Pro analyzes music from **all genres** - rock, pop, electronic, classical, jazz, and more! The rock theme is purely aesthetic to give the app a cool, professional look.

![Music Scan Pro](https://img.shields.io/badge/Music-Scan%20Pro-DC267F?style=for-the-badge&logo=music&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Last.fm](https://img.shields.io/badge/last.fm-d51007?style=for-the-badge&logo=last.fm&logoColor=white)

## ✨ Features

- **🔍 Smart Music Analysis**: Scan your local MP3 collection (all genres) and analyze with Last.fm
- **📋 Missing Track Detection**: Find popular tracks you're missing from your favorite artists
- **🆕 New Release Discovery**: Discover latest albums and singles from artists in your collection
- **📊 Visual Dashboard**: Beautiful rock-themed interface with comprehensive statistics
- **📄 Epic PDF Reports**: Generate professional reports with top artists, missing tracks, and new releases
- **⚙️ Custom API Keys**: Use your own Last.fm API key for unlimited requests
- **🖥️ Native Desktop App**: Full offline functionality with modern Electron interface
- **🎨 Rock-Themed UI**: Dark, professional design with custom scrollbars and animations

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** 
- **Python 3.8+** (for music file scanning and Last.fm integration)
- **mutagen** Python package: `pip install mutagen requests`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/music-scan-pro.git
   cd music-scan-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run electron
   ```

   This will:
   - Start the Next.js development server
   - Launch the Electron desktop application
   - Open the Music Scan Pro interface

## 📖 How to Use

### 1. **Scan Your Music Collection**
   - Click "Select Music Folder" in the welcome screen
   - Browse to your music directory (supports MP3 files with ID3 tags)
   - Wait for the scan to complete

### 2. **Analyze with Last.fm**
   - After scanning, click "Analyze with Last.fm"
   - The app uses Last.fm's database to find:
     - **Missing tracks** from albums you already have
     - **New albums** from your artists (2000+ plays on Last.fm)
     - **New singles** and popular tracks (100+ plays)

### 3. **Explore Results**
   - **Overview Tab**: Collection statistics and summary cards
   - **Missing Tracks Tab**: Popular tracks you don't have, organized by artist/album
   - **New Albums Tab**: Recent albums to explore from your artists
   - **New Songs Tab**: Singles and popular tracks to discover

### 4. **Export Reports**
   - Click "Export PDF" to generate a comprehensive report
   - Includes collection stats, missing tracks, and new releases
   - Perfect for sharing or keeping track of your music discoveries

### 5. **Custom Last.fm API (Required)**
   - Click "Settings" to add your own Last.fm API key
   - Get unlimited requests vs. the shared default key
   - Register for your key at [Last.fm API](https://www.last.fm/api/account/create)

## 🏗️ Architecture

```
music-scan-pro/
├── main.js                 # Electron main process
├── preload.js             # Electron preload script
├── scan_music.py          # Python script for scanning MP3 files
├── lastfm_compare.py      # Python script for Last.fm API integration
├── pages/                 # Next.js pages (Pages Router)
│   ├── index.tsx         # Main application page
│   └── _app.tsx          # Next.js app wrapper
├── src/
│   ├── components/        # React components
│   │   ├── Dashboard.tsx  # Main dashboard with tabs
│   │   ├── Settings.tsx   # Settings modal
│   │   ├── TitleBar.tsx   # Custom window title bar
│   │   └── LoadingSpinner.tsx
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts      # Main types
│   │   └── jspdf-autotable.d.ts # PDF library types
│   └── styles/           # CSS and styling
│       └── globals.css   # Global styles with rock theme
├── tailwind.config.js    # Tailwind CSS configuration
├── next.config.js        # Next.js configuration
└── package.json          # Dependencies and scripts
```

## 🎵 Supported File Formats

The application scans MP3 files and extracts metadata from:
- **ID3 tags** (artist, album, title)
- **Filename parsing** (fallback when tags are missing)

Expected filename format: `Artist - Album - Title.mp3`

## ⚙️ Configuration

### Settings Storage

User settings are stored in:
- **Windows**: `%USERPROFILE%\.music-scan-pro-settings.json`
- **macOS**: `~/.music-scan-pro-settings.json` 
- **Linux**: `~/.music-scan-pro-settings.json`

## 🔧 Development

### Available Scripts

```bash
# Start development mode (Next.js + Electron)
npm run electron

# Start only Next.js development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

### Building for Production

1. **Build the Next.js app**
   ```bash
   npm run build
   ```

2. **Package with Electron Builder** (setup required)
   ```bash
   # Install electron-builder
   npm install -D electron-builder

   # Build distributables
   npm run dist
   ```

## 🎯 Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Desktop**: Electron with custom title bar and window controls
- **Backend**: Python scripts for file scanning and API integration
- **APIs**: Last.fm REST API for music metadata
- **PDF Generation**: jsPDF with autoTable for professional reports
- **Styling**: Custom rock-themed dark UI with animations

## 🐛 Troubleshooting

### Common Issues

1. **Python not found**
   - Ensure Python 3.8+ is installed and in PATH
   - Install required packages: `pip install mutagen requests`

2. **Last.fm API rate limits**
   - Add your own API key in Settings
   - Default shared key has limited requests

3. **No music files found**
   - Ensure MP3 files have proper ID3 tags
   - Check filename format: `Artist - Album - Title.mp3`

4. **Electron won't start**
   - Run `npm run dev` first to ensure Next.js builds properly
   - Check that port 3000 is available

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎸 Credits

Built with passion for music lovers who want to keep their collections complete and discover new favorites. 

Special thanks to [Last.fm](https://www.last.fm/) for their comprehensive music database and API.

---

**Rock on! 🤘** Keep your music collection legendary with Music Scan Pro. 