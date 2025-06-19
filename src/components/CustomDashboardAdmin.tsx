
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, CreditCard, Calendar, AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

interface Registration {
  id: string;
  name: string;
  email: string;
  plan: string;
  subscription_status: string;
  subscription_tier: string;
  xtream_username?: string;
  xtream_password?: string;
  created_at: string;
  trial_end_date?: string;
}

interface AccountCreationModalProps {
  registration: Registration;
  onClose: () => void;
  onComplete: (credentials: { username: string; password: string; playlistUrl: string }) => void;
}

const AccountCreationModal: React.FC<AccountCreationModalProps> = ({ registration, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const namePrefix = registration.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 6);
    const randomSuffix = Math.random().toString(36).substring(2, 5);
    const suggestedUsername = `steady_${namePrefix}_${randomSuffix}`;
    const suggestedPassword = `${namePrefix.charAt(0).toUpperCase()}${namePrefix.slice(1)}${new Date().getFullYear()}${randomSuffix}!`;
    
    setCredentials({
      username: suggestedUsername,
      password: suggestedPassword
    });
  }, [registration]);

  const handleComplete = async () => {
    if (!playlistUrl.trim()) return;
    
    setProcessing(true);
    try {
      await onComplete({ ...credentials, playlistUrl });
    } catch (error) {
      console.error('Error completing account setup:', error);
    } finally {
      setProcessing(false);
    }
  };

  const planSettings = {
    'standard': { connections: 2, duration: '30 days' },
    'premium': { connections: 4, duration: '30 days' },
    'ultimate': { connections: 6, duration: '30 days' },
    'trial': { connections: 1, duration: '1 day' },
    'free-trial': { connections: 1, duration: '1 day' }
  };

  const settings = planSettings[registration.plan as keyof typeof planSettings] || planSettings.trial;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-dark-200 border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Create Custom Dashboard Account</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
          <CardDescription>
            {registration.name} • {registration.email} • {registration.plan.toUpperCase()}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <>
              <div className="bg-blue-900/30 border border-blue-600 p-4 rounded-lg">
                <h3 className="font-bold text-blue-400 mb-2">📋 Account Creation Instructions</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-200">
                  <li>Go to your Custom Dashboard admin panel</li>
                  <li>Click "Add New User" or equivalent</li>
                  <li>Use the credentials below</li>
                  <li>Set Max Connections: {settings.connections}</li>
                  <li>Set Duration: {settings.duration}</li>
                  <li>Create the account and copy the playlist URL</li>
                </ol>
              </div>

              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold text-white mb-2">Generated Credentials:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Username:</p>
                    <p className="text-green-400 font-mono">{credentials.username}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Password:</p>
                    <p className="text-green-400 font-mono">{credentials.password}</p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)}
                  className="mt-2 w-full bg-gray-600 hover:bg-gray-500"
                  size="sm"
                >
                  📋 Copy Credentials
                </Button>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => window.open('https://yourdashboard.com/admin', '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  🌐 Open Dashboard
                </Button>
                <Button 
                  onClick={() => setStep(2)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  ✅ Account Created
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Playlist URL from Dashboard:
                  </label>
                  <textarea
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 text-white"
                    placeholder="https://yourdashboard.com/get.php?username=steady_user_123&password=..."
                    rows={3}
                  />
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold text-white mb-2">Customer Summary:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Plan:</p>
                      <p className="text-white">{registration.plan.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Connections:</p>
                      <p className="text-white">{settings.connections}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-gray-600"
                >
                  ← Back
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!playlistUrl.trim() || processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? 'Processing...' : '🎉 Complete Setup'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ErrorFallback = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <Card className="bg-red-50 border-red-200 m-4">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-700">
        <AlertTriangle className="h-5 w-5" />
        Service Error
      </CardTitle>
      <CardDescription className="text-red-600">
        {error}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700">
        Try Again
      </Button>
    </CardContent>
  </Card>
);

export const CustomDashboardAdmin: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadRegistrations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Database error: ${fetchError.message}`);
      }
      
      const mappedData: Registration[] = (data || []).map(profile => ({
        id: profile.id,
        name: profile.name || 'Unknown',
        email: profile.email || '',
        plan: profile.subscription_tier || 'trial',
        subscription_status: profile.subscription_status || 'pending',
        subscription_tier: profile.subscription_tier || 'trial',
        xtream_username: profile.xtream_username,
        xtream_password: profile.xtream_password,
        created_at: profile.created_at,
        trial_end_date: profile.trial_end_date
      }));
      
      setRegistrations(mappedData);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load registrations';
      setError(errorMessage);
      console.error('Error loading registrations:', error);
      
      toast({
        title: "Error Loading Data",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountComplete = async (registration: Registration, credentials: { username: string; password: string; playlistUrl: string }) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          xtream_username: credentials.username,
          xtream_password: credentials.password,
          subscription_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', registration.id);

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }

      toast({
        title: "Success",
        description: "Account activated successfully!"
      });

      setSelectedRegistration(null);
      await loadRegistrations();
    } catch (error: any) {
      console.error('Error completing account:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to complete account setup',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  if (error) {
    return <ErrorFallback error={error} onRetry={loadRegistrations} />;
  }

  const pendingRegistrations = registrations.filter(reg => 
    !reg.xtream_username && (reg.subscription_status === 'active' || reg.subscription_tier === 'free-trial')
  );

  const activeAccounts = registrations.filter(reg => 
    reg.xtream_username && reg.subscription_status === 'active'
  );

  return (
    <ErrorBoundary>
      <div className="p-6 bg-dark-300 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Custom Dashboard Manager</h1>
              <p className="text-gray-400">Manage IPTV account creation and activation</p>
            </div>
            <Button onClick={loadRegistrations} disabled={loading}>
              {loading ? 'Loading...' : '🔄 Refresh'}
            </Button>
          </div>

          {error && (
            <Card className="bg-red-900/20 border-red-600 mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Pending Activation</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Clock className="text-yellow-500" />
                  {pendingRegistrations.length}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Active Accounts</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <CheckCircle className="text-green-500" />
                  {activeAccounts.length}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader className="pb-2">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Users className="text-blue-500" />
                  {registrations.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="bg-dark-200">
              <TabsTrigger value="pending">Pending ({pendingRegistrations.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeAccounts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingRegistrations.length === 0 ? (
                <Card className="bg-dark-200 border-gray-800">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-400">No pending activations</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRegistrations.map(registration => (
                  <Card key={registration.id} className="bg-dark-200 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{registration.name}</h3>
                          <p className="text-gray-400">{registration.email}</p>
                        </div>
                        <Badge variant={registration.subscription_tier === 'free-trial' ? 'secondary' : 'default'}>
                          {registration.subscription_tier || registration.plan || 'Unknown'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-gray-400">Status:</p>
                          <p className="text-white">{registration.subscription_status}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Created:</p>
                          <p className="text-white">{new Date(registration.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <Button 
                        onClick={() => setSelectedRegistration(registration)}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        🚀 Create Dashboard Account
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeAccounts.map(account => (
                <Card key={account.id} className="bg-dark-200 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">{account.name}</h3>
                        <p className="text-gray-400">{account.email}</p>
                        <p className="text-green-400 font-mono text-sm">{account.xtream_username}</p>
                      </div>
                      <Badge variant="default" className="bg-green-600">
                        Active
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-400">Plan:</p>
                        <p className="text-white">{account.subscription_tier}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Created:</p>
                        <p className="text-white">{new Date(account.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Trial Ends:</p>
                        <p className="text-white">
                          {account.trial_end_date 
                            ? new Date(account.trial_end_date).toLocaleDateString()
                            : 'N/A'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`Username: ${account.xtream_username}\nPassword: ${account.xtream_password}`)}
                        className="bg-gray-600 hover:bg-gray-500"
                      >
                        📋 Copy Credentials
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {selectedRegistration && (
            <AccountCreationModal
              registration={selectedRegistration}
              onClose={() => setSelectedRegistration(null)}
              onComplete={(credentials) => handleAccountComplete(selectedRegistration, credentials)}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
