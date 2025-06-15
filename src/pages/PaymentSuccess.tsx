
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Copy, Download, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Credentials {
  username: string;
  password: string;
  activation_code: string;
  playlist_url: string;
  server_url: string;
  plan_type: string;
  status: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
          setError("No session ID found. Please check your email for credentials.");
          setIsLoading(false);
          return;
        }

        // Get current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          setError("Please sign in to view your credentials.");
          setIsLoading(false);
          return;
        }

        // Fetch IPTV account credentials
        const { data: iptvAccount, error: iptvError } = await supabase
          .from('iptv_accounts')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .eq('user_id', userData.user.id)
          .single();

        if (iptvError || !iptvAccount) {
          // Credentials might still be processing, show loading state
          setTimeout(() => fetchCredentials(), 2000);
          return;
        }

        setCredentials({
          username: iptvAccount.username,
          password: iptvAccount.password,
          activation_code: iptvAccount.activation_code,
          playlist_url: iptvAccount.playlist_url,
          server_url: iptvAccount.server_url,
          plan_type: iptvAccount.plan_type,
          status: iptvAccount.status
        });
        
        setIsLoading(false);
        toast.success("Your SteadyStream TV account is ready!");

      } catch (error: any) {
        console.error("Error fetching credentials:", error);
        setError("Failed to load credentials. Please check your email or contact support.");
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, [searchParams]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadM3U = () => {
    if (!credentials) return;
    
    const m3uContent = `#EXTM3U\n#EXTINF:-1,SteadyStream TV Playlist\n${credentials.playlist_url}`;
    const blob = new Blob([m3uContent], { type: 'application/x-mpegURL' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'steadystream-playlist.m3u';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Playlist file downloaded!");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-red-500/20 rounded-full p-4 mb-4">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <CardTitle className="text-white">Unable to Load Credentials</CardTitle>
            <CardDescription className="text-gray-400">{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate("/dashboard")}
              className="w-full bg-gold hover:bg-gold-dark text-black"
            >
              Go to Dashboard
            </Button>
            <Button 
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full border-gray-600"
            >
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-blue-500/20 rounded-full p-4 mb-4">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <CardTitle className="text-white">Setting Up Your Account</CardTitle>
            <CardDescription className="text-gray-400">
              We're creating your IPTV credentials and sending your welcome email. This will only take a moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <Card className="mb-8 bg-dark-200 border-gray-800">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center bg-green-500/20 rounded-full p-4 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="text-3xl text-white mb-2">
              🎉 Welcome to SteadyStream TV!
            </CardTitle>
            <CardDescription className="text-xl text-gray-300">
              Your {credentials?.plan_type.toUpperCase()} plan is now active
              {credentials?.status === 'demo' && (
                <span className="block text-yellow-400 text-sm mt-2">
                  ⚠️ Demo Mode - Contact support to activate full features
                </span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Credentials Card */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                🔑 Your IPTV Credentials
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use these credentials with any IPTV app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-300">Username</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-dark-300 text-white p-2 rounded text-sm font-mono">
                      {credentials?.username}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials?.username || '', 'Username')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-dark-300 text-white p-2 rounded text-sm font-mono">
                      {credentials?.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials?.password || '', 'Password')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Activation Code</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-dark-300 text-white p-2 rounded text-sm font-mono">
                      {credentials?.activation_code}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials?.activation_code || '', 'Activation Code')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300">Playlist URL</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="flex-1 bg-dark-300 text-white p-2 rounded text-sm font-mono break-all">
                      {credentials?.playlist_url}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(credentials?.playlist_url || '', 'Playlist URL')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button
                  onClick={downloadM3U}
                  className="w-full bg-gold hover:bg-gold-dark text-black"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download M3U Playlist
                </Button>
                <Button
                  onClick={() => window.open(credentials?.playlist_url, '_blank')}
                  variant="outline"
                  className="w-full border-gray-600"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Test Playlist
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                📺 Setup Instructions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Get started in 3 easy steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Download IPTV App</h4>
                    <p className="text-gray-400 text-sm">
                      Get TiviMate (recommended), IPTV Smarters, or VLC Media Player
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Add Playlist</h4>
                    <p className="text-gray-400 text-sm">
                      Use the playlist URL above or download the M3U file
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Start Streaming!</h4>
                    <p className="text-gray-400 text-sm">
                      Enjoy thousands of channels in HD quality
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">📱 QR Code Setup</h4>
                <p className="text-gray-400 text-sm">
                  A QR code has been sent to your email for instant app configuration.
                </p>
              </div>

              <div className="mt-6 space-y-2">
                <Button
                  onClick={() => navigate("/dashboard")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full border-gray-600"
                >
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Notice */}
        <Card className="mt-8 bg-dark-200 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 text-2xl">📧</div>
              <div>
                <h4 className="text-white font-medium">Check Your Email</h4>
                <p className="text-gray-400 text-sm">
                  We've sent a detailed welcome email with your credentials, QR code, and setup instructions.
                  {credentials?.status === 'demo' && " Please contact support to upgrade from demo mode."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
