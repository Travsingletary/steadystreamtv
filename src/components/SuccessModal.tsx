
import React, { useState, useEffect } from 'react';
import { PlaylistOptimizer } from '@/services/PlaylistOptimizer';
import { detectDevice } from '@/utils/deviceDetection';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: any;
  activationCode: string;
  playlistUrl: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  userData, 
  activationCode, 
  playlistUrl 
}) => {
  const [optimizedPlaylist, setOptimizedPlaylist] = useState<any>(null);
  const [deviceType, setDeviceType] = useState<string>('android');

  useEffect(() => {
    if (isOpen && userData) {
      const detectedDevice = detectDevice();
      setDeviceType(detectedDevice);
      
      // Generate optimized playlist
      const optimization = PlaylistOptimizer.generateOptimizedM3U(
        userData.preferences || { categories: ['Sports', 'Movies', 'News'], quality: 'HD' },
        detectedDevice,
        playlistUrl
      );
      
      setOptimizedPlaylist(optimization);
    }
  }, [isOpen, userData, playlistUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadOptimizedPlaylist = () => {
    if (!optimizedPlaylist) return;
    
    const downloadUrl = PlaylistOptimizer.createDownloadableM3U(optimizedPlaylist.m3uContent);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `steadystream-optimized-${deviceType}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full bg-gray-800 rounded-xl p-8 shadow-2xl max-h-screen overflow-y-auto">
        
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 You're All Set!</h2>
          <p className="text-gray-300">Welcome to SteadyStream TV, {userData.name}!</p>
          <p className="text-sm text-yellow-400 mt-2">✅ Account created ✅ Playlist optimized ✅ Email sent</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activation Code */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">📱 Your Activation Code</h3>
            <div className="text-3xl font-mono text-center py-4 bg-gray-900 rounded border border-gray-600">
              <span className="text-green-400 tracking-wider">{activationCode}</span>
            </div>
            <button 
              onClick={() => copyToClipboard(activationCode)}
              className="mt-2 w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded"
            >
              📋 Copy Activation Code
            </button>
          </div>

          {/* Device Detection & Optimization */}
          <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">🎯 Optimized for Your Device</h3>
            <div className="bg-gray-900 p-3 rounded border border-gray-600 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Detected Device:</span>
                <span className="text-blue-400 font-medium capitalize">{deviceType.replace('-', ' ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-300">Optimized Channels:</span>
                <span className="text-green-400 font-medium">{optimizedPlaylist?.channelCount || 0}</span>
              </div>
            </div>
            <button 
              onClick={downloadOptimizedPlaylist}
              className="w-full text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              📥 Download Optimized Playlist
            </button>
          </div>
        </div>

        {/* Playlist URLs */}
        <div className="bg-gray-700 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔗 Your Playlist Options</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Standard Playlist URL:</label>
              <div className="bg-gray-900 p-3 rounded border border-gray-600">
                <code className="text-sm text-green-400 break-all">{playlistUrl}</code>
              </div>
              <button 
                onClick={() => copyToClipboard(playlistUrl)}
                className="mt-2 w-full text-sm bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
              >
                📋 Copy Standard URL
              </button>
            </div>

            {optimizedPlaylist && (
              <div>
                <label className="text-sm font-medium text-blue-300 mb-2 block">
                  Optimized Playlist (Recommended for {deviceType.replace('-', ' ')}):
                </label>
                <div className="bg-gray-900 p-3 rounded border border-blue-600">
                  <p className="text-sm text-blue-400">✨ Device-optimized streaming parameters included</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Enhanced buffering, quality settings, and codec optimizations
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="bg-gray-700 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">⚡ Quick Setup (60 seconds)</h3>
          <ol className="list-decimal list-inside space-y-3 text-sm text-gray-300">
            <li>
              <strong className="text-white">Download TiviMate:</strong> Use code{' '}
              <span className="bg-gray-900 px-2 py-1 rounded font-mono">1592817</span> at aftv.news/1592817
            </li>
            <li>
              <strong className="text-white">Open TiviMate:</strong> Select "Add Playlist" → "M3U Playlist"
            </li>
            <li>
              <strong className="text-white">Enter your code:</strong> Use activation code{' '}
              <span className="text-green-400 font-mono">{activationCode}</span>
            </li>
            <li>
              <strong className="text-white">Add playlist URL:</strong> Paste the URL from above (use optimized version)
            </li>
            <li>
              <strong className="text-white">Start streaming:</strong> Enjoy thousands of channels! 🎬
            </li>
          </ol>
        </div>

        {/* Device-Specific Recommendations */}
        {optimizedPlaylist?.recommendations && (
          <div className="bg-gray-700 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3 text-blue-400">
              💡 {deviceType.replace('-', ' ')} Optimization Tips
            </h3>
            <ul className="space-y-2">
              {optimizedPlaylist.recommendations.map((tip: string, index: number) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* QR Code */}
        <div className="bg-gray-700 p-6 rounded-lg text-center mb-6">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">📲 Scan for Mobile Setup</h3>
          <div className="bg-white p-4 rounded-lg inline-block">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(playlistUrl)}`} 
              alt="Playlist QR Code" 
              className="w-48 h-48"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">Point your phone camera at this code</p>
        </div>

        {/* Support */}
        <div className="text-center bg-gradient-to-r from-green-600 to-green-700 p-4 rounded-lg">
          <p className="text-white font-medium">
            ✉️ Setup instructions sent to {userData.email}
          </p>
          <p className="text-green-100 text-sm mt-1">
            Need help? Email support@steadystream.tv • Live chat available 24/7
          </p>
        </div>
      </div>
    </div>
  );
};
