
import { supabase } from '@/integrations/supabase/client';
import { MegaOTTIntegrationService } from './megaOTTIntegrationService';

interface TokenInventoryAlert {
  packageType: 'basic' | 'premium' | 'vip';
  currentCount: number;
  threshold: number;
  severity: 'low' | 'critical';
}

interface MonitoringConfig {
  thresholds: {
    basic: { low: 10, critical: 5 };
    premium: { low: 8, critical: 3 };
    vip: { low: 5, critical: 2 };
  };
  autoPurchase: {
    enabled: boolean;
    quantities: {
      basic: number;
      premium: number;
      vip: number;
    };
  };
}

export class TokenMonitoringService {
  private integrationService: MegaOTTIntegrationService;
  private config: MonitoringConfig;

  constructor() {
    this.integrationService = new MegaOTTIntegrationService();
    this.config = {
      thresholds: {
        basic: { low: 10, critical: 5 },
        premium: { low: 8, critical: 3 },
        vip: { low: 5, critical: 2 }
      },
      autoPurchase: {
        enabled: true,
        quantities: {
          basic: 25,
          premium: 15,
          vip: 10
        }
      }
    };
  }

  async monitorAndAlert(): Promise<{
    alerts: TokenInventoryAlert[];
    actions: string[];
    inventory: Record<string, number>;
  }> {
    try {
      console.log('🔍 Starting token inventory monitoring...');

      // Get current inventory
      const inventory = await this.integrationService.monitorTokenInventory();
      const alerts: TokenInventoryAlert[] = [];
      const actions: string[] = [];

      // Check each package type
      for (const [packageType, count] of Object.entries(inventory)) {
        const pkg = packageType as 'basic' | 'premium' | 'vip';
        const thresholds = this.config.thresholds[pkg];

        if (count <= thresholds.critical) {
          alerts.push({
            packageType: pkg,
            currentCount: count,
            threshold: thresholds.critical,
            severity: 'critical'
          });

          // Auto-purchase if enabled
          if (this.config.autoPurchase.enabled) {
            const purchaseResult = await this.autoPurchaseTokens(pkg);
            actions.push(purchaseResult.message);
          }
        } else if (count <= thresholds.low) {
          alerts.push({
            packageType: pkg,
            currentCount: count,
            threshold: thresholds.low,
            severity: 'low'
          });
        }
      }

      // Log monitoring results
      await this.logMonitoringResults({
        inventory,
        alerts,
        actions,
        timestamp: new Date().toISOString()
      });

      // Send notifications if needed
      if (alerts.length > 0) {
        await this.sendAlertNotifications(alerts);
      }

      console.log(`✅ Monitoring complete: ${alerts.length} alerts, ${actions.length} actions taken`);

      return { alerts, actions, inventory };

    } catch (error) {
      console.error('❌ Token monitoring failed:', error);
      await this.logError(error);
      throw error;
    }
  }

  private async autoPurchaseTokens(packageType: 'basic' | 'premium' | 'vip'): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const quantity = this.config.autoPurchase.quantities[packageType];
      
      console.log(`🛒 Auto-purchasing ${quantity} ${packageType} tokens...`);

      const result = await this.integrationService.purchaseTokensBulk({
        quantity,
        duration: 30,
        packageType
      });

      const message = `Auto-purchased ${quantity} ${packageType} tokens successfully`;
      console.log(`✅ ${message}`);

      return {
        success: true,
        message
      };

    } catch (error: any) {
      const message = `Failed to auto-purchase ${packageType} tokens: ${error.message}`;
      console.error(`❌ ${message}`);

      return {
        success: false,
        message
      };
    }
  }

  private async logMonitoringResults(data: any) {
    try {
      // Use type assertion to work around missing types
      await (supabase as any)
        .from('token_monitoring_logs')
        .insert({
          inventory_snapshot: data.inventory,
          alerts_generated: data.alerts,
          actions_taken: data.actions,
          monitored_at: data.timestamp
        });
    } catch (error) {
      console.error('Failed to log monitoring results:', error);
    }
  }

  private async sendAlertNotifications(alerts: TokenInventoryAlert[]) {
    try {
      const criticalAlerts = alerts.filter(a => a.severity === 'critical');
      
      if (criticalAlerts.length > 0) {
        // Send immediate notifications for critical alerts
        await this.sendCriticalAlert(criticalAlerts);
      }

      // Send summary for all alerts
      await this.sendAlertSummary(alerts);

    } catch (error) {
      console.error('Failed to send alert notifications:', error);
    }
  }

  private async sendCriticalAlert(alerts: TokenInventoryAlert[]) {
    try {
      await supabase.functions.invoke('send-token-alert', {
        body: {
          type: 'critical',
          alerts,
          message: 'CRITICAL: Token inventory is critically low. Immediate action required.'
        }
      });
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  private async sendAlertSummary(alerts: TokenInventoryAlert[]) {
    try {
      await supabase.functions.invoke('send-token-alert', {
        body: {
          type: 'summary',
          alerts,
          message: `Token inventory report: ${alerts.length} packages need attention`
        }
      });
    } catch (error) {
      console.error('Failed to send alert summary:', error);
    }
  }

  private async logError(error: any) {
    try {
      // Use type assertion to work around missing types
      await (supabase as any)
        .from('system_errors')
        .insert({
          error_type: 'token_monitoring',
          error_message: error.message,
          error_stack: error.stack,
          occurred_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Get monitoring statistics
  async getMonitoringStats(days: number = 7) {
    try {
      // Use type assertion to work around missing types
      const { data, error } = await (supabase as any)
        .from('token_monitoring_logs')
        .select('*')
        .gte('monitored_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('monitored_at', { ascending: false });

      if (error) throw error;

      return {
        totalChecks: data?.length || 0,
        totalAlerts: data?.reduce((sum: number, log: any) => sum + (log.alerts_generated?.length || 0), 0) || 0,
        totalActions: data?.reduce((sum: number, log: any) => sum + (log.actions_taken?.length || 0), 0) || 0,
        recentInventory: data?.[0]?.inventory_snapshot || {},
        logs: data || []
      };

    } catch (error) {
      console.error('Failed to get monitoring stats:', error);
      return {
        totalChecks: 0,
        totalAlerts: 0,
        totalActions: 0,
        recentInventory: {},
        logs: []
      };
    }
  }

  // Update monitoring configuration
  async updateConfig(newConfig: Partial<MonitoringConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('📝 Token monitoring configuration updated');
  }
}
