
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting scheduled token monitoring...');
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check current token inventory
    const { data: tokens, error: tokensError } = await supabase
      .from('megaott_tokens')
      .select('package_type, status')
      .eq('status', 'available');

    if (tokensError) {
      throw new Error(`Failed to fetch tokens: ${tokensError.message}`);
    }

    // Calculate inventory by package type
    const inventory = {
      basic: 0,
      premium: 0,
      vip: 0
    };

    tokens?.forEach(token => {
      if (inventory.hasOwnProperty(token.package_type)) {
        inventory[token.package_type]++;
      }
    });

    console.log('📊 Current inventory:', inventory);

    // Define thresholds
    const thresholds = {
      basic: { low: 10, critical: 5 },
      premium: { low: 8, critical: 3 },
      vip: { low: 5, critical: 2 }
    };

    const alerts = [];
    const actions = [];

    // Check each package type
    for (const [packageType, count] of Object.entries(inventory)) {
      const threshold = thresholds[packageType];
      
      if (count <= threshold.critical) {
        alerts.push({
          packageType,
          currentCount: count,
          threshold: threshold.critical,
          severity: 'critical'
        });

        console.log(`🚨 CRITICAL: ${packageType} tokens critically low (${count})`);

        // Auto-purchase logic here
        try {
          const purchaseQuantity = {
            basic: 25,
            premium: 15,
            vip: 10
          }[packageType] || 10;

          // Here you would integrate with MegaOTT API to purchase tokens
          // For now, we'll log the action
          actions.push(`Would auto-purchase ${purchaseQuantity} ${packageType} tokens`);
          
        } catch (purchaseError) {
          console.error(`Failed to auto-purchase ${packageType} tokens:`, purchaseError);
        }

      } else if (count <= threshold.low) {
        alerts.push({
          packageType,
          currentCount: count,
          threshold: threshold.low,
          severity: 'low'
        });

        console.log(`⚠️ LOW: ${packageType} tokens running low (${count})`);
      }
    }

    // Log monitoring results
    const { error: logError } = await supabase
      .from('token_monitoring_logs')
      .insert({
        inventory_snapshot: inventory,
        alerts_generated: alerts,
        actions_taken: actions,
        monitored_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log monitoring results:', logError);
    }

    // Send notifications for critical alerts
    if (alerts.some(a => a.severity === 'critical')) {
      try {
        await supabase.functions.invoke('send-token-alert', {
          body: {
            type: 'critical',
            alerts: alerts.filter(a => a.severity === 'critical'),
            inventory,
            message: 'CRITICAL: Token inventory requires immediate attention'
          }
        });
      } catch (notificationError) {
        console.error('Failed to send critical alert:', notificationError);
      }
    }

    console.log(`✅ Monitoring complete: ${alerts.length} alerts, ${actions.length} actions`);

    return new Response(
      JSON.stringify({
        success: true,
        inventory,
        alerts,
        actions,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Token monitoring cron failed:', error);

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
