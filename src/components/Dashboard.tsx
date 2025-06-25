import React, { useState, useEffect } from 'react';
import { Track, LastFMComparison, Settings } from '@/types';
import { Music, Album, User, Search, ExternalLink, Settings as SettingsIcon, Play, Download } from 'lucide-react';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';
import SettingsModal from './Settings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  scanResult: Track[];
  onAnalyze: () => void;
  hasScanned?: boolean;
  error?: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ scanResult, onAnalyze, hasScanned = false, error: propError = null }) => {
  const [comparison, setComparison] = useState<LastFMComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(propError);
  const [activeTab, setActiveTab] = useState<'overview' | 'missing' | 'albums' | 'songs'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({});

  const stats = {
    totalTracks: scanResult.length,
    totalArtists: new Set(scanResult.map(t => t.artist)).size,
    totalAlbums: new Set(scanResult.map(t => `${t.artist} - ${t.album}`)).size,
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Remove auto-analysis - user will trigger manually

  const LastFMLoadingSpinner: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    
    const lastfmLoadingMessages = [
      "🎤 Analyzing your collection with Last.fm...",
      "📊 Fetching top tracks and albums...",
      "🔍 Comparing with global music trends...",
      "🎯 Finding missing chart-toppers...",
      "🌟 Discovering popular releases...",
      "📈 Analyzing listening patterns...",
      "🎵 Cross-referencing with Last.fm database...",
      "🎸 Scanning for hidden classics...",
      "💿 Checking album completeness...",
      "🎧 Evaluating your music taste...",
      "🔥 Hunting for trending tracks...",
      "📻 Tuning into popular frequencies...",
      "🎶 Harmonizing with the music community...",
      "🎺 Jazz-ing up the Last.fm connection...",
      "🥁 Beating through the charts...",
      "🎹 Playing the keys to discovery..."
    ];

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % lastfmLoadingMessages.length);
      }, 2500); // Slightly slower rotation for Last.fm messages

      return () => clearInterval(interval);
    }, [lastfmLoadingMessages.length]);

    return (
      <div className="flex flex-col items-center justify-center space-y-8 px-8">
        {/* Logo */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm">
          <Image 
            src="./icon.png" 
            alt="Music Scan Pro" 
            width={64} 
            height={64} 
            className="rounded-full"
            priority
            unoptimized
          />
        </div>
        
        {/* App Title */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold gradient-text">Last.fm Analysis</h2>
          <p className="text-gray-400 text-sm">Connecting with the global music community</p>
        </div>
        
        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-rock-gray border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-rock-gold rounded-full animate-spin animation-delay-150"></div>
        </div>
        
        {/* Loading Message */}
        <div className="text-center space-y-2 max-w-md">
          <p className="text-white text-lg font-medium animate-pulse">{lastfmLoadingMessages[currentMessageIndex]}</p>
          <div className="w-48 h-1 bg-rock-gray rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-rock-gold rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Fun fact */}
        <p className="text-gray-500 text-xs italic max-w-sm text-center">
          🎵 Last.fm has tracked over 1 trillion songs since 2002!
        </p>
      </div>
    );
  };

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

  const handleLastFMAnalysis = async () => {
    if (!window.electronAPI) {
      setError('Electron API not available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.compareWithLastFM(scanResult, settings.lastfmApiKey);
      
      if (result.error) {
        setError(result.error);
      } else if (result.result) {
        setComparison(result.result);
      }
    } catch (err) {
      setError('Failed to analyze with Last.fm');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleExportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(220, 38, 127); // Rock accent color
    doc.text('Music Collection Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Collection Overview
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Collection Overview', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.text(`Total Tracks: ${stats.totalTracks}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Total Artists: ${stats.totalArtists}`, 25, yPosition);
    yPosition += 7;
    doc.text(`Total Albums: ${stats.totalAlbums}`, 25, yPosition);
    yPosition += 20;

    if (comparison) {
      // Missing Tracks
      if (comparison.missing_tracks.length > 0) {
        doc.setFontSize(16);
        doc.text('Missing Tracks', 20, yPosition);
        yPosition += 10;

        const missingTracksData = comparison.missing_tracks.slice(0, 50).map(track => [
          track.artist,
          track.album,
          track.track
        ]);

        autoTable(doc, {
          head: [['Artist', 'Album', 'Track']],
          body: missingTracksData,
          startY: yPosition,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [220, 38, 127] },
          margin: { left: 20, right: 20 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // New Albums
      if (comparison.new_albums.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('New Albums to Explore', 20, yPosition);
        yPosition += 10;

        const newAlbumsData = comparison.new_albums.slice(0, 30).map(album => [
          album.artist,
          album.album,
          album.playcount.toLocaleString()
        ]);

        autoTable(doc, {
          head: [['Artist', 'Album', 'Play Count']],
          body: newAlbumsData,
          startY: yPosition,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [34, 197, 94] },
          margin: { left: 20, right: 20 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // New Songs
      if (comparison.new_songs.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.text('New Songs & Singles', 20, yPosition);
        yPosition += 10;

        const newSongsData = comparison.new_songs.slice(0, 30).map(song => [
          song.artist,
          song.track,
          song.playcount.toLocaleString()
        ]);

        autoTable(doc, {
          head: [['Artist', 'Track', 'Play Count']],
          body: newSongsData,
          startY: yPosition,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 20, right: 20 }
        });
      }

      // Summary footer
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Analysis Summary', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`• Found ${comparison.missing_tracks.length} missing tracks from your artists`, 25, 50);
      doc.text(`• Discovered ${comparison.new_albums.length} new albums to explore`, 25, 65);
      doc.text(`• Identified ${comparison.new_songs.length} new singles and popular tracks`, 25, 80);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Music Scan Pro', pageWidth / 2, 280, { align: 'center' });
    } else {
      // No analysis yet
      doc.setFontSize(14);
      doc.text('No Last.fm analysis performed yet.', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(12);
      doc.text('Run "Analyze with Last.fm" to discover missing tracks and new releases.', 20, yPosition);
    }

    // Save the PDF
    const fileName = `music-collection-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleTrackClick = async (artist: string, track: string) => {
    // Create Last.fm URL for the track
    const encodedArtist = encodeURIComponent(artist);
    const encodedTrack = encodeURIComponent(track);
    const lastfmUrl = `https://www.last.fm/music/${encodedArtist}/_/${encodedTrack}`;
    
    // Open in external browser
    if (window.electronAPI) {
      await window.electronAPI.openExternal(lastfmUrl);
    } else {
      // Fallback for development
      window.open(lastfmUrl, '_blank');
    }
  };

  const handleAlbumClick = async (artist: string, album: string) => {
    // Create Last.fm URL for the album
    const encodedArtist = encodeURIComponent(artist);
    const encodedAlbum = encodeURIComponent(album);
    const lastfmUrl = `https://www.last.fm/music/${encodedArtist}/${encodedAlbum}`;
    
    // Open in external browser
    if (window.electronAPI) {
      await window.electronAPI.openExternal(lastfmUrl);
    } else {
      // Fallback for development
      window.open(lastfmUrl, '_blank');
    }
  };

  const getTotalMissingTracks = () => {
    return comparison?.missing_tracks.length || 0;
  };

  const getTotalNewAlbums = () => {
    return comparison?.new_albums.length || 0;
  };

  const getTotalNewSongs = () => {
    return comparison?.new_songs.length || 0;
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Collection Stats */}
      <div className="music-card bg-rock-dark rounded-lg p-6 md:col-span-3">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <Music className="mr-2" size={24} />
          Your Collection
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-rock-accent">{stats.totalTracks}</div>
            <div className="text-gray-400">Tracks</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-rock-gold">{stats.totalArtists}</div>
            <div className="text-gray-400">Artists</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-500">{stats.totalAlbums}</div>
            <div className="text-gray-400">Albums</div>
          </div>
        </div>
      </div>

      {comparison && (
        <>
          <button
            onClick={() => setActiveTab('missing')}
            className="interactive music-card bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Search className="text-rock-accent" size={24} />
              <h3 className="text-lg font-semibold text-white">Missing Tracks</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-rock-accent mb-2">
                {getTotalMissingTracks()}
              </div>
              <p className="text-gray-400 text-sm">popular tracks you don&apos;t have</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('albums')}
            className="interactive music-card bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Album className="text-green-500" size={24} />
              <h3 className="text-lg font-semibold text-white">New Albums</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {getTotalNewAlbums()}
              </div>
              <p className="text-gray-400 text-sm">new albums to explore</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('songs')}
            className="interactive music-card bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Music className="text-purple-500" size={24} />
              <h3 className="text-lg font-semibold text-white">New Songs</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {getTotalNewSongs()}
              </div>
              <p className="text-gray-400 text-sm">new singles &amp; popular tracks</p>
            </div>
          </button>
        </>
      )}
    </div>
  );

  const renderMissingTracks = () => {
    if (!comparison) {
      return (
        <div className="text-center py-12">
          <Search className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
          <p className="text-gray-400 mb-6">
            Click &quot;Analyze with Last.fm&quot; to discover missing tracks from your collection
          </p>
          <button
            onClick={handleLastFMAnalysis}
            disabled={loading}
            className="bg-rock-accent text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze with Last.fm'}
          </button>
        </div>
      );
    }

    // Group missing tracks by artist and album
    const groupedTracks = comparison.missing_tracks.reduce((acc, track) => {
      if (!acc[track.artist]) {
        acc[track.artist] = {};
      }
      if (!acc[track.artist][track.album]) {
        acc[track.artist][track.album] = [];
      }
      acc[track.artist][track.album].push(track.track);
      return acc;
    }, {} as Record<string, Record<string, string[]>>);

    return (
      <div className="space-y-6">
        {Object.keys(groupedTracks).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No missing tracks found! Your collection is complete.</p>
          </div>
        )}
        {Object.entries(groupedTracks).map(([artist, albums]) => {
          const missingCount = Object.values(albums).reduce((sum, tracks) => sum + tracks.length, 0);

          return (
            <div key={artist} className="music-card bg-rock-dark rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <User className="text-rock-accent" size={20} />
                <h3 className="text-xl font-semibold text-white">{artist}</h3>
                <span className="bg-rock-accent text-white text-xs px-2 py-1 rounded-full">
                  {missingCount} missing
                </span>
              </div>
              
              <div className="space-y-4">
                {Object.entries(albums).map(([album, tracks]) => (
                  <div key={album} className="border-l-2 border-rock-gray pl-4">
                    <h4 className="text-lg font-medium text-rock-gold mb-2">{album}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tracks.map((track, index) => (
                        <button
                          key={index}
                          onClick={() => handleTrackClick(artist, track)}
                          className="interactive text-gray-300 text-sm bg-rock-gray rounded px-3 py-2 hover:bg-rock-light transition-colors text-left flex items-center justify-between group"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-rock-accent rounded flex items-center justify-center">
                              <Music size={16} className="text-white" />
                            </div>
                            <span>{track}</span>
                          </div>
                          <Play size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderNewAlbums = () => {
    if (!comparison) {
      return (
        <div className="text-center py-12">
          <Album className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
          <p className="text-gray-400 mb-6">
            Click &quot;Analyze with Last.fm&quot; to discover new albums from your artists
          </p>
          <button
            onClick={handleLastFMAnalysis}
            disabled={loading}
            className="bg-rock-accent text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze with Last.fm'}
          </button>
        </div>
      );
    }

    // Group new albums by artist
    const groupedAlbums = comparison.new_albums.reduce((acc, album) => {
      if (!acc[album.artist]) {
        acc[album.artist] = [];
      }
      acc[album.artist].push(album);
      return acc;
    }, {} as Record<string, typeof comparison.new_albums>);

    return (
      <div className="space-y-6">
        {Object.keys(groupedAlbums).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No new albums found. You&apos;re up to date!</p>
          </div>
        )}
        {Object.entries(groupedAlbums).map(([artist, albums]) => (
          <div key={artist} className="music-card bg-rock-dark rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="text-green-500" size={20} />
              <h3 className="text-xl font-semibold text-white">{artist}</h3>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {albums.length} new
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {albums.map((album, index) => (
                <button
                  key={index}
                  onClick={() => handleAlbumClick(album.artist, album.album)}
                  className="interactive bg-rock-gray rounded-lg p-4 hover:bg-rock-light transition-colors text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center">
                        <Album size={20} className="text-white" />
                      </div>
                      <span className="text-white font-medium">{album.album}</span>
                    </div>
                    <ExternalLink size={16} className="text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400">
                    {album.playcount.toLocaleString()} plays
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNewSongs = () => {
    if (!comparison) {
      return (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
          <p className="text-gray-400 mb-6">
            Click &quot;Analyze with Last.fm&quot; to discover new singles and popular tracks
          </p>
          <button
            onClick={handleLastFMAnalysis}
            disabled={loading}
            className="bg-rock-accent text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze with Last.fm'}
          </button>
        </div>
      );
    }

    // Group new songs by artist
    const groupedSongs = comparison.new_songs.reduce((acc, song) => {
      if (!acc[song.artist]) {
        acc[song.artist] = [];
      }
      acc[song.artist].push(song);
      return acc;
    }, {} as Record<string, typeof comparison.new_songs>);

    return (
      <div className="space-y-6">
        {Object.keys(groupedSongs).length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No new songs found. You have all the popular tracks!</p>
          </div>
        )}
        {Object.entries(groupedSongs).map(([artist, songs]) => (
          <div key={artist} className="music-card bg-rock-dark rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="text-purple-500" size={20} />
              <h3 className="text-xl font-semibold text-white">{artist}</h3>
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {songs.length} new
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {songs.map((song, index) => (
                <button
                  key={index}
                  onClick={() => handleTrackClick(song.artist, song.track)}
                  className="interactive bg-rock-gray rounded-lg p-4 hover:bg-rock-light transition-colors text-left w-full"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-500 rounded flex items-center justify-center">
                        <Music size={20} className="text-white" />
                      </div>
                      <span className="text-white font-medium">{song.track}</span>
                    </div>
                    <Play size={16} className="text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-400">
                    {song.playcount.toLocaleString()} plays
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6" style={{ height: '100%' }}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold gradient-text">Music Collection Analysis</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowSettings(true)}
            className="interactive bg-rock-gray text-white px-4 py-2 rounded-lg hover:bg-rock-light transition-colors flex items-center space-x-2"
            title="Settings"
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </button>
          <button
            onClick={handleExportToPDF}
            disabled={!comparison}
            className={`interactive px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
              comparison 
                ? 'bg-green-600 text-white hover:bg-green-500' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            title={comparison ? "Export to PDF" : "Run analysis first to export"}
          >
            <Download size={18} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => {
              setComparison(null);
              onAnalyze();
            }}
            className="interactive bg-rock-gray text-white px-4 py-2 rounded-lg hover:bg-rock-light transition-colors"
          >
            Scan New Folder
          </button>
          <button
            onClick={handleLastFMAnalysis}
            disabled={loading || scanResult.length === 0}
            className="interactive bg-rock-accent text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : (comparison ? 'Re-analyze with Last.fm' : 'Analyze with Last.fm')}
          </button>
        </div>
      </div>

      <div className="space-y-4 flex-shrink-0">
        {settings.lastfmApiKey && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-3">
            <p className="text-green-200 text-sm">✓ Using custom Last.fm API key</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-12 flex-1 bg-gradient-to-b from-transparent via-rock-dark/20 to-transparent rounded-lg">
          <LastFMLoadingSpinner />
        </div>
      )}

      {scanResult.length > 0 && !loading && (
        <div className="flex-1 flex flex-col">
          <div className="flex space-x-4 border-b border-rock-gray mb-4">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'missing', label: `Missing Tracks (${getTotalMissingTracks()})` },
              { key: 'albums', label: `New Albums (${getTotalNewAlbums()})` },
              { key: 'songs', label: `New Songs (${getTotalNewSongs()})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`interactive px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-rock-accent text-rock-accent'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div 
            className="scrollable custom-scrollbar" 
            style={{ 
              height: 'calc(100vh - 250px)', 
              overflowY: 'auto', 
              paddingRight: '8px',
              paddingTop: '16px'
            }}
          >
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'missing' && renderMissingTracks()}
            {activeTab === 'albums' && renderNewAlbums()}
            {activeTab === 'songs' && renderNewSongs()}
          </div>
        </div>
      )}

      {scanResult.length === 0 && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mt-8 overflow-hidden bg-white/10 backdrop-blur-sm shadow-lg">
                <Image 
                  src="./icon.png" 
                  alt="Music Scan Pro" 
                  width={96} 
                  height={96} 
                  className="rounded-full"
                  priority
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-3">Welcome to Music Scan Pro</h2>
                <p className="text-gray-400 mb-6">
                  Start by scanning your music folder to analyze your collection with Last.fm
                </p>
                <div className="text-sm text-gray-500 space-y-2 text-left">
                  <p>• Supports MP3 files with ID3 tags</p>
                  <p>• Finds missing tracks from your favorite albums</p>
                  <p>• Discovers new releases from your artists</p>
                  <p>• Shows popular singles you might be missing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
      />
    </div>
  );
};

export default Dashboard; 