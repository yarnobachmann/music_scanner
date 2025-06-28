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
  const [activeTab, setActiveTab] = useState<'overview' | 'missing' | 'albums' | 'songs' | 'recommendations'>('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<Settings>({});
  const [savedKey, setSavedKey] = useState(false);

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
    // Require API key before running analysis
    if (!settings.lastfmApiKey) {
      setError('Please configure your Last.fm API key in Settings.');
      setShowSettings(true);
      return;
    }
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
    if (newSettings.lastfmApiKey) {
      setSavedKey(true);
      setTimeout(() => setSavedKey(false), 2000);
    }
  };

  const handleExportToPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 30;

    // Epic Header with rock styling
    doc.setFillColor(30, 30, 30); // Dark background
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Main title with gradient effect (simulated with color)
    doc.setFontSize(24);
    doc.setTextColor(220, 38, 127); // Rock accent color
    doc.text('MUSIC COLLECTION', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text('ANALYSIS REPORT', pageWidth / 2, 40, { align: 'center' });
    
    // Date with style
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, pageWidth / 2, 52, { align: 'center' });
    
    yPosition = 80;

    // Get top 3 artists by track count
    const artistTrackCounts = scanResult.reduce((acc, track) => {
      acc[track.artist] = (acc[track.artist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topArtists = Object.entries(artistTrackCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    // Top Artists Section with refined style
    if (topArtists.length > 0) {
      // Section header
      doc.setFillColor(255, 250, 250);
      doc.roundedRect(15, yPosition - 5, pageWidth - 30, 30, 5, 5, 'F');
      
      // Add accent border
      doc.setDrawColor(220, 38, 127);
      doc.setLineWidth(3);
      doc.line(20, yPosition - 2, 80, yPosition - 2);
      
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 127);
      doc.text('Top Artists in Your Collection', 25, yPosition + 12);
      
      yPosition += 40;
      
      // Create elegant boxes for top artists
      topArtists.forEach((artist, index) => {
        const [artistName, trackCount] = artist;
        const boxY = yPosition + (index * 30);
        
        // Artist box with subtle styling
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(20, boxY - 5, pageWidth - 40, 25, 5, 5, 'F');
        
        // Subtle border
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, boxY - 5, pageWidth - 40, 25, 5, 5, 'S');
        
        // Rank badge with refined colors
        const badgeColors = [
          [220, 38, 127], // Pink for #1
          [100, 100, 100], // Gray for #2
          [139, 69, 19]    // Brown for #3
        ];
        
        doc.setFillColor(badgeColors[index][0], badgeColors[index][1], badgeColors[index][2]);
        doc.circle(35, boxY + 7.5, 10, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(`${index + 1}`, 35, boxY + 11, { align: 'center' });
        
        // Artist name
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(artistName.length > 35 ? artistName.substring(0, 35) + '...' : artistName, 55, boxY + 11);
        
        // Track count with refined styling
        doc.setFontSize(12);
        doc.setTextColor(120, 120, 120);
        doc.text(`${trackCount} tracks`, pageWidth - 30, boxY + 11, { align: 'right' });
        
        // Top indicator for #1
        if (index === 0) {
          doc.setFontSize(10);
          doc.setTextColor(255, 215, 0);
          doc.text('TOP', pageWidth - 55, boxY + 11);
        }
      });
      
      yPosition += (topArtists.length * 30) + 20;
    }

    // Collection Overview with rock styling
    doc.setFillColor(45, 45, 45);
    doc.roundedRect(15, yPosition - 5, pageWidth - 30, 45, 5, 5, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(220, 38, 127);
    doc.text('COLLECTION OVERVIEW', 25, yPosition + 10);
    
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text(`Total Tracks: ${stats.totalTracks.toLocaleString()}`, 30, yPosition + 25);
    doc.text(`Total Artists: ${stats.totalArtists.toLocaleString()}`, 30, yPosition + 35);
    doc.text(`Total Albums: ${stats.totalAlbums.toLocaleString()}`, pageWidth - 30, yPosition + 25, { align: 'right' });
    
    yPosition += 60;



    if (comparison) {
      // Missing Tracks with epic styling
      if (comparison.missing_tracks.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        // Section header with refined style
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, yPosition - 5, pageWidth - 30, 30, 5, 5, 'F');
        
        // Add accent border
        doc.setDrawColor(220, 38, 127);
        doc.setLineWidth(2);
        doc.line(20, yPosition - 2, 60, yPosition - 2);
        
        doc.setFontSize(16);
        doc.setTextColor(220, 38, 127);
        doc.text('Missing Tracks to Complete Your Collection', 25, yPosition + 8);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${comparison.missing_tracks.length} popular tracks you might want to add`, 25, yPosition + 18);
        
        yPosition += 35;

        // Group missing tracks by artist
        const tracksByArtist = comparison.missing_tracks.reduce((acc, track) => {
          if (!acc[track.artist]) {
            acc[track.artist] = [];
          }
          acc[track.artist].push(track);
          return acc;
        }, {} as Record<string, typeof comparison.missing_tracks>);

        // Sort artists alphabetically
        const sortedArtists = Object.keys(tracksByArtist).sort();

        // Render each artist section
        for (const artist of sortedArtists) {
          const tracks = tracksByArtist[artist];
          
          // Check if we need a new page for the artist header
          if (yPosition + 25 > pageHeight - 50) {
            doc.addPage();
            yPosition = 30;
          }

          // Artist header
          doc.setFillColor(250, 248, 255);
          doc.roundedRect(20, yPosition - 2, pageWidth - 40, 20, 3, 3, 'F');
          
          doc.setFontSize(12);
          doc.setTextColor(220, 38, 127);
          doc.text(artist, 25, yPosition + 10);
          
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text(`${tracks.length} missing track${tracks.length > 1 ? 's' : ''}`, pageWidth - 25, yPosition + 10, { align: 'right' });
          
          yPosition += 22;

          // List tracks for this artist
          tracks.forEach((track, index) => {
            // Check if we need a new page for this track
            if (yPosition + 12 > pageHeight - 30) {
              doc.addPage();
              yPosition = 30;
            }
            
            // Track item
            doc.setFillColor(index % 2 === 0 ? 252 : 248, 252, 255);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, 12, 2, 2, 'F');
            
            // Track dot
            doc.setFillColor(220, 38, 127);
            doc.circle(30, yPosition + 4, 2, 'F');
            
            // Track info
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            const trackTitle = track.track.length > 40 ? track.track.substring(0, 37) + '...' : track.track;
            doc.text(trackTitle, 35, yPosition + 6);
            
            // Album info (right side)
            if (track.album && track.album !== 'Unknown') {
              const albumText = track.album.length > 25 ? track.album.substring(0, 22) + '...' : track.album;
              doc.setFontSize(8);
              doc.setTextColor(120, 120, 120);
              doc.text(`from: ${albumText}`, pageWidth - 25, yPosition + 6, { align: 'right' });
            }
            
            yPosition += 12;
          });
          
          yPosition += 8; // Reduced space between artists
        }
      }



      // New Songs with epic styling
      if (comparison.new_songs.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        // Section header with refined style  
        doc.setFillColor(252, 248, 255);
        doc.roundedRect(15, yPosition - 5, pageWidth - 30, 30, 5, 5, 'F');
        
        // Add accent border
        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(2);
        doc.line(20, yPosition - 2, 60, yPosition - 2);
        
        doc.setFontSize(16);
        doc.setTextColor(139, 92, 246);
        doc.text('Popular Singles & Trending Tracks', 25, yPosition + 8);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`${comparison.new_songs.length} trending tracks to add to your collection`, 25, yPosition + 18);
        
        yPosition += 35;

        // Group popular songs by artist
        const songsByArtist = comparison.new_songs.reduce((acc, song) => {
          if (!acc[song.artist]) {
            acc[song.artist] = [];
          }
          acc[song.artist].push(song);
          return acc;
        }, {} as Record<string, typeof comparison.new_songs>);

        // Sort artists alphabetically
        const sortedSongArtists = Object.keys(songsByArtist).sort();

        // Render each artist section
        for (const artist of sortedSongArtists) {
          const songs = songsByArtist[artist];
          
          // Check if we need a new page for the artist header
          if (yPosition + 25 > pageHeight - 50) {
            doc.addPage();
            yPosition = 30;
          }

          // Artist header
          doc.setFillColor(250, 245, 255);
          doc.roundedRect(20, yPosition - 2, pageWidth - 40, 20, 3, 3, 'F');
          
          doc.setFontSize(12);
          doc.setTextColor(139, 92, 246);
          doc.text(artist, 25, yPosition + 10);
          
          doc.setFontSize(9);
          doc.setTextColor(120, 120, 120);
          doc.text(`${songs.length} popular song${songs.length > 1 ? 's' : ''}`, pageWidth - 25, yPosition + 10, { align: 'right' });
          
          yPosition += 22;

          // List songs for this artist
          songs.forEach((song, index) => {
            // Check if we need a new page for this song
            if (yPosition + 12 > pageHeight - 30) {
              doc.addPage();
              yPosition = 30;
            }
            
            // Song item
            doc.setFillColor(index % 2 === 0 ? 252 : 248, 248, 255);
            doc.roundedRect(25, yPosition - 2, pageWidth - 50, 12, 2, 2, 'F');
            
            // Song dot
            doc.setFillColor(139, 92, 246);
            doc.circle(30, yPosition + 4, 2, 'F');
            
            // Song info
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            const songTitle = song.track.length > 40 ? song.track.substring(0, 37) + '...' : song.track;
            doc.text(songTitle, 35, yPosition + 6);
            
            // Play count (right side)
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text(`${song.playcount.toLocaleString()} plays`, pageWidth - 25, yPosition + 6, { align: 'right' });
            
            yPosition += 12;
          });
          
          yPosition += 8; // Reduced space between artists
        }
      }

      // Epic Summary Page
      doc.addPage();
      
      // Header for summary page
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setFontSize(22);
      doc.setTextColor(220, 38, 127);
      doc.text('ANALYSIS COMPLETE', pageWidth / 2, 30, { align: 'center' });
      
      yPosition = 70;
      
      // Summary boxes
      const summaryItems = [
        { icon: 'M', label: 'Missing Tracks Found', value: comparison.missing_tracks.length, color: [220, 38, 127] },
        { icon: 'S', label: 'Hot Singles Identified', value: comparison.new_songs.length, color: [139, 92, 246] }
      ];
      
      summaryItems.forEach((item, index) => {
        const boxY = yPosition + (index * 40);
        
        // Summary box
        doc.setFillColor(40, 40, 40);
        doc.roundedRect(20, boxY - 5, pageWidth - 40, 30, 5, 5, 'F');
        
        // Icon circle
        doc.setFillColor(item.color[0], item.color[1], item.color[2]);
        doc.circle(35, boxY + 10, 12, 'F');
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(item.icon, 35, boxY + 14, { align: 'center' });
        
        // Label and value
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text(item.label, 55, boxY + 8);
        
        doc.setFontSize(18);
        doc.setTextColor(item.color[0], item.color[1], item.color[2]);
        doc.text(item.value.toLocaleString(), pageWidth - 30, boxY + 12, { align: 'right' });
      });
      
      // Footer
      yPosition += 150;
      doc.setFontSize(14);
      doc.setTextColor(180, 180, 180);
      doc.text('Keep expanding your music collection!', pageWidth / 2, yPosition, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Music Scan Pro - Music Collection Analysis Tool', pageWidth / 2, pageHeight - 20, { align: 'center' });
    } else {
      // No analysis yet - with style
      doc.setFillColor(60, 60, 60);
      doc.roundedRect(15, yPosition, pageWidth - 30, 80, 10, 10, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 127);
      doc.text('Ready to Analyze Your Collection?', pageWidth / 2, yPosition + 30, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(180, 180, 180);
      doc.text('No Last.fm analysis performed yet.', pageWidth / 2, yPosition + 45, { align: 'center' });
      doc.text('Run "Analyze with Last.fm" to discover missing tracks and new releases!', pageWidth / 2, yPosition + 60, { align: 'center' });
    }

    // Save the PDF with professional filename
    const fileName = `Music-Collection-Analysis-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const getTotalRecommendations = () => {
    return comparison?.recommendations?.length || 0;
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Collection Stats */}
      <div className="music-card bg-rock-dark rounded-lg p-6 md:col-span-4">
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
              <h3 className="text-lg font-semibold text-white">Popular Albums</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {getTotalNewAlbums()}
              </div>
              <p className="text-gray-400 text-sm">popular albums to explore</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('songs')}
            className="interactive music-card bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Music className="text-purple-500" size={24} />
              <h3 className="text-lg font-semibold text-white">Popular Songs</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-2">
                {getTotalNewSongs()}
              </div>
              <p className="text-gray-400 text-sm">popular singles &amp; tracks</p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('recommendations')}
            className="interactive music-card bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
          >
            <div className="flex items-center space-x-3 mb-4">
              <User className="text-blue-500" size={24} />
              <h3 className="text-lg font-semibold text-white">Artist Recommendations</h3>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {getTotalRecommendations()}
              </div>
              <p className="text-gray-400 text-sm">artists similar to your taste</p>
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
                      {tracks.map((track, index) => {
                        // Find the corresponding track data to get the year
                        const trackData = comparison?.missing_tracks.find(t => 
                          t.artist === artist && t.album === album && t.track === track
                        );
                        const year = trackData?.year;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => handleTrackClick(artist, track)}
                            className="interactive text-gray-300 text-sm bg-rock-gray rounded px-3 py-2 hover:bg-rock-light transition-colors text-left flex items-center justify-between group"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-rock-accent rounded flex items-center justify-center">
                                <Music size={16} className="text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span>{track}</span>
                                {year && (
                                  <span className="text-xs text-gray-500">
                                    {year}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Play size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        );
                      })}
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
            <p className="text-gray-400">No popular albums found. You have all the hits!</p>
          </div>
        )}
        {Object.entries(groupedAlbums).map(([artist, albums]) => (
          <div key={artist} className="music-card bg-rock-dark rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="text-green-500" size={20} />
              <h3 className="text-xl font-semibold text-white">{artist}</h3>
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                {albums.length} popular
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
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{album.album}</span>
                        {album.year && (
                          <span className="text-xs text-gray-500">
                            {album.year}
                          </span>
                        )}
                      </div>
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
            <p className="text-gray-400">No popular songs found. You have all the hits!</p>
          </div>
        )}
        {Object.entries(groupedSongs).map(([artist, songs]) => (
          <div key={artist} className="music-card bg-rock-dark rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="text-purple-500" size={20} />
              <h3 className="text-xl font-semibold text-white">{artist}</h3>
              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                {songs.length} popular
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
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{song.track}</span>
                        {song.year && (
                          <span className="text-xs text-gray-500">
                            {song.year}
                          </span>
                        )}
                      </div>
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

  const renderRecommendations = () => {
    if (!comparison || !comparison.recommendations) {
      return (
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Yet</h3>
          <p className="text-gray-400 mb-6">
            Click &quot;Analyze with Last.fm&quot; to discover artists similar to your collection
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

    return (
      <div className="space-y-6">
        {comparison.recommendations.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No artist recommendations found. Your taste is too unique!</p>
          </div>
        )}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {comparison.recommendations.map((artist, index) => (
             <button
               key={index}
               onClick={() => handleTrackClick(artist.artist, '')}
               className="interactive bg-rock-dark rounded-lg p-6 hover:bg-rock-light transition-colors text-left w-full"
             >
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center overflow-hidden">
                     {artist.image ? (
                       <img 
                         src={artist.image} 
                         alt={artist.artist}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           // Fallback to user icon if image fails to load
                           const target = e.target as HTMLImageElement;
                           target.style.display = 'none';
                           target.nextElementSibling?.classList.remove('hidden');
                         }}
                       />
                     ) : null}
                     <User size={24} className={`text-white ${artist.image ? 'hidden' : ''}`} />
                   </div>
                   <div className="flex flex-col">
                     <span className="text-white font-medium text-lg">{artist.artist}</span>
                     <span className="text-xs text-blue-400">
                       {Math.round(artist.similarity * 100)}% similarity
                     </span>
                   </div>
                 </div>
                 <ExternalLink size={16} className="text-gray-400" />
               </div>
              
              <div className="space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Listeners:</span>
                  <span>{artist.listeners.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Plays:</span>
                  <span>{artist.playcount.toLocaleString()}</span>
                </div>
                {artist.tags.length > 0 && (
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-1">
                      {artist.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="bg-rock-gray text-xs px-2 py-1 rounded-full text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
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
        {/* Prompt to configure API key */}
        {!settings.lastfmApiKey && (
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-3 flex justify-between items-center">
            <p className="text-yellow-200 text-sm">⚠️ No Last.fm API key configured. Please add one in Settings.</p>
            <button onClick={() => setShowSettings(true)} className="text-yellow-100 hover:text-white underline text-sm">Open Settings</button>
          </div>
        )}
        {/* Show checkmark after saving valid key */}
        {settings.lastfmApiKey && savedKey && (
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-3 flex items-center space-x-2">
            <span className="text-green-200 text-lg">✓</span>
            <span className="text-green-200 text-sm">Last.fm API key saved!</span>
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

      {scanResult.length > 0 && !loading && !comparison && (
        <div className="mb-6">
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 md:space-x-4">
            <div className="text-blue-200 text-sm flex items-center space-x-2">
              <span>🎵 Scanning complete!</span>
              {!settings.lastfmApiKey ? (
                <span className="text-yellow-200">Add your Last.fm API key in Settings to enable analysis.</span>
              ) : (
                <span>Press <b>Analyze with Last.fm</b> to discover missing tracks, new albums, and more.</span>
              )}
            </div>
            <div className="flex space-x-2">
              {!settings.lastfmApiKey && (
                <button onClick={() => setShowSettings(true)} className="text-yellow-100 hover:text-white underline text-sm">Open Settings</button>
              )}
              <button
                onClick={handleLastFMAnalysis}
                disabled={loading}
                className="bg-rock-accent text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 text-sm"
              >
                Analyze with Last.fm
              </button>
            </div>
          </div>
        </div>
      )}

      {scanResult.length > 0 && !loading && (
        <div className="flex-1 flex flex-col">
          <div className="flex space-x-4 border-b border-rock-gray mb-4">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'missing', label: `Missing Tracks (${getTotalMissingTracks()})` },
              { key: 'albums', label: `Popular Albums (${getTotalNewAlbums()})` },
              { key: 'songs', label: `Popular Songs (${getTotalNewSongs()})` },
              { key: 'recommendations', label: `Artist Recommendations (${getTotalRecommendations()})` },
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
            {activeTab === 'recommendations' && renderRecommendations()}
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