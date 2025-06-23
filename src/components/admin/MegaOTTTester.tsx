
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MegaOTTService } from '@/services/megaOTTService';
import { TestTube, CheckCircle, XCircle, RefreshCw, DollarSign } from 'lucide-react';

export const MegaOTTTester: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    setCredits(null);

    try {
      console.log('🧪 Starting MegaOTT connection test...');
      
      const testResult = await MegaOTTService.testConnection();
      setResult(testResult);
      
      if (testResult.success && testResult.credits) {
        setCredits(testResult.credits);
      }
      
    } catch (error: any) {
      console.error('Test failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  const testUserCreation = async () => {
    setTesting(true);
    
    try {
      console.log('🧪 Testing user creation...');
      
      const userResult = await MegaOTTService.createUserLine('test@steadystreamtv.com', 'trial');
      
      setResult({
        success: true,
        userCreation: userResult,
        message: 'Test user created successfully!'
      });
      
    } catch (error: any) {
      console.error('User creation test failed:', error);
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-3">
          <TestTube className="w-6 h-6 text-blue-400" />
          MegaOTT Reseller API Tester
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="flex gap-4">
          <Button 
            onClick={testConnection}
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
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
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Test User Creation
          </Button>
        </div>

        {/* Credits Display */}
        {credits && (
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-white">Credits Status</h3>
                    <p className="text-sm text-gray-400">API: {credits.apiName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {credits.available}
                  </div>
                  <div className="text-sm text-gray-400">
                    Used: {credits.used}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        {result && (
          <Card className={`border-2 ${result.success ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400 mt-1" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 mt-1" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">
                      {result.success ? 'Test Successful' : 'Test Failed'}
                    </h3>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Error'}
                    </Badge>
                  </div>
                  
                  {result.error && (
                    <p className="text-red-400 text-sm mb-2">{result.error}</p>
                  )}
                  
                  {result.message && (
                    <p className="text-green-400 text-sm mb-2">{result.message}</p>
                  )}
                  
                  {result.userCreation && (
                    <div className="bg-gray-800 p-3 rounded mt-3">
                      <h4 className="text-white font-semibold mb-2">Created User Details:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Username:</span>
                          <span className="text-white ml-2">{result.userCreation.credentials.username}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Password:</span>
                          <span className="text-white ml-2">{result.userCreation.credentials.password}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Server:</span>
                          <span className="text-white ml-2">{result.userCreation.credentials.server}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">API Used:</span>
                          <span className="text-white ml-2">{result.userCreation.apiName}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {result.info && (
                    <div className="bg-gray-800 p-3 rounded mt-3">
                      <h4 className="text-white font-semibold mb-2">Reseller Info:</h4>
                      <pre className="text-xs text-gray-300 overflow-auto">
                        {JSON.stringify(result.info.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
