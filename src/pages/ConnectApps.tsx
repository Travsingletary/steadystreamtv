
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import FooterSection from "@/components/FooterSection";
import { 
  Smartphone, 
  Tv, 
  Download, 
  QrCode, 
  CheckCircle, 
  Clock, 
  Copy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Play
} from "lucide-react";

const ConnectApps = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/onboarding");
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const deviceSetups = [
    {
      id: 'android-tv',
      name: 'Android TV / Fire TV',
      icon: <Tv className="h-8 w-8 text-blue-500" />,
      description: 'Install IPTV Smarters Pro or TiviMate',
      appStore: 'Google Play Store',
      setupInstructions: [
        'Download IPTV Smarters Pro from Google Play Store',
        'Open the app and select "Add User"',
        'Enter your IPTV credentials',
        'Start watching your channels'
      ]
    },
    {
      id: 'ios',
      name: 'iPhone / iPad',
      icon: <Smartphone className="h-8 w-8 text-gray-600" />,
      description: 'Install GSE Smart IPTV or IPTV Smarters Pro',
      appStore: 'App Store',
      setupInstructions: [
        'Download GSE Smart IPTV from App Store',
        'Tap "Remote Playlists" then "+"',
        'Enter your M3U playlist URL',
        'Save and enjoy streaming'
      ]
    },
    {
      id: 'android',
      name: 'Android Phone / Tablet',
      icon: <Smartphone className="h-8 w-8 text-green-500" />,
      description: 'Install IPTV Smarters Pro',
      appStore: 'Google Play Store',
      setupInstructions: [
        'Download IPTV Smarters Pro',
        'Select "Add User" option',
        'Input your IPTV server details',
        'Start streaming immediately'
      ]
    }
  ];

  const connectionMethods = [
    {
      id: 'xtream',
      name: 'Xtream Codes API',
      recommended: true,
      description: 'Best for most IPTV apps with full EPG support',
      fields: {
        'Server URL': profile?.xtream_server || 'Not available',
        'Username': profile?.xtream_username || 'Not available',
        'Password': profile?.xtream_password || 'Not available'
      }
    },
    {
      id: 'm3u',
      name: 'M3U Playlist URL',
      recommended: false,
      description: 'Direct playlist link for basic streaming',
      fields: {
        'Playlist URL': profile?.playlist_url || `${window.location.origin}/api/playlist/your-token.m3u8`
      }
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gold mb-4">Connect Your Apps</h1>
              <p className="text-xl text-gray-300 mb-6">
                Set up SteadyStream TV on all your devices in minutes
              </p>
              
              {profile?.subscription_status !== 'active' && (
                <Alert className="mb-6 bg-yellow-900/30 border-yellow-500 text-yellow-100 max-w-2xl mx-auto">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You need an active subscription to access streaming credentials. 
                    <Button 
                      variant="link" 
                      className="text-yellow-300 p-0 ml-1 h-auto"
                      onClick={() => navigate('/dashboard')}
                    >
                      Subscribe now
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Connection Methods */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {connectionMethods.map((method) => (
                <Card key={method.id} className="bg-dark-200 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {method.name}
                        {method.recommended && (
                          <Badge className="bg-gold text-black">Recommended</Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchUserProfile}
                        className="border-gray-700"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>{method.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(method.fields).map(([label, value]) => (
                        <div key={label}>
                          <label className="text-sm text-gray-400 block mb-1">{label}</label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-dark-300 border border-gray-700 px-3 py-2 rounded text-sm font-mono">
                              {value}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(value, label)}
                              className="border-gray-700"
                              disabled={value === 'Not available'}
                            >
                              {copySuccess === label ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Device Setup Instructions */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">Device Setup</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {deviceSetups.map((device) => (
                  <Card key={device.id} className="bg-dark-200 border-gray-800">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4">{device.icon}</div>
                      <CardTitle>{device.name}</CardTitle>
                      <CardDescription>{device.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="outline" className="w-full justify-center">
                          {device.appStore}
                        </Badge>
                        <div className="space-y-2">
                          {device.setupInstructions.map((step, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm">
                              <span className="flex-shrink-0 w-5 h-5 bg-gold text-black rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <span className="text-gray-300">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-dark-200 border-gray-800 text-center">
                <CardContent className="pt-6">
                  <QrCode className="h-12 w-12 text-gold mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">QR Code Setup</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Scan with your IPTV app for instant setup
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "QR code generation will be available soon",
                      });
                    }}
                  >
                    Generate QR Code
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-gray-800 text-center">
                <CardContent className="pt-6">
                  <Download className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Download Config</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Download ready-to-use configuration files
                  </p>
                  <Button 
                    variant="outline"
                    className="w-full border-gray-700"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Config file download will be available soon",
                      });
                    }}
                  >
                    Download Files
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-dark-200 border-gray-800 text-center">
                <CardContent className="pt-6">
                  <Play className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Test Stream</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Test your connection in the browser
                  </p>
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate('/player')}
                  >
                    Launch Player
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Support Section */}
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle className="text-center">Need Help?</CardTitle>
                <CardDescription className="text-center">
                  Our support team is here to help you get connected
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    variant="outline"
                    className="border-gray-700"
                    onClick={() => {
                      toast({
                        title: "Support",
                        description: "Live chat support will be available soon",
                      });
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Live Chat Support
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-gray-700"
                    onClick={() => {
                      window.open('mailto:support@steadystream.tv', '_blank');
                    }}
                  >
                    Email Support
                  </Button>
                  <Button 
                    className="bg-gold hover:bg-gold-dark text-black"
                    onClick={() => navigate('/dashboard')}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <FooterSection />
    </div>
  );
};

export default ConnectApps;
