
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingDeviceSetup } from "@/components/onboarding/OnboardingDeviceSetup";
import { OnboardingPreferences } from "@/components/onboarding/OnboardingPreferences";
import { OnboardingSubscription } from "@/components/onboarding/OnboardingSubscription";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { OnboardingUserData } from "@/types/onboarding";

interface OnboardingStepsProps {
  step: number;
  userData: OnboardingUserData;
  updateUserData: (data: Partial<OnboardingUserData>) => void;
  handleNext: () => void;
  handleBack: () => void;
  completeOnboarding: () => Promise<void>;
  isProcessingXtream: boolean;
}

export const OnboardingSteps = ({
  step,
  userData,
  updateUserData,
  handleNext,
  handleBack,
  completeOnboarding,
  isProcessingXtream
}: OnboardingStepsProps) => {
  switch (step) {
    case 1:
      return (
        <OnboardingWelcome 
          userData={userData} 
          updateUserData={updateUserData} 
          onNext={handleNext} 
        />
      );
    case 2:
      return (
        <OnboardingDeviceSetup 
          userData={userData} 
          updateUserData={updateUserData} 
          onNext={handleNext} 
          onBack={handleBack} 
        />
      );
    case 3:
      return (
        <OnboardingPreferences 
          userData={userData} 
          updateUserData={updateUserData} 
          onNext={handleNext} 
          onBack={handleBack} 
        />
      );
    case 4:
      return (
        <OnboardingSubscription 
          userData={userData} 
          updateUserData={updateUserData} 
          onNext={completeOnboarding} 
          onBack={handleBack}
          isProcessing={isProcessingXtream}
        />
      );
    case 5:
      return (
        <OnboardingComplete 
          userData={userData}
        />
      );
    default:
      return null;
  }
};
