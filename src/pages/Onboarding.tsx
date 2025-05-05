
import { useState } from "react";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingDeviceSetup } from "@/components/onboarding/OnboardingDeviceSetup";
import { OnboardingPreferences } from "@/components/onboarding/OnboardingPreferences";
import { OnboardingSubscription } from "@/components/onboarding/OnboardingSubscription";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";

// Define a common UserData interface to be used across all components
export interface UserData {
  name: string;
  email: string;
  preferredDevice: string;
  genres: string[];
  subscription: any;
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    preferredDevice: "",
    genres: [],
    subscription: null,
  });

  const updateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };

  const nextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const steps = [
    <OnboardingWelcome 
      key="welcome" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
    />,
    <OnboardingDeviceSetup 
      key="device" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
      onBack={prevStep} 
    />,
    <OnboardingPreferences 
      key="preferences" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
      onBack={prevStep} 
    />,
    <OnboardingSubscription 
      key="subscription" 
      userData={userData} 
      updateUserData={updateUserData} 
      onNext={nextStep} 
      onBack={prevStep} 
    />,
    <OnboardingComplete 
      key="complete" 
      userData={userData} 
    />,
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/290f9a54-2de2-4de6-b9d3-190059bb6e9f.png" 
            alt="SteadyStream Logo" 
            className="h-16 object-contain" 
          />
        </div>
        
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div 
                    className={`rounded-full h-10 w-10 flex items-center justify-center ${
                      step === currentStep 
                        ? "bg-gold text-black" 
                        : step < currentStep 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {step < currentStep ? "✓" : step + 1}
                  </div>
                  {step < 4 && (
                    <div 
                      className={`w-12 h-1 ${
                        step < currentStep ? "bg-green-500" : "bg-gray-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {steps[currentStep]}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
