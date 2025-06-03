
import React, { useState } from 'react';
import AutomationSignup from './AutomationSignup';
import SuccessScreen from './SuccessScreen';

const IntegratedHomepage = () => {
  const [showSignup, setShowSignup] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const handleSignupSuccess = (data) => {
    setSuccessData(data);
    setShowSuccess(true);
    setShowSignup(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      
      {/* SUCCESS SCREEN OVERLAY */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <SuccessScreen 
            userData={successData.userData}
            activationCode={successData.activationCode}
            playlistUrl={successData.playlistUrl}
            onReset={() => {
              setShowSuccess(false);
              setShowSignup(false);
            }}
          />
        </div>
      )}

      {/* SIGNUP MODAL OVERLAY */}
      {showSignup && !showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-md w-full">
            <button 
              onClick={() => setShowSignup(false)}
              className="absolute -top-4 -right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
            >
              ✕
            </button>
            <AutomationSignup onSuccess={handleSignupSuccess} />
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/7eee6a9b-1a45-4b4f-993a-eb7c793bb511.png"
              alt="SteadyStream TV"
              className="h-12 w-auto mr-4"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              STEADYSTREAM TV
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-yellow-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-yellow-400 transition-colors">Pricing</a>
            <a href="#support" className="hover:text-yellow-400 transition-colors">Support</a>
          </nav>

          <button 
            onClick={() => setShowSignup(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-2 px-6 rounded-lg transition-all duration-200"
          >
            🚀 Free Trial
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="container mx-auto px-6 py-16 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          The Smarter Way to <span className="text-yellow-400">Stream</span>
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Premium IPTV streaming with thousands of channels, instant setup, and 24/7 support. 
          Start your free trial and be streaming in under 60 seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => setShowSignup(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200"
          >
            🎉 Start 24-Hour Free Trial
          </button>
          <a 
            href="#features" 
            className="border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-bold py-4 px-8 rounded-lg text-lg transition-all duration-200"
          >
            Learn More
          </a>
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>✅ No credit card required • ✅ Instant activation • ✅ Cancel anytime</p>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Why Choose SteadyStream?</h2>
        
        <div className="grid md:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">📺</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Thousands of Channels</h3>
            <p className="text-gray-300">
              Premium content from around the world including sports, movies, news, and entertainment.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Instant Setup</h3>
            <p className="text-gray-300">
              Automated onboarding gets you streaming in under 60 seconds with QR code setup.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-2xl font-bold mb-4">24/7 Support</h3>
            <p className="text-gray-300">
              Premium customer support to help you with any questions or technical issues.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="container mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold text-center mb-16">Choose Your Plan</h2>
        
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Solo Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Solo Stream</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$20</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                1 Device
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                All Premium Channels
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Live Sports + Catch-Up
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                VOD Library
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Solo
            </button>
          </div>

          {/* Duo Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border-2 border-yellow-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-4">Duo Stream</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$35</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                2 Devices
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Everything in Solo
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Perfect for Couples
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Priority Support
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Duo
            </button>
          </div>

          {/* Family Plan */}
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h3 className="text-2xl font-bold mb-4">Family Max</h3>
            <div className="text-4xl font-bold mb-6">
              <span className="text-yellow-400">$45</span>
              <span className="text-lg text-gray-400">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                3 Devices
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                All Features Unlocked
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Perfect for Families
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                Premium Support
              </li>
            </ul>
            <button 
              onClick={() => setShowSignup(true)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
            >
              Choose Family
            </button>
          </div>
        </div>

        {/* EMBEDDED AUTOMATION SIGNUP */}
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">🎉 Start Your Free Trial</h3>
            <p className="text-gray-300">No credit card required • Cancel anytime</p>
          </div>
          <AutomationSignup onSuccess={handleSignupSuccess} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-bold mb-4 text-yellow-400">SteadyStream TV</h4>
              <p className="text-gray-400">
                The smarter way to stream premium IPTV content.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Download</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Setup Guide</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 SteadyStream TV. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default IntegratedHomepage;
