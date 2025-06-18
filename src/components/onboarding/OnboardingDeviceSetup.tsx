
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Monitor, Tv, Tablet, Play, ArrowRight } from "lucide-react";
import { CrossDeviceSetup } from '@/services/CrossDeviceSetup';
import { FireTVAppSelection } from './FireTVAppSelection';

interface UserData {
  name: string;
  email: string;
  preferredDevice: string;
  genres: string[];
  subscription: any;
}

interface OnboardingDeviceSetupProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const devices = [
  {
    id: "smartphone",
    name: "Phone/Tablet",
    icon: Smartphone,
    description: "Android or iPhone/iPad",
    method: "deep_link"
  },
  {
    id: "firestick", 
    name: "Amazon Fire TV Stick",
    icon: Play,
    description: "Choose between 2 SteadyStream apps",
    method: "dual_app_choice",
    popular: true
  },
  {
    id: "apple_tv",
    name: "Apple TV",
    icon: Tv,
    description: "Apple TV 4K, Apple TV HD",
    method: "activation_code"
  },
  {
    id: "android_tv",
    name: "Android TV/Smart TV", 
    icon: Monitor,
    description: "Sony, Samsung, LG, other Smart TVs",
    method: "activation_code"
  }
];

export const OnboardingDeviceSetup = ({ 
  userData, 
  updateUserData, 
  onNext, 
  onBack 
}: OnboardingDeviceSetupProps) => {
  const [currentStep, setCurrentStep] = useState<'device_selection' | 'firetv_app_selection' | 'tv_setup' | 'deep_link'>('device_selection');
  const [selectedDevice, setSelectedDevice] = useState<string>(userData.preferredDevice || "");
  const [selectedAppType, setSelectedAppType] = useState<string | null>(null);
  const [activationCode, setActivationCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(15 * 60);
  const [loading, setLoading] = useState<boolean>(false);

  // Timer countdown
  React.useEffect(() => {
    if (timeRemaining > 0 && currentStep === 'tv_setup') {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, currentStep]);

  const handleDeviceSelect = (device: any) => {
    setSelectedDevice(device.id);
    updateUserData({ preferredDevice: device.id });
    
    if (device.id === 'firestick') {
      setCurrentStep('firetv_app_selection');
    } else if (device.method === 'deep_link') {
      handleDeepLink();
    } else {
      generateActivationCodeForDevice(device.id);
    }
  };

  const handleFireTVAppSelect = async (deviceType: string, appType: string) => {
    setSelectedAppType(appType);
    await generateActivationCodeForDevice(deviceType, appType);
  };

  const generateActivationCodeForDevice = async (deviceType: string, appType?: string) => {
    setLoading(true);
    try {
      const code = await CrossDeviceSetup.createPairingCode(userData, deviceType, appType);
      setActivationCode(code);
      setTimeRemaining(15 * 60);
      setCurrentStep('tv_setup');
    } catch (error) {
      alert('Failed to generate activation code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeepLink = () => {
    setCurrentStep('deep_link');
    const deepLink = `steadystream://setup?user=${userData.email}&device=mobile`;
    window.location.href = deepLink;
    
    setTimeout(() => {
      if (!document.hidden) {
        const userAgent = navigator.userAgent.toLowerCase();
        if (userAgent.includes('android')) {
          window.open('https://play.google.com/store/apps/details?id=com.steadystream.tv', '_blank');
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
          window.open('https://apps.apple.com/app/steadystream-tv/id123456789', '_blank');
        }
      }
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(activationCode);
    alert('Activation code copied to clipboard!');
  };

  const resetToDeviceSelection = () => {
    setCurrentStep('device_selection');
    setSelectedDevice('');
    setSelectedAppType(null);
    setActivationCode('');
  };

  const resetToAppSelection = () => {
    setCurrentStep('firetv_app_selection');
    setSelectedAppType(null);
    setActivationCode('');
  };

  const handleContinue = () => {
    onNext();
  };

  // Device selection screen
  if (currentStep === 'device_selection') {
    return (
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 text-white">📺 Choose Your Streaming Device</h1>
        <p className="text-gray-400 mb-8">
          Select where you'll be watching SteadyStream TV
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {devices.map((device) => {
            const Icon = device.icon;
            return (
              <Card
                key={device.id}
                className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 bg-dark-300 border-gray-700 ${
                  device.popular ? 'ring-2 ring-gold' : ''
                } ${selectedDevice === device.id ? 'border-gold bg-dark-100' : ''}`}
                onClick={() => handleDeviceSelect(device)}
              >
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <div className={`p-2 rounded-full ${
                      selectedDevice === device.id 
                        ? "bg-gold text-black" 
                        : "bg-dark-200"
                    }`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="flex items-center justify-center space-x-2 text-white">
                    <span>{device.name}</span>
                    {device.popular && (
                      <Badge className="bg-gold text-black">Most Popular</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-400">{device.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {device.id === 'firestick' ? '2 App Options' : 
                     device.method === 'deep_link' ? 'Instant Setup' : 'Code Setup'}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline"
            className="border-gray-700 text-gray-300"
            onClick={onBack}
          >
            Back
          </Button>
          <Button 
            className="bg-gold hover:bg-gold-dark text-black font-semibold flex-1"
            onClick={handleContinue}
            disabled={!selectedDevice}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  // Fire TV app selection
  if (currentStep === 'firetv_app_selection') {
    return (
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
        <FireTVAppSelection
          userData={userData}
          onAppSelect={handleFireTVAppSelect}
          onBack={resetToDeviceSelection}
        />
      </div>
    );
  }

  // Deep link screen
  if (currentStep === 'deep_link') {
    return (
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in text-center space-y-4">
        <div className="text-4xl mb-4">📱</div>
        <h2 className="text-2xl font-bold text-white">Opening SteadyStream TV...</h2>
        <p className="text-gray-400">
          Your account will be automatically configured in the app
        </p>
        <Button onClick={resetToDeviceSelection} variant="outline" className="border-gray-700 text-gray-300">
          ← Choose Different Device
        </Button>
      </div>
    );
  }

  // TV setup screen with activation code
  const deviceInstructions = CrossDeviceSetup.getDeviceInstructions(selectedDevice!, selectedAppType || undefined);

  if (!deviceInstructions) {
    return (
      <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in text-center">
        <p className="text-white">Device instructions not found.</p>
        <Button onClick={resetToDeviceSelection} className="mt-4">← Back</Button>
      </div>
    );
  }

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <Button onClick={resetToDeviceSelection} variant="outline" size="sm" className="border-gray-700 text-gray-300">
          ← Back to Devices
        </Button>
        {selectedDevice === 'firestick' && (
          <Button onClick={resetToAppSelection} variant="outline" size="sm" className="border-gray-700 text-gray-300">
            🔄 Switch App Version
          </Button>
        )}
      </div>

      <div className="text-center mb-8">
        <div className="text-4xl mb-2">{selectedDevice === 'firestick' && deviceInstructions.icon ? deviceInstructions.icon : '📺'}</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Setting Up {deviceInstructions.name}
        </h2>
        <p className="text-gray-400">
          {deviceInstructions.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Activation Code */}
        <Card className="bg-dark-300 border-gray-700">
          <CardHeader>
            <CardTitle className="text-green-400">🔑 Your Activation Code</CardTitle>
            <CardDescription className="text-gray-400">
              Enter this code in the app • Expires in {formatTime(timeRemaining)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-mono font-bold text-green-400 bg-green-900/20 border-2 border-green-500/30 rounded-lg p-4 md:p-6">
                {activationCode || '------'}
              </div>
              <Button 
                onClick={copyCode}
                variant="outline"
                size="sm"
                className="mt-3 border-gray-700 text-gray-300"
                disabled={!activationCode}
              >
                📋 Copy Code
              </Button>
            </div>

            {timeRemaining < 300 && (
              <Alert className="border-orange-500/30 bg-orange-900/20">
                <AlertDescription className="text-orange-300">
                  ⏰ Code expires soon! Generate a new one if needed.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={() => generateActivationCodeForDevice(selectedDevice!, selectedAppType || undefined)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              variant="outline"
              disabled={loading}
            >
              {loading ? '⏳ Generating...' : '🔄 Generate New Code'}
            </Button>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-dark-300 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Setup Instructions</CardTitle>
            <CardDescription className="text-gray-400">
              Follow these steps on your {deviceInstructions.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="steps">
              <TabsList className="grid w-full grid-cols-2 bg-dark-200">
                <TabsTrigger value="steps" className="text-gray-300">Steps</TabsTrigger>
                <TabsTrigger value="features" className="text-gray-300">Features</TabsTrigger>
              </TabsList>
              
              <TabsContent value="steps" className="mt-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {deviceInstructions.steps?.map((step, index) => (
                    <li key={index} className="text-gray-300">
                      {step}
                      {step.includes('1592817') && (
                        <Badge className="ml-2 bg-blue-500 text-xs">Download Code</Badge>
                      )}
                      {step.includes('activation code') && (
                        <Badge className="ml-2 bg-green-500 text-xs">Use Code Above</Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </TabsContent>
              
              <TabsContent value="features" className="mt-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-white">What you'll get:</h4>
                  {selectedDevice === 'firestick' && deviceInstructions.features ? (
                    <ul className="text-sm text-gray-300 space-y-1">
                      {deviceInstructions.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-400 mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li className="flex items-start space-x-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>High-quality streaming</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Easy setup and navigation</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>Reliable performance</span>
                      </li>
                    </ul>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline"
          className="border-gray-700 text-gray-300"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          className="bg-gold hover:bg-gold-dark text-black font-semibold flex-1"
          onClick={handleContinue}
        >
          Continue to Final Setup
        </Button>
      </div>
    </div>
  );
};
