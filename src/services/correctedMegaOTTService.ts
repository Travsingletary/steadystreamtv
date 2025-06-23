
// 🚀 CORRECTED MEGAOTT SERVICE - Now uses proper reseller API
import { ProductionSteadyStreamAutomation } from './productionSteadyStreamAutomation';

interface UserData {
  name: string;
  email: string;
  password: string;
  plan: string;
  allowAdult?: boolean;
}

export const CorrectedSteadyStreamAutomation = {
  async processCompleteSignup(userData: UserData) {
    console.log('🔄 Using corrected MegaOTT service with reseller API...');
    return await ProductionSteadyStreamAutomation.processCompleteSignup(userData);
  }
};
