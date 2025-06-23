
// 📊 ADMIN MEGAOTT SERVICE
// Uses dedicated admin API for monitoring and management

import { MegaOTTAPIManager } from './megaOTTAPIManager';

export class AdminMegaOTTService {
  
  static async fetchAdminDashboardData() {
    try {
      console.log('📊 Fetching admin dashboard data...');
      
      const result = await MegaOTTAPIManager.getAdminData();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          fallbackMode: true
        };
      }

      // Analyze the data
      const analysis = this.analyzeSubscriptionData(result.subscriptions || []);
      const creditsAnalysis = this.analyzeCreditsUsage(result.subscriptions || [], result.userInfo?.credit || 0);

      return {
        success: true,
        userInfo: result.userInfo,
        subscriptions: result.subscriptions,
        analytics: {
          ...analysis,
          creditsAnalysis
        },
        apiUsed: result.apiUsed,
        apiName: result.apiName
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
    
    const apiStatuses = await MegaOTTAPIManager.checkAllAPIs();
    
    return {
      success: true,
      apiStatuses,
      summary: {
        total: apiStatuses.length,
        online: apiStatuses.filter(api => api.status === 'online').length,
        offline: apiStatuses.filter(api => api.status === 'offline').length
      }
    };
  }

  private static analyzeSubscriptionData(subscriptions: any[]) {
    const now = new Date();
    
    const activeSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at) > now
    );
    
    const expiredSubscriptions = subscriptions.filter(sub => 
      new Date(sub.expiring_at) <= now
    );

    const paidSubscriptions = subscriptions.filter(sub => sub.paid);
    const trialSubscriptions = subscriptions.filter(sub => !sub.paid);

    const planBreakdown = subscriptions.reduce((acc, sub) => {
      const planName = sub.package?.name || 'Unknown';
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
      new Date(sub.expiring_at) > new Date()
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
