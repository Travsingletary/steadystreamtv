import React, { useState } from "react";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useAnalytics } from "@/components/LaunchAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tv, Monitor, Smartphone, Tablet, Wifi, Home, Car, Plane, CheckCircle, Clock, Globe, Download, Shield, Star } from 'lucide-react';
import { Link } from "react-router-dom";
import MobileAutomation from "@/components/MobileAutomation";
import EnhancedIPTVSubscription from "@/components/EnhancedIPTVSubscription";

const Index = () => {
  useAnalytics('homepage');
  const [showMobileSignup, setShowMobileSignup] = useState(false);
  const [showIPTVSubscription, setShowIPTVSubscription] = useState(false);

  // If mobile signup modal is open, show the automation
  if (showMobileSignup) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowMobileSignup(false)} variant="outline" size="sm" className="border-gray-600 text-gray-300">
              ← Back to Homepage
            </Button>
          </div>
          
          {/* Mobile Automation Component */}
          <MobileAutomation />
        </div>
      </div>;
  }

  // If IPTV subscription modal is open, show the subscription flow
  if (showIPTVSubscription) {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Close button */}
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowIPTVSubscription(false)} variant="outline" size="sm" className="border-gray-600 text-gray-300">
              ← Back to Homepage
            </Button>
          </div>
          
          {/* IPTV Subscription Component */}
          <EnhancedIPTVSubscription onComplete={() => setShowIPTVSubscription(false)} />
        </div>
      </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* Mobile-Optimized Header */}
      <header className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 md:gap-8">
          {/* Mobile: Logo first, full width */}
          <div className="flex justify-center md:order-2">
            <img src="/lovable-uploads/310d5e27-e7eb-4960-8cec-cb6ef89a79cd.png" alt="SteadyStream TV Logo" className="h-32 md:h-80 w-auto object-cover" />
          </div>

          {/* Mobile: Navigation hidden, Desktop: left aligned */}
          <nav className="hidden md:flex justify-start md:order-1">
            <div className="flex space-x-8">
              <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
              <a href="#devices" className="hover:text-yellow-400 transition-colors">Devices</a>
              <a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a>
              <Link to="/admin-login" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            </div>
          </nav>

          {/* Mobile: CTA button, full width centered */}
          <div className="flex justify-center md:justify-end md:order-3">
            <Button onClick={() => setShowIPTVSubscription(true)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold px-4 md:px-6 py-2 md:py-3 text-sm md:text-base">
              🎉 Start Free Trial
            </Button>
          </div>
        </div>

        {/* Mobile Navigation with Admin Link */}
        <nav className="md:hidden mt-4">
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#devices" className="hover:text-yellow-400 transition-colors">Devices</a>
            <a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a>
            <Link to="/admin-login" className="hover:text-purple-400 transition-colors flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </nav>
      </header>

      {/* Mobile-Optimized Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-8 md:py-16 text-center">
        {/* Mobile: Simplified Device Icons */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="grid grid-cols-4 gap-4 md:gap-8 max-w-xs md:max-w-md mx-auto">
            <div className="flex justify-center">
              <Tv className="w-8 h-8 md:w-16 md:h-16 text-yellow-400" />
            </div>
            <div className="flex justify-center">
              <Monitor className="w-8 h-8 md:w-16 md:h-16 text-yellow-400" />
            </div>
            <div className="flex justify-center">
              <Tablet className="w-8 h-8 md:w-16 md:h-16 text-yellow-400" />
            </div>
            <div className="flex justify-center">
              <Smartphone className="w-8 h-8 md:w-16 md:h-16 text-yellow-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight">
          The Smarter Way to <span className="text-yellow-400">Stream</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-300 mb-8 md:mb-12 max-w-3xl mx-auto px-2">
          Premium IPTV streaming with 1000+ channels. Watch on your Smart TV at home, 
          laptop at the office, or phone while traveling. One service, every device, anywhere.
        </p>
        
        {/* Mobile-Optimized Button Group */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-6 justify-center items-center mb-8 md:mb-12 px-4">
          <Button onClick={() => setShowIPTVSubscription(true)} size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 md:py-4 px-6 md:px-8 text-base md:text-lg w-full md:w-auto md:min-w-[240px]">
            🎉 Start 24-Hour Free Trial
          </Button>
          <Button variant="outline" size="lg" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black py-3 md:py-4 px-6 md:px-8 text-base md:text-lg w-full md:w-auto md:min-w-[240px]" onClick={() => document.getElementById('features')?.scrollIntoView({
          behavior: 'smooth'
        })}>
            📺 See All Features
          </Button>
        </div>

        {/* Mobile-Optimized Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
            <span>📺 Smart TV Ready</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
            <span>💻 Computer Compatible</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
            <span>📱 Mobile Friendly</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
            <span>🚫 No Credit Card</span>
          </div>
        </div>
      </section>

      {/* Device Compatibility Section - Mobile Optimized */}
      <section id="devices" className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Works on Every Device You Own</h2>
          <p className="text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto px-2">
            SteadyStream TV isn't limited to one device. Get the complete TV experience everywhere - 
            your living room, office, bedroom, or anywhere you travel.
          </p>
        </div>
        
        {/* Mobile: 2-column grid, Desktop: 4-column */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-16">
          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader className="pb-2 md:pb-4">
              <div className="flex justify-center mb-2 md:mb-4">
                <Tv className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
              </div>
              <CardTitle className="text-sm md:text-lg">📺 Living Room</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-4">
                Smart TVs, Fire TV, Android TV, Apple TV, Roku
              </p>
              <Badge variant="secondary" className="text-xs">Primary Experience</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader className="pb-2 md:pb-4">
              <div className="flex justify-center mb-2 md:mb-4">
                <Monitor className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
              </div>
              <CardTitle className="text-sm md:text-lg">💻 Office & Study</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-4">
                Windows, Mac, Chromebook, Linux computers
              </p>
              <Badge variant="secondary" className="text-xs">Full Features</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader className="pb-2 md:pb-4">
              <div className="flex justify-center mb-2 md:mb-4">
                <Tablet className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
              </div>
              <CardTitle className="text-sm md:text-lg">📱 Personal Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-4">
                Phones, tablets, iPads - iOS and Android
              </p>
              <Badge variant="secondary" className="text-xs">On-the-Go</Badge>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 text-center">
            <CardHeader className="pb-2 md:pb-4">
              <div className="flex justify-center mb-2 md:mb-4">
                <Globe className="w-8 h-8 md:w-12 md:h-12 text-yellow-400" />
              </div>
              <CardTitle className="text-sm md:text-lg">🌍 Anywhere</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-xs md:text-sm mb-2 md:mb-4">
                Hotels, vacation rentals, friend's house
              </p>
              <Badge variant="secondary" className="text-xs">Travel Ready</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Centered Highlight Card */}
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-green-800 to-blue-800 border-green-500 max-w-md">
            <CardContent className="p-6 md:p-8 text-center">
              <Wifi className="w-10 h-10 md:w-12 md:h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg md:text-xl font-bold mb-3">Just Need Internet</h3>
              <p className="text-gray-300 text-sm md:text-base">
                Any device + Any internet connection = Complete TV experience
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section id="features" className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose SteadyStream TV?</h2>
        </div>
        
        {/* Mobile: 1-column, Desktop: 3-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                <img src="/lovable-uploads/310d5e27-e7eb-4960-8cec-cb6ef89a79cd.png" alt="SteadyStream" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-4">1000+ Premium Channels</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              Complete channel lineup including news, sports, movies, entertainment, 
              kids content, and international channels.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                <Globe className="w-8 h-8 md:w-10 md:h-10 text-black" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-4">Stream Everywhere</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              One account works on all your devices. Watch on your Smart TV at home, 
              laptop at work, or phone while traveling.
            </p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4 md:mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-yellow-500 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 md:w-10 md:h-10 text-black" />
              </div>
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-4">Reliable & Secure</h3>
            <p className="text-gray-300 leading-relaxed text-sm md:text-base">
              99.9% uptime, secure streaming, and 24/7 customer support. 
              Your entertainment is always available when you need it.
            </p>
          </div>
        </div>
      </section>

      {/* Perfectly Balanced Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Choose Your Streaming Plan</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Same premium content on all devices - just choose how many streams you need
          </p>
        </div>
        
        {/* Perfect 3-Card Grid with Equal Spacing */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">1</span>
                </div>
              </div>
              <CardTitle className="text-xl">Solo Streaming</CardTitle>
              <div className="text-3xl font-bold mt-4">
                <span className="text-yellow-400">$20</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>1 Stream Anywhere</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Perfect for Individuals</span>
              </div>
              <Button onClick={() => setShowIPTVSubscription(true)} className="w-full mt-6 bg-gray-700 hover:bg-gray-600">
                Choose Solo
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-2 border-yellow-500 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-yellow-500 text-black font-bold px-4 py-1">MOST POPULAR</Badge>
            </div>
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">2</span>
                </div>
              </div>
              <CardTitle className="text-xl">Duo Streaming</CardTitle>
              <div className="text-3xl font-bold mt-4">
                <span className="text-yellow-400">$35</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>2 Streams Anywhere</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Perfect for Couples</span>
              </div>
              <Button onClick={() => setShowIPTVSubscription(true)} className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold">
                Choose Duo
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-lg">3</span>
                </div>
              </div>
              <CardTitle className="text-xl">Family Streaming</CardTitle>
              <div className="text-3xl font-bold mt-4">
                <span className="text-yellow-400">$45</span>
                <span className="text-lg text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>3 Streams Anywhere</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>All 1000+ Channels</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Works on Every Device</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <span>Perfect for Families</span>
              </div>
              <Button onClick={() => setShowIPTVSubscription(true)} className="w-full mt-6 bg-gray-700 hover:bg-gray-600">
                Choose Family
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Centered Trial CTA */}
        <div className="flex justify-center">
          <Card className="max-w-2xl bg-gradient-to-r from-blue-900 to-purple-900 border-blue-500">
            <CardHeader className="text-center">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <CardTitle className="text-2xl">Try SteadyStream TV FREE</CardTitle>
              <CardDescription className="text-blue-200">
                24 hours of unlimited streaming on all your devices - no credit card required
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => setShowIPTVSubscription(true)} size="lg" className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold mb-6">
                🎉 Start Free Trial Now
              </Button>
              <div className="grid grid-cols-3 gap-4 text-sm text-blue-200">
                <div className="text-center">⚡ Instant Setup</div>
                <div className="text-center">📺 All Devices</div>
                <div className="text-center">🌍 Works Everywhere</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-900 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">How SteadyStream TV Works</h2>
          </div>
          
          {/* Perfect 3-Column Process Grid */}
          <div className="grid md:grid-cols-3 gap-12 mb-16 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-2xl">1</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Sign Up & Get Setup Code</h3>
              <p className="text-gray-300 leading-relaxed">
                Create your account and receive an instant activation code. 
                Works on all your devices immediately.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-2xl">2</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Download App & Add Playlist</h3>
              <p className="text-gray-300 leading-relaxed">
                Install TiviMate (or any IPTV app) on your devices and add 
                your SteadyStream playlist using the activation code.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span className="text-black font-bold text-2xl">3</span>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Stream Everywhere</h3>
              <p className="text-gray-300 leading-relaxed">
                Enjoy 1000+ channels on any device, anywhere. 
                Your TV experience travels with you.
              </p>
            </div>
          </div>

          {/* Centered Final CTA */}
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-8">Ready for the Complete TV Experience?</h3>
            <Button size="lg" onClick={() => setShowIPTVSubscription(true)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-8 text-lg">
              🚀 Start Your Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Balanced Footer */}
      <footer className="bg-black py-16">
        <div className="container mx-auto px-6">
          {/* Perfect 4-Column Grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                <img src="/lovable-uploads/310d5e27-e7eb-4960-8cec-cb6ef89a79cd.png" alt="SteadyStream" className="h-8 w-auto" />
                <h4 className="text-lg font-bold text-yellow-400">SteadyStream TV</h4>
              </div>
              <p className="text-gray-400">
                Complete streaming solution that works on every device, everywhere.
              </p>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-lg font-bold mb-4">Devices</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📺 Smart TVs</li>
                <li>💻 Computers</li>
                <li>📱 Mobile Devices</li>
                <li>🎮 Gaming Consoles</li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Setup Guide</li>
                <li>Device Help</li>
                <li>Troubleshooting</li>
                <li>24/7 Support</li>
              </ul>
            </div>
            
            <div className="text-center md:text-left">
              <h4 className="text-lg font-bold mb-4">Content</h4>
              <ul className="space-y-2 text-gray-400">
                <li>1000+ Channels</li>
                <li>Live Sports</li>
                <li>Premium Movies</li>
                <li>International</li>
              </ul>
            </div>
          </div>
          
          {/* Centered Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SteadyStream TV. Complete streaming experience, everywhere. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Launch Components */}
      <FeedbackWidget />
      <PerformanceMonitor />
    </div>;
};

export default Index;
