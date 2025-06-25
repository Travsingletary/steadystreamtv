import React, { useState, useEffect } from 'react';
import { enhancedMegaOTTService } from '@/services/enhancedMegaOTTService';

export const CreditMonitor: React.FC = () => {
  const [credits, setCredits] = useState<number>(1000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const checkCredits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userCredits = await enhancedMegaOTTService.getCredits();
      setCredits(userCredits);
      setIsOffline(false);
      setLastUpdate(new Date());
      console.log('✅ Credits updated:', userCredits);
    } catch (err: any) {
      console.error('❌ Enhanced credit check failed:', err);
      setError('Temporary service issue detected. System is operating in fallback mode.');
      setIsOffline(true);
      // Keep existing credits value
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkCredits();
    const interval = setInterval(checkCredits, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-white">Credits</h3>
        <button
          onClick={checkCredits}
          disabled={loading}
          className={`text-sm ${loading ? 'text-gray-500' : 'text-gray-400 hover:text-white'} transition-colors`}
        >
          {loading ? '🔄' : '🔃'}
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-2xl font-bold ${isOffline ? 'text-yellow-500' : 'text-green-500'}`}>
            {credits.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500">credits</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isOffline ? (
            <span className="text-xs text-yellow-500" title="Using cached data">
              📡 Offline
            </span>
          ) : (
            <span className="text-xs text-green-500" title="Connected">
              🟢 Live
            </span>
          )}
        </div>
      </div>

      {lastUpdate && (
        <div className="mt-2 text-xs text-gray-500">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <p className="text-xs text-yellow-400">
            ⚠️ {error}
          </p>
        </div>
      )}

      {credits < 100 && (
        <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
          <p className="text-xs text-yellow-400">
            ⚠️ Low credits
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditMonitor;
