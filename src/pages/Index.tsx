
import { IntegratedAutomation } from "@/components/IntegratedAutomation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Play, Shield, Zap, Globe, Clock } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gold to-yellow-400 bg-clip-text text-transparent">
            SteadyStream TV
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Premium IPTV streaming with 10,000+ channels, 4K quality, and instant setup. 
            Your entertainment, your way.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <IntegratedAutomation />
            <Button 
              variant="outline" 
              className="border-gold text-gold hover:bg-gold hover:text-black"
            >
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <Zap className="h-8 w-8 text-gold mx-auto" />
                <CardTitle className="text-white">Instant Activation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get streaming in under 60 seconds with our automated setup process
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <Shield className="h-8 w-8 text-gold mx-auto" />
                <CardTitle className="text-white">Premium Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  4K streaming, multiple devices, and optimized playlists for the best experience
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <Globe className="h-8 w-8 text-gold mx-auto" />
                <CardTitle className="text-white">Global Content</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Access to 10,000+ channels from around the world with automatic updates
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-dark-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose SteadyStream TV?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Automated Setup</h3>
                  <p className="text-gray-300">Complete onboarding from signup to streaming in under 60 seconds</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Real IPTV Accounts</h3>
                  <p className="text-gray-300">Powered by MegaOTT with professional-grade streaming infrastructure</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Smart Optimization</h3>
                  <p className="text-gray-300">Playlists automatically optimized based on your preferences</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <CheckCircle className="text-green-500 h-6 w-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Professional Support</h3>
                  <p className="text-gray-300">Device-specific setup instructions and 24/7 customer support</p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-300 p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-4 text-gold">What You Get:</h3>
              <ul className="space-y-3 text-gray-300">
                <li>• 10,000+ Live TV Channels</li>
                <li>• Movies & TV Shows Library</li>
                <li>• 4K Ultra HD Quality</li>
                <li>• Multiple Device Support</li>
                <li>• Instant Email Setup Guide</li>
                <li>• QR Code Quick Setup</li>
                <li>• Optimized Playlists</li>
                <li>• Professional Infrastructure</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Simple, Transparent Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gold">Trial</CardTitle>
                <CardDescription>Perfect for testing</CardDescription>
                <div className="text-3xl font-bold text-white">FREE</div>
                <p className="text-sm text-gray-400">24 hours</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 1 Device</li>
                  <li>• Full Channel Access</li>
                  <li>• Email Support</li>
                  <li>• No Credit Card</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-gold relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gold text-black px-3 py-1 rounded-full text-xs font-bold">POPULAR</span>
              </div>
              <CardHeader>
                <CardTitle className="text-gold">Duo</CardTitle>
                <CardDescription>Best for couples</CardDescription>
                <div className="text-3xl font-bold text-white">$35</div>
                <p className="text-sm text-gray-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 2 Devices</li>
                  <li>• Full HD Quality</li>
                  <li>• Premium Support</li>
                  <li>• Optimized Playlists</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-dark-200 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gold">Family</CardTitle>
                <CardDescription>Perfect for families</CardDescription>
                <div className="text-3xl font-bold text-white">$45</div>
                <p className="text-sm text-gray-400">per month</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• 3 Devices</li>
                  <li>• 4K Ultra HD</li>
                  <li>• Priority Support</li>
                  <li>• Family Controls</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <IntegratedAutomation />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 mb-4">
            © 2024 SteadyStream TV. Premium IPTV streaming made simple.
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-gold">Support</a>
            <a href="#" className="text-gray-400 hover:text-gold">Terms</a>
            <a href="#" className="text-gray-400 hover:text-gold">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
