
// Updated to use EnhancedMegaOTTCredits instead
import React from 'react';
import { EnhancedMegaOTTCredits } from './EnhancedMegaOTTCredits';

interface MegaOTTCreditsProps {
  onStatsUpdate?: (stats: any) => void;
}

export const MegaOTTCredits: React.FC<MegaOTTCreditsProps> = ({ onStatsUpdate }) => {
  return <EnhancedMegaOTTCredits onStatsUpdate={onStatsUpdate} />;
};
