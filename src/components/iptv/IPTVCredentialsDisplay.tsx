
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { CheckCircle, Tv, Copy } from 'lucide-react';
import { IPTVCredentials } from '@/types/iptv';

interface IPTVCredentialsDisplayProps {
  credentials: IPTVCredentials | null;
}

export const IPTVCredentialsDisplay = ({ credentials }: IPTVCredentialsDisplayProps) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">Welcome to Premium IPTV!</CardTitle>
          <CardDescription>Your subscription is active and ready to use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Tv className="mr-2 h-5 w-5" />
              Your IPTV Credentials
            </h3>
            <div className="grid gap-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">Username:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span>{credentials?.username}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.username || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Password:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span>{credentials?.password}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.password || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Server URL:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{credentials?.server_url}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.server_url || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">M3U Playlist:</Label>
                <div className="bg-white p-2 rounded border font-mono text-sm flex items-center justify-between">
                  <span className="break-all">{credentials?.playlist_url}</span>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(credentials?.playlist_url || '')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">✅ Powered by MegaOTT</h4>
            <p className="text-sm text-green-700">
              Your subscription expires on {new Date(credentials?.expiration_date || '').toLocaleDateString()}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
