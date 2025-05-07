
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Smartphone, Tv, Monitor } from "lucide-react";
import { Link } from "react-router-dom";

const ConnectApps = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center">Connect to External Applications</h1>
        <p className="text-gray-300 text-center mb-12 max-w-2xl mx-auto">
          Access SteadyStream on different platforms and connect with our partner applications
          for an enhanced streaming experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* TiviMate Card */}
          <Card className="bg-dark-200 border border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tv className="text-gold" />
                TiviMate for Fire Stick
              </CardTitle>
              <CardDescription>
                Premium IPTV Player specifically for Amazon Fire Stick devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img 
                src="/lovable-uploads/0951aea1-2e5f-4aa0-9de1-ec13d0eb3489.png" 
                alt="TiviMate" 
                className="h-32 object-contain mb-4" 
              />
              <p className="text-gray-300 mb-4">
                TiviMate is one of the best IPTV players specifically designed for Amazon Fire Stick devices. 
                Connect your SteadyStream account to enjoy channels with a premium interface.
              </p>
              <div className="bg-dark-300 p-3 rounded-md">
                <p className="text-sm font-medium mb-2">Quick Setup URL for Fire Stick:</p>
                <code className="text-xs bg-gray-800 p-2 rounded block overflow-auto mb-2">
                  https://gangstageeks.com/tivimate/rs6/steady/
                </code>
                <p className="text-xs text-gray-400">
                  Use this URL in TiviMate app on your Fire Stick to automatically configure your SteadyStream account
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full flex items-center gap-2"
                onClick={() => window.open("https://gangstageeks.com/tivimate/rs6/steady/", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open TiviMate Setup
              </Button>
            </CardFooter>
          </Card>

          {/* Lovable App Card */}
          <Card className="bg-dark-200 border border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="text-gold" />
                Mobile Companion App
              </CardTitle>
              <CardDescription>
                Access SteadyStream on all other devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <img 
                src="/lovable-uploads/595f3348-0a60-4bbf-ad62-144c2ab406c1.png" 
                alt="SteadyStream Mobile" 
                className="h-32 object-contain mb-4" 
              />
              <p className="text-gray-300 mb-4">
                Our companion application works on smartphones, tablets, computers, and all other devices.
                Perfect for streaming when you're not using a Fire Stick.
              </p>
              <div className="bg-dark-300 p-3 rounded-md">
                <p className="text-sm font-medium mb-2">App URL for all other devices:</p>
                <code className="text-xs bg-gray-800 p-2 rounded block overflow-auto mb-2">
                  https://lovable.dev/projects/05293635-2b01-4b2d-a7ff-eb9cb8dbed19
                </code>
                <p className="text-xs text-gray-400">
                  Open this URL on any device to access the companion app
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full flex items-center gap-2"
                onClick={() => window.open("https://lovable.dev/projects/05293635-2b01-4b2d-a7ff-eb9cb8dbed19", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open Companion App
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Need Help Connecting?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <Card className="bg-dark-300 border border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tv className="h-4 w-4 text-gold" />
                  Fire Stick
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Download TiviMate on your Fire Stick and use our setup URL for the best experience on Amazon Fire devices.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-300 border border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-gold" />
                  Mobile Devices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Use our companion app on iOS and Android for on-the-go streaming from your smartphone or tablet.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-dark-300 border border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-gold" />
                  Computers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-300">
                  Access our companion app or use VLC Media Player on desktop and laptop computers to watch all channels.
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Link to="/player">
              <Button 
                variant="outline" 
                className="border-gold text-gold hover:bg-gold/10"
              >
                Return to Web Player
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectApps;
