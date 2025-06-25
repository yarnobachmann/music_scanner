import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...' }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  
  const musicLoadingMessages = [
    "🎵 Scanning your music collection...",
    "🎸 Analyzing those sweet riffs...",
    "🥁 Counting beats and rhythms...",
    "🎤 Checking for chart-toppers...",
    "🎧 Discovering hidden gems...",
    "🎹 Reading musical metadata...",
    "🎺 Jazz-ing up the analysis...",
    "🎻 Orchestrating your library...",
    "🎶 Finding your next favorite song...",
    "🎵 Tuning up the database...",
    "🎸 Rocking through your files...",
    "🎤 Mic check, one two...",
    "🎧 Dropping the bass... line scan...",
    "🥁 Keeping time with your tracks...",
    "🎹 Playing all the right notes...",
    "🎺 Trumpet-ing your collection...",
    "🎻 Stringing together your music...",
    "🎶 Dancing through directories..."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % musicLoadingMessages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [musicLoadingMessages.length]);

  const displayMessage = message === 'Loading...' ? musicLoadingMessages[currentMessageIndex] : message;

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
        <h2 className="text-2xl font-bold gradient-text">Music Scan Pro</h2>
        <p className="text-gray-400 text-sm">Your rock music analysis companion</p>
      </div>
      
      {/* Loading Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-rock-gray border-t-rock-accent rounded-full animate-spin"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-rock-gold rounded-full animate-spin animation-delay-150"></div>
      </div>
      
      {/* Loading Message */}
      <div className="text-center space-y-2 max-w-md">
        <p className="text-white text-lg font-medium animate-pulse">{displayMessage}</p>
        <div className="w-48 h-1 bg-rock-gray rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-gradient-to-r from-rock-accent to-rock-gold rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Fun fact */}
      <p className="text-gray-500 text-xs italic max-w-sm text-center">
        🎸 Did you know? The average music lover has over 2,000 songs in their collection!
      </p>
    </div>
  );
};

export default LoadingSpinner; 