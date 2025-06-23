
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Smartphone, Tv, Monitor, Tablet } from "lucide-react";
import { OnboardingUserData } from "@/types/onboarding";

interface OnboardingDeviceSetupProps {
  userData: OnboardingUserData;
  updateUserData: (data: Partial<OnboardingUserData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const devices = [
  {
    id: "smartphone",
    name: "Smartphone",
    icon: Smartphone,
    description: "Watch on your mobile device"
  },
  {
    id: "smart-tv",
    name: "Smart TV",
    icon: Tv,
    description: "Stream directly to your television"
  },
  {
    id: "web",
    name: "Computer",
    icon: Monitor,
    description: "Watch in your web browser"
  },
  {
    id: "tablet",
    name: "Tablet",
    icon: Tablet,
    description: "Perfect for portable viewing"
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
    if (!selectedDevice) {
      toast.error("Please select your preferred device");
      return;
    }

    updateUserData({ preferredDevice: selectedDevice });
    toast.success("Device preference saved!");
    onNext();
  };

  return (
    <div className="bg-dark-200 rounded-xl border border-gray-800 p-8 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Choose Your Primary Device</h1>
      <p className="text-gray-400 mb-8">
        Select the device you'll use most often to watch SteadyStream TV. 
        You can always change this later in your account settings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.id}
              className={`p-6 rounded-lg border text-left transition-all ${
                selectedDevice === device.id
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-gray-700 text-gray-300 hover:border-gray-500"
              }`}
              onClick={() => setSelectedDevice(device.id)}
            >
              <Icon className="h-8 w-8 mb-3" />
              <h3 className="text-lg font-medium mb-1">{device.name}</h3>
              <p className="text-sm text-gray-400">{device.description}</p>
            </button>
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
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
