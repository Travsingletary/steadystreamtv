
import React, { useState } from 'react';
import { AutomationModal } from './AutomationComponents';

interface AutomationButtonProps {
  children?: React.ReactNode;
  onSuccess?: (result: any) => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const AutomationButton: React.FC<AutomationButtonProps> = ({ 
  children = '🚀 Start Free Trial',
  onSuccess,
  className = '',
  variant = 'primary'
}) => {
  const [showModal, setShowModal] = useState(false);

  const handleSuccess = (result: any) => {
    console.log('✅ Automation success:', result);
    setShowModal(false);
    if (onSuccess) {
      onSuccess(result);
    }
  };

  const baseStyles = variant === 'primary' 
    ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold'
    : 'bg-gray-700 hover:bg-gray-600 text-white font-medium';

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`py-3 px-8 rounded-lg transition-all duration-200 ${baseStyles} ${className}`}
      >
        {children}
      </button>

      <AutomationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
};
