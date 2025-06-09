
import React, { useState } from 'react';

// 🧪 MEGAOTT API TESTER COMPONENT

export const MegaOTTAPITester = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [testCredentials, setTestCredentials] = useState({
    username: '',
    password: ''
  });

  // Your MegaOTT API config
  const MEGAOTT_CONFIG = {
    baseUrl: 'https://megaott.net/api/v1',
    apiKey: '338|fB64PDKNmVFjbHXhCV7sf4GmCYTZKP5xApf8IC0D371dc28d'
  };

  const testAPI = async (testName, endpoint, method = 'GET', body = null, headers = {}) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    
    try {
      const defaultHeaders = {
        'Authorization': `Bearer ${MEGAOTT_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        ...headers
      };

      const response = await fetch(`${MEGAOTT_CONFIG.baseUrl}${endpoint}`, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : null
      });

      const responseText = await response.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      setResults(prev => ({
        ...prev,
        [testName]: {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          timestamp: new Date().toLocaleTimeString()
        }
      }));

    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'basic_auth',
      title: '🔐 Basic Authentication',
      description: 'Test if API key is valid',
      endpoint: '/user',
      method: 'GET'
    },
    {
      name: 'user_profile',
      title: '👤 User Profile',
      description: 'Get user profile information',
      endpoint: '/user/profile',
      method: 'GET'
    },
    {
      name: 'user_subscription',
      title: '💳 Subscription Status',
      description: 'Check subscription information',
      endpoint: '/user/subscription',
      method: 'GET'
    },
    {
      name: 'streams_list',
      title: '📺 Streams List',
      description: 'Get available streams/channels',
      endpoint: '/user/streams',
      method: 'GET'
    },
    {
      name: 'playlist_m3u',
      title: '📋 M3U Playlist',
      description: 'Get M3U playlist URL',
      endpoint: '/user/playlist',
      method: 'GET'
    },
    {
      name: 'channels_list',
      title: '🎬 Channels List',
      description: 'Get channel lineup',
      endpoint: '/channels',
      method: 'GET'
    }
  ];

  const advancedTests = [
    {
      name: 'user_login',
      title: '🔑 User Login Test',
      description: 'Test login with credentials',
      endpoint: '/auth/login',
      method: 'POST',
      requiresCredentials: true
    },
    {
      name: 'create_user',
      title: '➕ Create User (Admin)',
      description: 'Test user creation (likely to fail)',
      endpoint: '/admin/users',
      method: 'POST',
      body: {
        username: 'test_user_' + Date.now(),
        password: 'TestPass123!',
        email: 'test@example.com',
        package: 'basic'
      }
    },
    {
      name: 'username_check',
      title: '✅ Username Availability',
      description: 'Check if username exists',
      endpoint: '/user/check/test_user_123',
      method: 'GET'
    }
  ];

  const runAllBasicTests = async () => {
    for (const test of tests) {
      await testAPI(test.name, test.endpoint, test.method, test.body);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const runAdvancedTest = async (test) => {
    if (test.requiresCredentials && (!testCredentials.username || !testCredentials.password)) {
      alert('Please enter test credentials first');
      return;
    }

    const body = test.requiresCredentials 
      ? { username: testCredentials.username, password: testCredentials.password }
      : test.body;

    await testAPI(test.name, test.endpoint, test.method, body);
  };

  const copyAsCurl = (test) => {
    const headers = [
      `-H "Authorization: Bearer ${MEGAOTT_CONFIG.apiKey}"`,
      `-H "Content-Type: application/json"`
    ];

    const bodyParam = test.body ? ` -d '${JSON.stringify(test.body)}'` : '';
    
    const curlCommand = `curl -X ${test.method} "${MEGAOTT_CONFIG.baseUrl}${test.endpoint}" ${headers.join(' ')}${bodyParam}`;
    
    navigator.clipboard.writeText(curlCommand);
    alert('cURL command copied to clipboard!');
  };

  const ResultDisplay = ({ testName, result }) => {
    if (!result) return null;

    return (
      <div className={`mt-3 p-4 rounded-lg ${result.success ? 'bg-green-900 border border-green-600' : 'bg-red-900 border border-red-600'}`}>
        <div className="flex justify-between items-start mb-2">
          <span className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
            {result.success ? '✅ SUCCESS' : '❌ FAILED'}
          </span>
          <span className="text-gray-400 text-sm">{result.timestamp}</span>
        </div>
        
        <div className="text-sm space-y-2">
          <div>
            <span className="text-gray-400">Status: </span>
            <span className="text-white">{result.status} {result.statusText}</span>
          </div>
          
          {result.error && (
            <div>
              <span className="text-gray-400">Error: </span>
              <span className="text-red-300">{result.error}</span>
            </div>
          )}
          
          {result.data && (
            <div>
              <span className="text-gray-400">Response: </span>
              <pre className="text-green-300 text-xs mt-2 bg-gray-800 p-2 rounded overflow-x-auto max-h-32">
                {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-dark-300 text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">🧪 MegaOTT API Tester</h1>
          <p className="text-gray-400">Test your API capabilities and discover what's possible</p>
          
          <div className="bg-blue-900 border border-blue-600 p-4 rounded-lg mt-6">
            <h3 className="font-semibold text-blue-400 mb-2">🔑 Your API Configuration</h3>
            <div className="text-sm text-blue-200">
              <p><strong>Endpoint:</strong> {MEGAOTT_CONFIG.baseUrl}</p>
              <p><strong>API Key:</strong> {MEGAOTT_CONFIG.apiKey.substring(0, 10)}...</p>
            </div>
          </div>
        </div>

        {/* Basic Tests */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">📋 Basic API Tests</h2>
            <button
              onClick={runAllBasicTests}
              disabled={Object.values(loading).some(l => l)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {Object.values(loading).some(l => l) ? '🔄 Testing...' : '🚀 Run All Tests'}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {tests.map(test => (
              <div key={test.name} className="bg-dark-200 border border-gray-700 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{test.title}</h3>
                    <p className="text-gray-400 text-sm">{test.description}</p>
                    <p className="text-blue-400 text-xs font-mono mt-1">
                      {test.method} {test.endpoint}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testAPI(test.name, test.endpoint, test.method, test.body)}
                      disabled={loading[test.name]}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      {loading[test.name] ? '⏳' : '▶️'}
                    </button>
                    <button
                      onClick={() => copyAsCurl(test)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      title="Copy as cURL"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <ResultDisplay testName={test.name} result={results[test.name]} />
              </div>
            ))}
          </div>
        </div>

        {/* Advanced Tests */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">🔬 Advanced API Tests</h2>
          
          {/* Test Credentials Input */}
          <div className="bg-dark-200 border border-gray-700 p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">🔑 Test Credentials (Optional)</h3>
            <p className="text-gray-400 text-sm mb-4">
              Enter existing MegaOTT credentials to test login functionality:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username:</label>
                <input
                  type="text"
                  value={testCredentials.username}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="existing_username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password:</label>
                <input
                  type="password"
                  value={testCredentials.password}
                  onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white"
                  placeholder="password"
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {advancedTests.map(test => (
              <div key={test.name} className="bg-dark-200 border border-gray-700 p-6 rounded-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{test.title}</h3>
                    <p className="text-gray-400 text-sm">{test.description}</p>
                    <p className="text-blue-400 text-xs font-mono mt-1">
                      {test.method} {test.endpoint}
                    </p>
                    {test.requiresCredentials && (
                      <p className="text-yellow-400 text-xs mt-1">⚠️ Requires test credentials</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => runAdvancedTest(test)}
                      disabled={loading[test.name]}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      {loading[test.name] ? '⏳' : '🧪'}
                    </button>
                    <button
                      onClick={() => copyAsCurl(test)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      title="Copy as cURL"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <ResultDisplay testName={test.name} result={results[test.name]} />
              </div>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="bg-dark-200 border border-gray-700 p-6 rounded-lg">
          <h3 className="text-lg font-bold mb-4">📊 Test Results Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400">
                {Object.values(results).filter(r => r?.success).length}
              </div>
              <div className="text-sm text-gray-400">Successful Tests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">
                {Object.values(results).filter(r => r && !r.success).length}
              </div>
              <div className="text-sm text-gray-400">Failed Tests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">
                {Object.keys(results).length}
              </div>
              <div className="text-sm text-gray-400">Total Tests Run</div>
            </div>
          </div>
          
          {Object.keys(results).length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">💡 What This Means:</h4>
              <div className="text-sm text-gray-300 space-y-2">
                {Object.values(results).filter(r => r?.success).length > 0 && (
                  <p>✅ Your API key has some working functionality - we can enhance the workflow!</p>
                )}
                {Object.values(results).filter(r => r && !r.success && r.status === 401).length > 0 && (
                  <p>🔐 Some endpoints require higher authentication - likely admin-only features</p>
                )}
                {Object.values(results).filter(r => r && !r.success && r.status === 403).length > 0 && (
                  <p>🚫 Some features are restricted - this is normal for user-level API keys</p>
                )}
                {Object.values(results).filter(r => r && !r.success && r.status === 404).length > 0 && (
                  <p>❓ Some endpoints don't exist - MegaOTT may have different API structure</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
