
import React, { useState } from "react";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useAnalytics } from "@/components/LaunchAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Tv, Monitor, Smartphone, Tablet, Wifi, Home, Car, Plane, 
  CheckCircle, Clock, Globe, Download, Shield, Star 
} from 'lucide-react';
import MobileAutomation from "@/components/MobileAutomation";

const Index = () => {
  useAnalytics('homepage');
  const [showMobileSignup, setShowMobileSignup] = useState(false);

  // If mobile signup modal is open, show the automation
  if (showMobileSignup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => setShowMobileSignup(false)}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300"
            >
              ← Back to Homepage
            </Button>
          </div>
          
          {/* Mobile Automation Component */}
          <MobileAutomation onClose={() => setShowMobileSignup(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Balanced Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <img
                src="/lovable-uploads/310d5e27-e7eb-4960-8cec-cb6ef89a79cd.png"
                alt="SteadyStream TV Logo"
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              STEADYSTREAM TV
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#devices" className="hover:text-yellow-400 transition-colors">Devices</a>
            <a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a>
          </nav>

          <Button 
            onClick={() => setShowMobileSignup(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
          >
            🎉 Start Free Trial
          </Button>
        </div>
      </header>

      {/* Balanced Hero Section */}
      <section className="container mx-auto px-6 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="grid grid-cols-4 gap-4 text-4xl">
            <Tv className="w-16 h-16 text-yellow-400" />
            <Monitor className="w-16 h-16 text-yellow-400" />
            <Tablet className="w-16 h-16 text-yellow-400" />
            <Smartphone className="w-16 h-16 text-yellow-400" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          The Smarter Way to <span className="text-yellow-400">Stream</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Premium IPTV streaming with 1000+ channels. Watch on your Smart TV at home, 
          laptop at the office, or phone while traveling. One service, every device, anywhere.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button 
            onClick={() => setShowMobileSignup(true)}
            size="lg"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-8 text-lg"
          >
            🎉 Start 24-Hour Free Trial
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black py-4 px-8 text-lg"
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            📺 See All Features
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>📺 Smart TV Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>💻 Computer Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>📱 Mobile Friendly</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>🚫 No Credit Card</span>
          </div>
        </div>
      </section>

      {/* Device Compatibility Section */}
      <section id="devices" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">Works on Every Device You Own</h2>
        <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
          SteadyStream TV isn't limited to one device. Get the complete TV experience everywhere - 
          your living room, office, bedroom, or anywhere you travel.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader>
              <Tv className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle>📺 Living Room</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Smart TVs, Fire TV, Android TV, Apple TV, Roku
              </p>
              <Badge variant="secondary">Primary Experience</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader>
              <Monitor className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle>💻 Office & Study</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Windows, Mac, Chromebook, Linux computers
              </p>
              <Badge variant="secondary">Full Features</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader>
              <Tablet className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle>📱 Personal Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Phones, tablets, iPads - iOS and Android
              </p>
              <Badge variant="secondary">On-the-Go</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader>
              <Globe className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <CardTitle>🌍 Anywhere</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">
                Hotels, vacation rentals, friend's house
              </p>
              <Badge variant="secondary">Travel Ready</Badge>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Card className="inline-block bg-gradient-to-r from-green-800 to-blue-800 border-green-500">
            <CardContent className="p-6">
              <Wifi className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Just Need Internet</h3>
              <p className="text-gray-300">
                Any device + Any internet connection = Complete TV experience
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose SteadyStream TV?</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tv className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold mb-4">1000+ Premium Channels</h3>
            <p className="text-gray-300">
              Complete channel lineup including news, sports, movies, entertainment, 
              kids content, and international channels.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Stream Everywhere</h3>
            <p className="text-gray-300">
              One account works on all your devices. Watch on your Smart TV at home, 
              laptop at work, or phone while traveling.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Reliable & Secure</h3>
            <p className="text-gray-300">
              99.9% uptime, secure streaming, and 24/7 customer support. 
              Your entertainment is always available when you need it.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">Choose Your Streaming Plan</h2>
        <p className="text-center text-gray-300 mb-16">
          Same premium content on all devices - just choose how many streams you need
        </p>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold">1</span>
              </div>
              <CardTitle>Solo Streaming</CardTitle>
              <div className="text-3xl font-bold">
                <span className="text-yellow-400">$20</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>1 Stream Anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Perfect for Individuals</span>
              </div>
              <Button 
                onClick={() => setShowMobileSignup(true)}
                className="w-full mt-6 bg-gray-700 hover:bg-gray-600"
              >
                Choose Solo
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-2 border-yellow-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-500 text-black">MOST POPULAR</Badge>
            </div>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold">2</span>
              </div>
              <CardTitle>Duo Streaming</CardTitle>
              <div className="text-3xl font-bold">
                <span className="text-yellow-400">$35</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>2 Streams Anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Perfect for Couples</span>
              </div>
              <Button 
                onClick={() => setShowMobileSignup(true)}
                className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold"
              >
                Choose Duo
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-black font-bold">3</span>
              </div>
              <CardTitle>Family Streaming</CardTitle>
              <div className="text-3xl font-bold">
                <span className="text-yellow-400">$45</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>3 Streams Anywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Perfect for Families</span>
              </div>
              <Button 
                onClick={() => setShowMobileSignup(true)}
                className="w-full mt-6 bg-gray-700 hover:bg-gray-600"
              >
                Choose Family
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trial CTA */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-900 to-purple-900 border-blue-500">
          <CardHeader className="text-center">
            <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <CardTitle className="text-2xl">Try SteadyStream TV FREE</CardTitle>
            <CardDescription className="text-blue-200">
              24 hours of unlimited streaming on all your devices - no credit card required
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => setShowMobileSignup(true)}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold mb-4"
            >
              🎉 Start Free Trial Now
            </Button>
            <div className="grid grid-cols-3 gap-4 text-sm text-blue-200">
              <div>⚡ Instant Setup</div>
              <div>📺 All Devices</div>
              <div>🌍 Works Everywhere</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How SteadyStream TV Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Sign Up & Get Setup Code</h3>
              <p className="text-gray-300">
                Create your account and receive an instant activation code. 
                Works on all your devices immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Download App & Add Playlist</h3>
              <p className="text-gray-300">
                Install TiviMate (or any IPTV app) on your devices and add 
                your SteadyStream playlist using the activation code.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-black font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Stream Everywhere</h3>
              <p className="text-gray-300">
                Enjoy 1000+ channels on any device, anywhere. 
                Your TV experience travels with you.
              </p>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Ready for the Complete TV Experience?</h3>
            <Button 
              size="lg"
              onClick={() => setShowMobileSignup(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-8 text-lg"
            >
              🚀 Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4 text-yellow-400">SteadyStream TV</h4>
              <p className="text-gray-400">
                Complete streaming solution that works on every device, everywhere.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Devices</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📺 Smart TVs</li>
                <li>💻 Computers</li>
                <li>📱 Mobile Devices</li>
                <li>🎮 Gaming Consoles</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Setup Guide</li>
                <li>Device Help</li>
                <li>Troubleshooting</li>
                <li>24/7 Support</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Content</h4>
              <ul className="space-y-2 text-gray-400">
                <li>1000+ Channels</li>
                <li>Live Sports</li>
                <li>Premium Movies</li>
                <li>International</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SteadyStream TV. Complete streaming experience, everywhere. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Launch Components */}
      <FeedbackWidget />
      <PerformanceMonitor />
    </div>
  );
};

export default Index;
