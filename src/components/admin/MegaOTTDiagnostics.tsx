
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw,
  Database,
  Key,
  Users,
  DollarSign
} from 'lucide-react';

interface DiagnosticResult {
  test_type: string;
  status: 'success' | 'failure';
  response_data?: any;
  error_message?: string;
  executed_at?: string;
}

interface SyncResult {
  credits_synced: number;
  subscribers_synced: number;
  errors: string[];
}

export const MegaOTTDiagnostics = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResult[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult | null>(null);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const { data, error } = await supabase.functions.invoke('megaott-diagnostics', {
        body: { action: 'run_diagnostics' }
      });

      if (error) throw error;

      setDiagnosticResults(data.results);
      
      toast({
        title: "Diagnostics Complete",
        description: `${data.summary.passed}/${data.summary.total_tests} tests passed`,
        variant: data.summary.failed > 0 ? "destructive" : "default",
      });

    } catch (error: any) {
      console.error('Diagnostics error:', error);
      toast({
        title: "Diagnostics Failed",
        description: error.message || "Failed to run diagnostics",
        variant: "destructive",
      });
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const runDataSync = async (syncType: 'all' | 'credits' | 'subscribers') => {
    setIsSyncing(true);
    try {
      // Get current user's reseller ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: reseller } = await supabase
        .from('resellers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!reseller) throw new Error('Reseller profile not found');

      const { data, error } = await supabase.functions.invoke('megaott-sync', {
        body: { 
          reseller_id: reseller.id,
          sync_type: syncType 
        }
      });

      if (error) throw error;

      setSyncResults(data.results);
      
      toast({
        title: "Data Sync Complete",
        description: data.message,
        variant: data.results.errors.length > 0 ? "destructive" : "default",
      });

    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Data Sync Failed",
        description: error.message || "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getTestIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failure':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getTestDescription = (testType: string) => {
    switch (testType) {
      case 'configuration_check':
        return 'Verifies that all required MegaOTT API credentials are configured';
      case 'authentication_test':
        return 'Tests authentication with MegaOTT API using provided credentials';
      case 'credits_api_test':
        return 'Tests the credits API endpoint to fetch current credit balance';
      case 'subscribers_api_test':
        return 'Tests the subscribers API endpoint to fetch subscriber data';
      case 'database_connectivity_test':
        return 'Verifies connection to local Supabase database';
      default:
        return 'Diagnostic test';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="text-gold" />
            MegaOTT Integration Diagnostics
          </CardTitle>
          <CardDescription>
            Test and diagnose your MegaOTT API integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnostics" className="space-y-4">
            <TabsList className="bg-dark-300">
              <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
              <TabsTrigger value="sync">Data Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostics" className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={runDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="bg-gold hover:bg-gold-dark text-black"
                >
                  {isRunningDiagnostics && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Run Diagnostics
                </Button>
              </div>

              {diagnosticResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Test Results</h3>
                  {diagnosticResults.map((result, index) => (
                    <Card key={index} className="bg-dark-300 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getTestIcon(result.status)}
                            <div>
                              <h4 className="font-medium capitalize">
                                {result.test_type.replace(/_/g, ' ')}
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                {getTestDescription(result.test_type)}
                              </p>
                              {result.error_message && (
                                <p className="text-sm text-red-400 mt-2">
                                  Error: {result.error_message}
                                </p>
                              )}
                              {result.response_data && (
                                <details className="mt-2">
                                  <summary className="text-sm text-gray-400 cursor-pointer">
                                    View Details
                                  </summary>
                                  <pre className="text-xs bg-dark-400 p-2 rounded mt-1 overflow-auto">
                                    {JSON.stringify(result.response_data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                          <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                            {result.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => runDataSync('all')}
                  disabled={isSyncing}
                  className="bg-gold hover:bg-gold-dark text-black"
                >
                  {isSyncing && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  <Database className="mr-2 h-4 w-4" />
                  Sync All Data
                </Button>
                <Button
                  onClick={() => runDataSync('credits')}
                  disabled={isSyncing}
                  variant="outline"
                  className="border-gray-600"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Sync Credits
                </Button>
                <Button
                  onClick={() => runDataSync('subscribers')}
                  disabled={isSyncing}
                  variant="outline"
                  className="border-gray-600"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Sync Subscribers
                </Button>
              </div>

              {syncResults && (
                <Card className="bg-dark-300 border-gray-700">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4">Sync Results</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-dark-400 p-3 rounded">
                        <div className="text-2xl font-bold text-gold">{syncResults.credits_synced}</div>
                        <div className="text-sm text-gray-400">Credits Synced</div>
                      </div>
                      <div className="bg-dark-400 p-3 rounded">
                        <div className="text-2xl font-bold text-gold">{syncResults.subscribers_synced}</div>
                        <div className="text-sm text-gray-400">Subscribers Synced</div>
                      </div>
                    </div>
                    {syncResults.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-400">Errors:</h4>
                        {syncResults.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
