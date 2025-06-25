
import React, { useState } from 'react';
import { enhancedMegaOTTService } from '@/services/enhancedMegaOTTService';
import Navbar from '@/components/Navbar';
import FooterSection from '@/components/FooterSection';

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

const MegaOTTTestPage = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const tests = [
      {
        name: 'Get User Info',
        fn: () => enhancedMegaOTTService.getUserInfo()
      },
      {
        name: 'Get Credits',
        fn: () => enhancedMegaOTTService.getCredits()
      },
      {
        name: 'Test Connection',
        fn: () => enhancedMegaOTTService.testConnection()
      },
      {
        name: 'Get Packages',
        fn: () => enhancedMegaOTTService.getPackages()
      },
      {
        name: 'Direct API Test - MegaOTT Main',
        fn: () => fetch('https://megaott.net/api/user/info', {
          headers: { 
            'Authorization': 'Bearer 338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d',
            'Accept': 'application/json'
          }
        }).then(r => ({ status: r.status, ok: r.ok }))
      },
      {
        name: 'Direct API Test - Panel URL',
        fn: () => fetch('https://gangstageeks.com/tivimate/rs6/steady/api/user/info', {
          headers: { 
            'Authorization': 'Bearer 338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d',
            'Accept': 'application/json'
          }
        }).then(r => ({ status: r.status, ok: r.ok }))
      }
    ];

    for (const test of tests) {
      const result: TestResult = {
        test: test.name,
        status: 'pending'
      };
      
      setResults(prev => [...prev, result]);

      const startTime = Date.now();
      
      try {
        const testResult = await test.fn();
        const duration = Date.now() - startTime;
        
        setResults(prev => prev.map(r => 
          r.test === test.name 
            ? { ...r, status: 'success', result: testResult, duration }
            : r
        ));
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        setResults(prev => prev.map(r => 
          r.test === test.name 
            ? { ...r, status: 'error', error: error.message, duration }
            : r
        ));
      }
    }

    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="pt-16">
        <div className="min-h-screen bg-zinc-950 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-white">MegaOTT API Test Suite</h1>
            
            <div className="mb-8">
              <button
                onClick={runTests}
                disabled={testing}
                className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
              >
                {testing ? 'Running Tests...' : 'Run All Tests'}
              </button>
            </div>

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-lg border-2 ${
                    result.status === 'success' ? 'bg-green-900/20 border-green-500' :
                    result.status === 'error' ? 'bg-red-900/20 border-red-500' :
                    'bg-yellow-900/20 border-yellow-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{result.test}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${
                        result.status === 'success' ? 'text-green-400' :
                        result.status === 'error' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {result.status === 'success' ? '✅ Success' :
                         result.status === 'error' ? '❌ Failed' :
                         '⏳ Running...'}
                      </span>
                      {result.duration && (
                        <span className="text-xs text-gray-500">
                          ({result.duration}ms)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="mt-2 p-3 bg-red-900/30 rounded text-red-300 text-sm font-mono">
                      {result.error}
                    </div>
                  )}
                  
                  {result.result && (
                    <div className="mt-2 p-3 bg-gray-800 rounded">
                      <pre className="text-xs text-gray-300 overflow-x-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {results.length === 0 && (
              <div className="text-center text-gray-500 py-12">
                Click "Run All Tests" to start testing MegaOTT API endpoints
              </div>
            )}

            {/* Troubleshooting Section */}
            <div className="mt-12 bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-white">🔧 Troubleshooting Tips</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Make sure your API key is valid and has not expired</li>
                <li>• Check if your IP address is whitelisted in the MegaOTT panel</li>
                <li>• Verify that your reseller account has sufficient credits</li>
                <li>• Try accessing the panel URL directly: <a href="https://gangstageeks.com/tivimate/rs6/steady/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">gangstageeks.com/tivimate/rs6/steady/</a></li>
                <li>• Contact MegaOTT support if endpoints continue to fail</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default MegaOTTTestPage;
