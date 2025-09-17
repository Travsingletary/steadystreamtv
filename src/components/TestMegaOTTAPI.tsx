import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const MegaOTTAPITest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      console.log('Starting MegaOTT API test...');
      
      const { data, error } = await supabase.functions.invoke('test-megaott', {
        body: {}
      });

      if (error) {
        throw new Error(error.message || 'Failed to run test');
      }

      console.log('Test results:', data);
      setResults(data);
    } catch (error: any) {
      console.error('Test failed:', error);
      setResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean, status?: number) => {
    if (success) {
      return <Badge className="bg-green-900/30 text-green-500">Success</Badge>;
    } else {
      return <Badge className="bg-red-900/30 text-red-500">Failed {status ? `(${status})` : ''}</Badge>;
    }
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-gold" />
          MegaOTT API Test
        </CardTitle>
        <CardDescription>
          Test the MegaOTT API connection and credentials
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTest}
          disabled={testing}
          className="bg-gold hover:bg-gold-dark text-black font-semibold"
        >
          {testing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing API...
            </>
          ) : (
            'Run API Test'
          )}
        </Button>

        {results && (
          <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={`${results.success ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(results.success)}
                <AlertTitle>
                  {results.success ? 'API Test Successful' : 'API Test Failed'}
                </AlertTitle>
              </div>
              <AlertDescription>
                {results.success 
                  ? 'MegaOTT API is responding correctly' 
                  : `Error: ${results.error}`
                }
              </AlertDescription>
            </Alert>

            {/* Configuration Info */}
            {results.apiUrl && (
              <div className="p-4 bg-dark-300 rounded-lg">
                <h4 className="font-medium mb-2">Configuration</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-400">API URL:</span> {results.apiUrl}</p>
                  <p><span className="text-gray-400">API Key:</span> {results.hasApiKey ? '✓ Present' : '✗ Missing'}</p>
                  <p><span className="text-gray-400">Test Time:</span> {new Date(results.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Test Results */}
            {results.tests && (
              <div className="space-y-3">
                <h4 className="font-medium">Test Results</h4>
                
                {/* User Endpoint Test */}
                <div className="p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">User Endpoint (/user)</span>
                    {getStatusBadge(results.tests.userEndpoint.success, results.tests.userEndpoint.status)}
                  </div>
                  
                  {results.tests.userEndpoint.success && results.tests.userEndpoint.data && (
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-400">User ID:</span> {results.tests.userEndpoint.data.id}</p>
                      <p><span className="text-gray-400">Username:</span> {results.tests.userEndpoint.data.username}</p>
                      <p><span className="text-gray-400">Credit:</span> ${results.tests.userEndpoint.data.credit}</p>
                    </div>
                  )}
                  
                  {!results.tests.userEndpoint.success && (
                    <div className="text-sm text-red-400">
                      Error: {results.tests.userEndpoint.error}
                    </div>
                  )}
                </div>

                {/* Subscriptions Endpoint Test */}
                <div className="p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Subscriptions Endpoint (/subscriptions)</span>
                    {getStatusBadge(results.tests.subscriptionsEndpoint?.success, results.tests.subscriptionsEndpoint?.status)}
                  </div>
                  
                  {results.tests.subscriptionsEndpoint?.success && results.tests.subscriptionsEndpoint.data && (
                    <div className="text-sm">
                      <pre className="text-xs bg-dark-400 p-2 rounded overflow-auto">
                        {JSON.stringify(results.tests.subscriptionsEndpoint.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {!results.tests.subscriptionsEndpoint?.success && (
                    <div className="text-sm text-gray-400">
                      Error: {results.tests.subscriptionsEndpoint?.error?.substring(0, 100)}...
                    </div>
                  )}
                </div>

                {/* Plans Endpoint Test */}
                <div className="p-4 bg-dark-300 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Plans Endpoint (/plans)</span>
                    {getStatusBadge(results.tests.plansEndpoint?.success, results.tests.plansEndpoint?.status)}
                  </div>
                  
                  {results.tests.plansEndpoint?.success && results.tests.plansEndpoint.data && (
                    <div className="text-sm">
                      <pre className="text-xs bg-dark-400 p-2 rounded overflow-auto">
                        {JSON.stringify(results.tests.plansEndpoint.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {!results.tests.plansEndpoint?.success && (
                    <div className="text-sm text-gray-400">
                      Error: {results.tests.plansEndpoint?.error?.substring(0, 100)}...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MegaOTTAPITest;