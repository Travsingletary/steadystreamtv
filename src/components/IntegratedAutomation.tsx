
import React from 'react';
import { AutomatedOnboardingSystem } from './AutomatedOnboardingSystem';

interface IntegratedAutomationProps {
  children?: React.ReactNode;
  className?: string;
}

export const IntegratedAutomation: React.FC<IntegratedAutomationProps> = ({ children, className = '' }) => {
  return (
    <>
      {children || (
        <div className={className}>
          <AutomatedOnboardingSystem />
        </div>
      )}
    </>
  );
};
