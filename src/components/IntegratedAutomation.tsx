
import React, { useState } from 'react';
import { AutomationModal } from './AutomationModal';
import { SuccessModal } from './SuccessModal';

interface IntegratedAutomationProps {
  children?: React.ReactNode;
  className?: string;
}

export const IntegratedAutomation: React.FC<IntegratedAutomationProps> = ({ children, className = '' }) => {
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  const handleSignupSuccess = (data: any) => {
    console.log('🎉 Signup success:', data);
    setSuccessData(data);
    setShowSignupModal(false);
    setShowSuccessModal(true);
  };

  return (
    <>
      {children || (
        <button 
          onClick={() => setShowSignupModal(true)}
          className={`bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 px-8 rounded-lg transition-all duration-200 ${className}`}
        >
          🚀 Start Free Trial
        </button>
      )}

      <AutomationModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSuccess={handleSignupSuccess}
      />

      {successData && (
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          userData={successData.userData}
          activationCode={successData.activationCode}
          playlistUrl={successData.playlistUrl}
        />
      )}
    </>
  );
};
