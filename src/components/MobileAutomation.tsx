
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ProductionSteadyStreamAutomation } from '@/services/productionSteadyStreamAutomation';
import { CheckCircle, Tv, Smartphone, Monitor, Wifi, Copy, Download, ExternalLink } from 'lucide-react';

const MobileAutomation = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'trial',
    allowAdult: false
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🚀 Starting production MegaOTT automation...');
      
      const automationResult = await ProductionSteadyStreamAutomation.processCompleteSignup(formData);
      
      setResult(automationResult);
      
      if (automationResult.success) {
        toast({
          title: "🎉 Account Created Successfully!",
          description: `Your ${formData.plan} plan is ready via ${automationResult.apiName}`,
        });
      } else {
        toast({
          title: "Account Created with Fallback",
          description: automationResult.fallback?.message || "Support will contact you soon",
          variant: "destructive",
        });
      }
      
    } catch (error: any) {
      console.error('❌ Production automation failed:', error);
      toast({
        title: "Setup Error",
        description: error.message,
        variant: "destructive",
      });
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

  if (result?.success) {
    return (
      <Card className="max-w-4xl mx-auto bg-gradient-to-br from-green-900 to-green-800 border-green-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-white mb-2">
            🎉 SteadyStream TV Account Ready!
          </CardTitle>
          <p className="text-green-200">
            {result.message}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Badge className="bg-green-600 text-white">
              {result.apiName || 'Production API'}
            </Badge>
            <Badge variant="outline" className="border-green-400 text-green-200">
              Source: {result.source}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Account Details */}
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Tv className="w-5 h-5" />
              Your IPTV Account Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-green-200 text-sm">Activation Code</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded flex-1 font-mono">
                      {result.activationCode}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.activationCode, 'Activation Code')}
                      className="border-green-500 text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-green-200 text-sm">Username</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded flex-1 font-mono">
                      {result.credentials?.username}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.credentials?.username, 'Username')}
                      className="border-green-500 text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-green-200 text-sm">Password</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded flex-1 font-mono">
                      {result.credentials?.password}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.credentials?.password, 'Password')}
                      className="border-green-500 text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-green-200 text-sm">Server</label>
                  <code className="bg-gray-800 text-green-400 px-3 py-2 rounded block font-mono">
                    {result.credentials?.server}
                  </code>
                </div>
                
                <div>
                  <label className="text-green-200 text-sm">Port</label>
                  <code className="bg-gray-800 text-green-400 px-3 py-2 rounded block font-mono">
                    {result.credentials?.port}
                  </code>
                </div>
                
                <div>
                  <label className="text-green-200 text-sm">Expires</label>
                  <code className="bg-gray-800 text-green-400 px-3 py-2 rounded block font-mono">
                    {result.expiryDate ? new Date(result.expiryDate).toLocaleDateString() : 'N/A'}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Playlist URLs */}
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Playlist URLs
            </h3>
            
            <div className="space-y-3">
              {result.playlistUrl && (
                <div>
                  <label className="text-green-200 text-sm">M3U Playlist</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded flex-1 font-mono text-xs">
                      {result.playlistUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.playlistUrl, 'Playlist URL')}
                      className="border-green-500 text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {result.smartTvUrl && (
                <div>
                  <label className="text-green-200 text-sm">Smart TV URL</label>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-800 text-green-400 px-3 py-2 rounded flex-1 font-mono text-xs">
                      {result.smartTvUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(result.smartTvUrl, 'Smart TV URL')}
                      className="border-green-500 text-green-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Device Setup Instructions */}
          <div className="bg-black/20 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Quick Setup Guide
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <Tv className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="text-green-200 font-semibold">Smart TV</h4>
                <p className="text-green-300 text-sm">
                  Install TiviMate or IPTV Smarters, add playlist URL
                </p>
              </div>
              
              <div className="text-center">
                <Smartphone className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="text-green-200 font-semibold">Mobile</h4>
                <p className="text-green-300 text-sm">
                  Download IPTV app, enter server details
                </p>
              </div>
              
              <div className="text-center">
                <Monitor className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <h4 className="text-green-200 font-semibold">Computer</h4>
                <p className="text-green-300 text-sm">
                  Use VLC Media Player or IPTV software
                </p>
              </div>
            </div>
          </div>

          {/* Success Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.open('mailto:support@steadystreamtv.com?subject=Setup Help&body=I need help setting up my SteadyStream TV account')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Get Setup Help
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 border-green-500 text-green-400"
              onClick={() => setResult(null)}
            >
              Create Another Account
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto bg-gray-900 border-gray-700">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white mb-2">
          🚀 Production SteadyStream Signup
        </CardTitle>
        <p className="text-gray-400">
          Create your IPTV account with full MegaOTT integration
        </p>
        <Badge className="mx-auto bg-blue-600 text-white">
          Production API System
        </Badge>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm">Full Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm">Email Address</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm">Password</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a password"
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>
          
          <div>
            <label className="text-gray-300 text-sm">Subscription Plan</label>
            <select
              value={formData.plan}
              onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded"
            >
              <option value="trial">24-Hour Free Trial</option>
              <option value="basic">Basic Plan ($20/month)</option>
              <option value="duo">Duo Plan ($35/month)</option>
              <option value="family">Family Plan ($45/month)</option>
            </select>
          </div>
          
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          >
            {loading ? (
              <>
                <Wifi className="w-4 h-4 mr-2 animate-spin" />
                Creating Account with Production API...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Create SteadyStream Account
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MobileAutomation;
