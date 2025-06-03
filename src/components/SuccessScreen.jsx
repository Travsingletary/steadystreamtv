
import React from 'react';

const SuccessScreen = ({ userData, activationCode, playlistUrl, onReset }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8 shadow-2xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-green-400 mb-2">🎉 You're All Set!</h2>
        <p className="text-gray-300">Welcome to SteadyStream TV, {userData.name}!</p>
      </div>

      <div className="space-y-6">
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

        {/* Playlist URL */}
        <div className="bg-gray-700 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 text-yellow-400">🔗 Your Playlist URL</h3>
          <div className="bg-gray-900 p-3 rounded border border-gray-600">
            <code className="text-sm text-green-400 break-all">{playlistUrl}</code>
          </div>
          <button 
            onClick={() => copyToClipboard(playlistUrl)}
            className="mt-2 w-full text-sm bg-yellow-600 hover:bg-yellow-700 text-black font-medium py-2 px-4 rounded"
          >
            📋 Copy Playlist URL
          </button>
        </div>

        {/* Setup Instructions */}
        <div className="bg-gray-700 p-6 rounded-lg">
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
              <strong className="text-white">Add playlist URL:</strong> Paste the URL from above
            </li>
            <li>
              <strong className="text-white">Start streaming:</strong> Enjoy thousands of channels! 🎬
            </li>
          </ol>
        </div>

        {/* QR Code */}
        <div className="bg-gray-700 p-6 rounded-lg text-center">
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
            Need help? Email support@steadystreamtv.com
          </p>
        </div>

        {/* Reset */}
        {onReset && (
          <div className="text-center pt-4">
            <button 
              onClick={onReset}
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              ← Register Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessScreen;
