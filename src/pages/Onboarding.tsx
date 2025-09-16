
import { useEffect } from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { OnboardingSteps } from "@/components/onboarding/OnboardingSteps";

const Onboarding = () => {
  const {
    step,
    userData,
    isProcessingXtream,
    updateUserData,
    handleNext,
    handleBack,
    completeOnboarding,
    checkAuthErrors,
    setDefaultDevice
  } = useOnboarding();

  // Check if redirected from previous auth attempt
  useEffect(() => {
    checkAuthErrors();
  }, []);

  // Set default device based on device detection
  useEffect(() => {
    setDefaultDevice();
  }, []);

  return (
    <div className="min-h-screen bg-black py-20 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="flex justify-center mb-8">
          <img 
            src="/lovable-uploads/7eee6a9b-1a45-4b4f-993a-eb7c793bb511.png"
            alt="SteadyStream TV"
            className="h-16 w-auto"
          />
        </div>
        <OnboardingSteps
          step={step}
          userData={userData}
          updateUserData={updateUserData}
          handleNext={handleNext}
          handleBack={handleBack}
          completeOnboarding={completeOnboarding}
          isProcessingXtream={isProcessingXtream}
        />
      </div>
    </div>
  );
};

export default Onboarding;
