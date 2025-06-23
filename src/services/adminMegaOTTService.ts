
// 📊 ADMIN MEGAOTT SERVICE
// Uses username/password authentication instead of tokens

import { MegaOTTService } from './megaOTTService';

export class AdminMegaOTTService {
  
  static async fetchAdminDashboardData() {
    try {
      console.log('📊 Fetching admin dashboard data...');
      
      // Use the corrected MegaOTT service with username/password auth
      const userInfo = await MegaOTTService.checkCredits();
      const subscriptions = await this.getSubscriptionsList();

      if (!userInfo) {
        return {
          success: false,
          error: 'Failed to get MegaOTT user info',
          fallbackMode: true
        };
      }

      // Analyze the data
      const analysis = this.analyzeSubscriptionData(subscriptions || []);
      const creditsAnalysis = this.analyzeCreditsUsage(subscriptions || [], userInfo.available || 0);

      return {
        success: true,
        userInfo: {
          credit: userInfo.available,
          used_credits: userInfo.used || 0
        },
        subscriptions: subscriptions,
        analytics: {
          ...analysis,
          creditsAnalysis
        },
        apiUsed: 'production',
        apiName: 'MegaOTT Reseller API'
      };

    } catch (error: any) {
      console.error('❌ Admin dashboard data fetch failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackMode: true
      };
    }
  }

  static async checkAPIHealth() {
    console.log('🔍 Running comprehensive API health check...');
    
    try {
      // Test the main MegaOTT service
      const testResult = await MegaOTTService.testConnection();
      
      const apiStatuses = [{
        id: 'production',
        name: 'Production MegaOTT API',
        status: testResult.success ? 'online' : 'offline',
        responseTime: 'Unknown',
        lastCheck: new Date().toISOString(),
        error: testResult.success ? null : testResult.error
      }];
      
      return {
        success: true,
        apiStatuses,
        summary: {
          total: 1,
          online: testResult.success ? 1 : 0,
          offline: testResult.success ? 0 : 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        apiStatuses: [{
          id: 'production',
          name: 'Production MegaOTT API',
          status: 'offline',
          responseTime: 'Unknown',
          lastCheck: new Date().toISOString(),
          error: error.message
        }],
        summary: {
          total: 1,
          online: 0,
          offline: 1
        }
      };
    }
  }

  private static async getSubscriptionsList() {
    try {
      // This would need to be implemented in MegaOTTService
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return [];
    }
  }

  private static analyzeSubscriptionData(subscriptions: any[]) {
    const now = new Date();
    
    const activeSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at || sub.expires_at) > now
    );
    
    const expiredSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at || sub.expires_at) <= now
    );

    const paidSubscriptions = subscriptions.filter(sub => sub.paid);
    const trialSubscriptions = subscriptions.filter(sub => !sub.paid);

    const planBreakdown = subscriptions.reduce((acc, sub) => {
      const planName = sub.package?.name || sub.plan || 'Unknown';
      acc[planName] = (acc[planName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const monthlyRevenue = paidSubscriptions.length * 25; // Estimated

    return {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      expiredSubscriptions: expiredSubscriptions.length,
      paidSubscriptions: paidSubscriptions.length,
      trialSubscriptions: trialSubscriptions.length,
      planBreakdown,
      monthlyRevenue,
      conversionRate: subscriptions.length ? (paidSubscriptions.length / subscriptions.length * 100) : 0
    };
  }

  private static analyzeCreditsUsage(subscriptions: any[], userCredit: number) {
    const activeSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at || sub.expires_at) > new Date()
    );
    
    const estimatedMonthlyCost = activeSubscriptions.length * 0.5; // $0.50 per subscription
    const daysRemaining = estimatedMonthlyCost > 0 ? Math.floor(userCredit / (estimatedMonthlyCost / 30)) : Infinity;
    
    return {
      currentCredit: userCredit,
      activeCosts: estimatedMonthlyCost,
      daysRemaining: daysRemaining === Infinity ? 'Unlimited' : daysRemaining,
      efficiency: subscriptions.length > 0 ? (userCredit / (subscriptions.length * 0.5) * 100) : 100,
      recommendations: this.generateCreditRecommendations(userCredit, estimatedMonthlyCost, subscriptions.length)
    };
  }

  private static generateCreditRecommendations(credit: number, monthlyCost: number, totalSubs: number) {
    const recommendations = [];
    
    if (credit < 10) {
      recommendations.push({
        type: 'warning',
        message: 'Low credit balance - consider topping up',
        action: 'Add Credits'
      });
    }
    
    if (monthlyCost > credit) {
      recommendations.push({
        type: 'critical',
        message: 'Monthly costs exceed current credit',
        action: 'Urgent: Add Credits'
      });
    }
    
    if (totalSubs > 100 && credit > 50) {
      recommendations.push({
        type: 'success',
        message: 'High volume operation with good credit buffer',
        action: 'Monitor Usage'
      });
    }
    
    return recommendations;
  }
}
