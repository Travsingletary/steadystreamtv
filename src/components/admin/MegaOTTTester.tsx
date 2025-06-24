
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MegaOTTTestService } from '@/services/megaOTTTestService';
import { TestTube, CheckCircle, XCircle, RefreshCw, DollarSign, Users, Zap } from 'lucide-react';

export const MegaOTTTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      console.log('🧪 Starting comprehensive MegaOTT test...');
      const testResults = await MegaOTTTestService.runFullTest();
      setResults(testResults);
    } catch (error: any) {
      console.error('Test failed:', error);
      setResults({
        overall: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const result = await MegaOTTTestService.testConnection();
      setResults({ connection: result, overall: result.success });
    } catch (error: any) {
      setResults({ connection: { success: false, error: error.message }, overall: false });
    } finally {
      setTesting(false);
    }
  };

  const testUserCreation = async () => {
    setTesting(true);
    try {
      const result = await MegaOTTTestService.createTestUser();
      setResults({ userCreation: result, overall: true });
    } catch (error: any) {
      setResults({ userCreation: { success: false, error: error.message }, overall: false });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <TestTube className="w-6 h-6 text-blue-400" />
          MegaOTT API Tester (Updated Credentials)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-4 flex-wrap">
          <Button 
            onClick={runTest}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 mr-2" />
            )}
            Run Full Test
          </Button>
          
          <Button 
            onClick={testConnection}
            disabled={testing}
            variant="outline"
            className="border-gray-600"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test Connection
          </Button>

          <Button 
            onClick={testUserCreation}
            disabled={testing}
            variant="outline"
            className="border-gray-600"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Users className="w-4 h-4 mr-2" />
            )}
            Test User Creation
          </Button>
        </div>

        {/* Test Results */}
        {results && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Card className={`border-2 ${results.overall ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {results.overall ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                  <div>
                    <h3 className="font-semibold text-white">
                      {results.overall ? 'All Tests Passed!' : 'Some Tests Failed'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {results.overall ? 'MegaOTT integration is working properly' : 'Check individual test results below'}
                    </p>
                  </div>
                  <Badge variant={results.overall ? 'default' : 'destructive'}>
                    {results.overall ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Individual Test Results */}
            {results.connection && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">Connection Test</h4>
                    <Badge variant={results.connection.success ? 'default' : 'destructive'}>
                      {results.connection.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  {results.connection.error && (
                    <p className="text-red-400 text-sm">{results.connection.error}</p>
                  )}
                  {results.connection.success && results.connection.data && (
                    <div className="text-sm text-gray-300 mt-2">
                      <p>✅ Successfully connected to MegaOTT API</p>
                      <p>📊 Response received and parsed</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.userInfo && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">User Info Test</h4>
                    <Badge variant={!results.userInfo.error ? 'default' : 'destructive'}>
                      {!results.userInfo.error ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  {results.userInfo.error ? (
                    <p className="text-red-400 text-sm">{results.userInfo.error}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                      <div>Credits: {results.userInfo.credits}</div>
                      <div>Used: {results.userInfo.used_credits}</div>
                      <div>Max Connections: {results.userInfo.max_connections}</div>
                      <div>Status: {results.userInfo.status}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.credits && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">Credits Test</h4>
                    <Badge variant={!results.credits.error ? 'default' : 'destructive'}>
                      {!results.credits.error ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  {results.credits.error ? (
                    <p className="text-red-400 text-sm">{results.credits.error}</p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white font-semibold">{results.credits.available}</span>
                        <span className="text-gray-400 text-sm">available</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {results.credits.percentage}% used
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.userCreation && (
              <Card className="bg-gray-700 border-gray-600">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">User Creation Test</h4>
                    <Badge variant={results.userCreation.success ? 'default' : 'destructive'}>
                      {results.userCreation.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  {results.userCreation.error ? (
                    <p className="text-red-400 text-sm">{results.userCreation.error}</p>
                  ) : results.userCreation.success && (
                    <div className="bg-gray-800 p-3 rounded mt-3">
                      <h5 className="text-white font-semibold mb-2">Created Test User:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                        <div>Username: {results.userCreation.username}</div>
                        <div>Password: {results.userCreation.password}</div>
                        <div>Server: {results.userCreation.credentials.server}</div>
                        <div>Activation: {results.userCreation.activationCode}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Test Button for Console */}
        <Card className="bg-blue-900/20 border-blue-600">
          <CardContent className="p-4">
            <h4 className="text-blue-400 font-semibold mb-2">Console Testing</h4>
            <p className="text-blue-200 text-sm mb-2">
              You can also test directly in the browser console:
            </p>
            <code className="text-xs bg-gray-800 p-2 rounded block text-green-400">
              await testMegaOTT()
            </code>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};
