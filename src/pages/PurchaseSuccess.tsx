
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Download, CheckCircle, Mail, Smartphone, Tv, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IPTVCredentials {
  username: string;
  password: string;
  server_url: string;
  playlist_url: string;
  activation_code: string;
  max_connections: number;
  expires_at: string;
  plan_type: string;
}

export default function PurchaseSuccess() {
  const [searchParams] = useSearchParams();
  const [credentials, setCredentials] = useState<IPTVCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      fetchCredentials();
    } else {
      setError('No session ID found');
      setLoading(false);
    }
  }, [sessionId]);

  const fetchCredentials = async () => {
    try {
      const { data: automation, error: automationError } = await supabase
        .from('purchase_automations')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (automationError) {
        throw new Error('Purchase not found');
      }

      if (automation.automation_status === 'failed') {
        throw new Error(automation.error_message || 'Purchase processing failed');
      }

      if (automation.automation_status === 'processing') {
        // Still processing, check again in a few seconds
        setTimeout(fetchCredentials, 3000);
        return;
      }

      // Get IPTV account details
      const { data: account, error: accountError } = await supabase
        .from('iptv_accounts')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .single();

      if (accountError || !account) {
        throw new Error('IPTV account not found');
      }

      setCredentials({
        username: account.username,
        password: account.password,
        server_url: account.server_url,
        playlist_url: account.playlist_url,
        activation_code: account.activation_code,
        max_connections: account.package_id || 1,
        expires_at: account.expires_at,
        plan_type: account.plan_type
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const downloadM3U = () => {
    if (!credentials) return;
    
    const m3uContent = `#EXTM3U
#EXTINF:-1,SteadyStream TV Playlist
${credentials.playlist_url}`;
    
    const blob = new Blob([m3uContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'steadystream-playlist.m3u';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "M3U playlist file downloaded",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-dark-200 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Processing Your Purchase</h3>
            <p className="text-gray-400">Setting up your IPTV account...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-dark-200 border-gray-800">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-lg font-semibold mb-2 text-red-400">Purchase Error</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button asChild>
              <Link to="/support">Contact Support</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="min-h-screen bg-dark-100 flex items-center justify-center">
        <Card className="w-full max-w-md bg-dark-200 border-gray-800">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No Credentials Found</h3>
            <p className="text-gray-400">Please contact support if this issue persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(credentials.playlist_url)}`;

  return (
    <div className="min-h-screen bg-dark-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <Card className="bg-dark-200 border-gray-800 mb-8">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-gold">🎉 Welcome to SteadyStream TV!</CardTitle>
            <CardDescription>
              Your {credentials.plan_type.toUpperCase()} plan is now active
              <Badge variant="secondary" className="ml-2 bg-gold text-black">
                {credentials.plan_type.toUpperCase()}
              </Badge>
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Credentials Card */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🔐 Your IPTV Credentials
              </CardTitle>
              <CardDescription>
                Use these credentials to set up your IPTV service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Username', value: credentials.username },
                { label: 'Password', value: credentials.password },
                { label: 'Server URL', value: credentials.server_url },
                { label: 'Activation Code', value: credentials.activation_code }
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="text-sm font-medium text-gray-300">{item.label}</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-dark-300 px-3 py-2 rounded text-sm font-mono">
                      {item.value}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(item.value, item.label)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Max Connections:</span>
                  <div className="font-semibold">{credentials.max_connections}</div>
                </div>
                <div>
                  <span className="text-gray-400">Expires:</span>
                  <div className="font-semibold">
                    {new Date(credentials.expires_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code & Setup */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📱 Quick Setup
              </CardTitle>
              <CardDescription>
                Scan QR code or download playlist file
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white p-4 rounded-lg inline-block">
                <img src={qrCodeUrl} alt="Playlist QR Code" className="w-48 h-48" />
              </div>
              <p className="text-sm text-gray-400">
                Scan with your IPTV app for instant setup
              </p>
              
              <div className="flex gap-2 justify-center">
                <Button onClick={downloadM3U} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download M3U
                </Button>
                <Button 
                  onClick={() => copyToClipboard(credentials.playlist_url, 'Playlist URL')}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        <Card className="bg-dark-200 border-gray-800 mt-8">
          <CardHeader>
            <CardTitle>🚀 Setup Instructions</CardTitle>
            <CardDescription>
              Choose your device and follow the setup guide
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <Smartphone className="w-8 h-8 mx-auto text-gold" />
                <h3 className="font-semibold">Mobile Devices</h3>
                <p className="text-sm text-gray-400">
                  Download TiviMate or IPTV Smarters Pro from your app store
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <Tv className="w-8 h-8 mx-auto text-gold" />
                <h3 className="font-semibold">Smart TV / Fire TV</h3>
                <p className="text-sm text-gray-400">
                  Install TiviMate or use your TV's built-in IPTV player
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <Monitor className="w-8 h-8 mx-auto text-gold" />
                <h3 className="font-semibold">PC / Mac</h3>
                <p className="text-sm text-gray-400">
                  Use VLC Media Player or Kodi for the best experience
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-300">Check Your Email</h4>
                  <p className="text-sm text-yellow-200/80">
                    We've sent detailed setup instructions and your credentials to your email address.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button asChild className="bg-gold hover:bg-gold-dark text-black">
            <Link to="/setup-guide">📖 Detailed Setup Guide</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/support">💬 Get Support</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">🏠 Go Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
