
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Tv, Tablet, Play, ArrowRight } from "lucide-react";

interface OnboardingDeviceSetupProps {
  userData: {
    name: string;
    email: string;
    preferredDevice: string;
    genres: string[];
    subscription: any;
  };
  updateUserData: (data: Partial<typeof userData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const devices = [
  {
    id: "smartphone",
    name: "Smartphone",
    icon: Smartphone,
    description: "iOS or Android device",
    instructions: [
      "Download the SteadyStream app from App Store or Google Play",
      "Open the app and sign in with your email",
      "Allow notifications for updates",
      "Enable background playback in settings"
    ]
  },
  {
    id: "smart-tv",
    name: "Smart TV",
    icon: Tv,
    description: "Samsung, LG, Sony, etc.",
    instructions: [
      "Open the app store on your TV",
      "Search for 'SteadyStream TV' app",
      "Install and launch the application", 
      "Sign in with your email and PIN code"
    ]
  },
  {
    id: "firestick",
    name: "Amazon Firestick",
    icon: Play,
    description: "Fire TV Stick or Cube",
    instructions: [
      "From Fire TV home, search for 'SteadyStream'",
      "Select and download the app",
      "Open app and follow on-screen instructions",
      "Use the provided PIN code to activate"
    ]
  },
  {
    id: "tablet",
    name: "Tablet",
    icon: Tablet,
    description: "iPad or Android tablet",
    instructions: [
      "Download the SteadyStream app from your app store",
      "Sign in with your email address",
      "Enable HD streaming in settings",
      "Download content for offline viewing"
    ]
  },
  {
    id: "web",
    name: "Computer",
    icon: Monitor,
    description: "Web browser access",
    instructions: [
      "Visit steadystream.tv in your browser",
      "Sign in with your email",
      "Bookmark the page for easy access",
      "Enable browser notifications"
    ]
  }
];

export const OnboardingDeviceSetup = ({ 
  userData, 
  updateUserData, 
  onNext, 
  onBack 
}: OnboardingDeviceSetupProps) => {
  const [selectedDevice, setSelectedDevice] = useState(userData.preferredDevice || "");

  const handleContinue = () => {
    updateUserData({ preferredDevice: selectedDevice });
    onNext();
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Device Setup</h1>
      <p className="text-gray-400 mb-8">
        Select your primary streaming device and we'll provide customized setup instructions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <div
              key={device.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedDevice === device.id
                  ? "border-gold bg-dark-100"
                  : "border-gray-700 hover:border-gray-500"
              }`}
              onClick={() => setSelectedDevice(device.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-full ${
                  selectedDevice === device.id 
                    ? "bg-gold text-black" 
                    : "bg-dark-300"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">{device.name}</h3>
                  <p className="text-sm text-gray-400">{device.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedDevice && (
        <div className="mb-8 p-4 bg-dark-300 rounded-lg border border-gray-700">
          <h3 className="font-medium text-gold mb-3">Setup Instructions</h3>
          <ol className="space-y-2 pl-4">
            {devices.find(d => d.id === selectedDevice)?.instructions.map((instruction, i) => (
              <li key={i} className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-gold mt-1 flex-shrink-0" />
                <span className="text-sm text-gray-300">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

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
};
