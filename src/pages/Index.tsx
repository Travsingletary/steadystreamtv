import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import FeaturesSection from "@/components/FeaturesSection";
import DevicesSection from "@/components/DevicesSection";
import ChannelsSection from "@/components/ChannelsSection";
import PricingSection from "@/components/PricingSection";
import FooterSection from "@/components/FooterSection";
import MobileAutomation from "@/components/MobileAutomation";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { useAnalytics } from "@/components/LaunchAnalytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Smartphone, Globe, Plane, Car, Home, MapPin, Tv } from "lucide-react";

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
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Updated Mobile-Focused Hero Section */}
      <section id="home" className="pt-24 pb-16 md:pt-32 md:pb-24 relative">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605810230434-7631ac76ec81')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="md:w-1/2 space-y-6 animate-fade-in">
              {/* Mobile-focused messaging */}
              <div className="flex justify-center md:justify-start mb-4">
                <div className="flex gap-4 text-4xl">
                  <Smartphone className="w-12 h-12 text-gold" />
                  <Globe className="w-12 h-12 text-gold" />
                  <Tv className="w-12 h-12 text-gold" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center md:text-left">
                Stream <span className="text-gradient-gold">Anywhere</span><br/>
                Your TV Goes <span className="text-gradient-gold">Mobile</span>
              </h1>
              
              <p className="text-gray-300 text-lg md:text-xl max-w-xl text-center md:text-left">
                Premium IPTV that travels with you. 10,000+ channels on your phone, tablet, laptop, or TV. 
                Perfect for commutes, travel, or relaxing anywhere.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center md:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-gold to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold" 
                  onClick={() => setShowMobileSignup(true)}
                >
                  📱 Start Mobile Streaming
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gold text-gold hover:bg-gold/10"
                  onClick={() => document.getElementById('anywhere')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  🌍 See Where It Works
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-gray-200">📱 Mobile Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-gray-200">✈️ Travel Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-gray-200">⚡ Instant Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-gray-200">🚫 No Credit Card</span>
                </div>
              </div>
            </div>
            
            {/* Keep existing TV image */}
            <div style={{ animationDelay: "0.3s" }} className="md:w-1/2 flex justify-center animate-fade-in px-0 py-[20px]">
              <div className="relative">
                <div className="tv-flatscreen">
                  <div className="border border-gray-700 shadow-lg overflow-hidden w-full max-w-md rounded bg-black">
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-1/3 h-2 bg-gray-700 rounded-b-lg"></div>
                    <div className="aspect-video overflow-hidden rounded-none bg-slate-950">
                      <img src="/lovable-uploads/60de453f-8cb1-417a-ad2f-209df6c72378.png" alt="Family watching TV" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="relative flex justify-center mt-6">
                    <img alt="SteadyStream TV" src="/lovable-uploads/02b1a674-0365-4ccb-b387-38a69c2c5b7c.png" className="w-3/4 h-auto object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Trial CTA Section */}
      <section className="container mx-auto px-6 py-8 text-center">
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-green-900 to-blue-900 border-green-500">
          <CardHeader>
            <Globe className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <CardTitle className="text-2xl text-green-200">Try Mobile Streaming FREE for 24 Hours</CardTitle>
            <CardDescription className="text-green-100">
              Full access to premium channels on any device, anywhere in the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowMobileSignup(true)}
              size="lg"
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold mb-4"
            >
              📱 Start Mobile Trial Now
            </Button>
            <div className="grid grid-cols-3 gap-4 text-sm text-green-200">
              <div>⚡ Instant Setup</div>
              <div>🌍 Stream Anywhere</div>
              <div>📱 Any Device</div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Where You Can Stream Section */}
      <section id="anywhere" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-4">Stream Everywhere Life Takes You</h2>
        <p className="text-center text-gray-300 mb-16 max-w-2xl mx-auto">
          SteadyStream TV isn't tied to your living room. Take your entertainment anywhere with internet.
        </p>
        
        <div className="grid md:grid-cols-4 gap-8">
          <Card className="bg-dark-200 border-gray-800 text-center hover:border-gold/30 transition-colors">
            <CardHeader>
              <Home className="w-12 h-12 text-gold mx-auto mb-4" />
              <CardTitle>🏠 At Home</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Couch, bedroom, kitchen - stream on any device in your house
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800 text-center hover:border-gold/30 transition-colors">
            <CardHeader>
              <Car className="w-12 h-12 text-gold mx-auto mb-4" />
              <CardTitle>🚗 On Commutes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Bus, train, or passenger seat - never miss your shows
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800 text-center hover:border-gold/30 transition-colors">
            <CardHeader>
              <Plane className="w-12 h-12 text-gold mx-auto mb-4" />
              <CardTitle>✈️ While Traveling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Hotels, airports, vacation rentals - your TV travels with you
              </p>
            </CardContent>
          </Card>

          <Card className="bg-dark-200 border-gray-800 text-center hover:border-gold/30 transition-colors">
            <CardHeader>
              <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
              <CardTitle>📍 Anywhere</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm">
                Coffee shops, gym, friend's house - stream wherever you are
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Mobile-Focused Pricing Section */}
      <section id="pricing" className="py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mobile <span className="text-gradient-gold">Streaming</span> Plans
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Same great content everywhere - just choose how many streams you want simultaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Solo Stream */}
            <Card className="bg-dark-200 border-gray-800 hover:border-gold/30 transition-colors">
              <CardHeader className="text-center">
                <Smartphone className="w-12 h-12 text-gold mx-auto mb-4" />
                <CardTitle>Solo Stream</CardTitle>
                <div className="text-3xl font-bold">
                  <span className="text-gold">$20</span>
                  <span className="text-lg text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">1 Stream Anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">Perfect for Solo Travel</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">All Device Types</span>
                </div>
                <Button 
                  onClick={() => setShowMobileSignup(true)}
                  className="w-full mt-6 bg-gray-700 hover:bg-gray-600"
                >
                  Choose Solo
                </Button>
              </CardContent>
            </Card>

            {/* Duo Stream - Most Popular */}
            <Card className="bg-dark-200 border-gold relative tv-glow">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gold text-black">MOST POPULAR</Badge>
              </div>
              <CardHeader className="text-center">
                <div className="flex justify-center gap-2 mb-4">
                  <Smartphone className="w-6 h-6 text-gold" />
                  <Smartphone className="w-6 h-6 text-gold" />
                </div>
                <CardTitle>Duo Stream</CardTitle>
                <div className="text-3xl font-bold">
                  <span className="text-gold">$35</span>
                  <span className="text-lg text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">2 Streams Anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">Perfect for Couples</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">Watch Different Shows</span>
                </div>
                <Button 
                  onClick={() => setShowMobileSignup(true)}
                  className="w-full mt-6 bg-gold hover:bg-gold-dark text-black font-bold"
                >
                  Choose Duo
                </Button>
              </CardContent>
            </Card>

            {/* Family Stream */}
            <Card className="bg-dark-200 border-gray-800 hover:border-gold/30 transition-colors">
              <CardHeader className="text-center">
                <div className="flex justify-center gap-1 mb-4">
                  <Smartphone className="w-5 h-5 text-gold" />
                  <Smartphone className="w-5 h-5 text-gold" />
                  <Smartphone className="w-5 h-5 text-gold" />
                </div>
                <CardTitle>Family Stream</CardTitle>
                <div className="text-3xl font-bold">
                  <span className="text-gold">$45</span>
                  <span className="text-lg text-gray-400">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">3 Streams Anywhere</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">Perfect for Families</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-gold h-4 w-4" />
                  <span className="text-sm">Everyone Streams Anywhere</span>
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
        </div>
      </section>
      
      {/* Keep existing sections but with updated messaging */}
      <FeaturesSection />
      <DevicesSection />
      <ChannelsSection />
      <FooterSection />
      
      {/* Launch Components */}
      <FeedbackWidget />
      <PerformanceMonitor />
    </div>
  );
};

export default Index;
