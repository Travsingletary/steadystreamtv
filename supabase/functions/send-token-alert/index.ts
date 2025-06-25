
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { type, alerts, inventory, message } = await req.json();

    // Get admin emails
    const { data: adminRoles } = await supabase
      .from('admin_roles')
      .select(`
        user_id,
        auth.users!inner(email)
      `);

    const adminEmails = adminRoles?.map(role => role.auth?.users?.email).filter(Boolean) || [];
    
    if (adminEmails.length === 0) {
      console.log('No admin emails found, skipping notification');
      return new Response(JSON.stringify({ success: true, message: 'No admins to notify' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailHtml = generateAlertEmail(type, alerts, inventory, message);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'SteadyStream TV <alerts@steadystreamtv.com>',
        to: adminEmails,
        subject: type === 'critical' 
          ? '🚨 CRITICAL: Token Inventory Alert - Immediate Action Required'
          : '⚠️ Token Inventory Alert - Low Stock Warning',
        html: emailHtml
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send alert: ${response.status}`);
    }

    // Log the notification
    await supabase
      .from('email_logs')
      .insert({
        email_type: 'token_alert',
        recipient: adminEmails.join(', '),
        sent_at: new Date().toISOString(),
        status: 'sent'
      });

    console.log(`✅ Token alert sent to ${adminEmails.length} admins`);

    return new Response(
      JSON.stringify({ success: true, message: 'Alert sent successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Token alert error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateAlertEmail(type, alerts, inventory, message) {
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const lowCount = alerts.filter(a => a.severity === 'low').length;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Token Inventory Alert</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${type === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .alert-item { margin: 10px 0; padding: 15px; background: white; border-left: 4px solid ${type === 'critical' ? '#dc2626' : '#f59e0b'}; }
    .inventory-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .inventory-table th, .inventory-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
    .inventory-table th { background: #f5f5f5; }
    .critical { color: #dc2626; font-weight: bold; }
    .low { color: #f59e0b; font-weight: bold; }
    .good { color: #16a34a; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${type === 'critical' ? '🚨 CRITICAL ALERT' : '⚠️ LOW STOCK WARNING'}</h1>
      <p>Token Inventory Management System</p>
    </div>
    
    <div class="content">
      <h2>Alert Summary</h2>
      <p><strong>Message:</strong> ${message}</p>
      <p><strong>Alert Time:</strong> ${new Date().toLocaleString()}</p>
      
      ${criticalCount > 0 ? `<p class="critical">🚨 ${criticalCount} package(s) critically low</p>` : ''}
      ${lowCount > 0 ? `<p class="low">⚠️ ${lowCount} package(s) running low</p>` : ''}

      <h3>Current Inventory</h3>
      <table class="inventory-table">
        <tr>
          <th>Package Type</th>
          <th>Available Tokens</th>
          <th>Status</th>
        </tr>
        ${Object.entries(inventory).map(([pkg, count]) => {
          const status = count <= 2 ? 'critical' : count <= 5 ? 'low' : 'good';
          return `
            <tr>
              <td>${pkg.charAt(0).toUpperCase() + pkg.slice(1)}</td>
              <td>${count}</td>
              <td class="${status}">${status.toUpperCase()}</td>
            </tr>
          `;
        }).join('')}
      </table>

      ${alerts.length > 0 ? `
        <h3>Detailed Alerts</h3>
        ${alerts.map(alert => `
          <div class="alert-item">
            <strong>${alert.packageType.toUpperCase()} Package</strong><br>
            Current Count: <span class="${alert.severity}">${alert.currentCount}</span><br>
            Threshold: ${alert.threshold}<br>
            Severity: <span class="${alert.severity}">${alert.severity.toUpperCase()}</span>
          </div>
        `).join('')}
      ` : ''}

      <h3>Recommended Actions</h3>
      <ul>
        ${type === 'critical' ? '<li><strong>Immediate:</strong> Purchase tokens for critical packages</li>' : ''}
        <li>Review token usage patterns</li>
        <li>Consider adjusting auto-purchase thresholds</li>
        <li>Monitor subscription growth trends</li>
      </ul>

      <p><strong>Action Required:</strong> ${type === 'critical' 
        ? 'Please purchase tokens immediately to prevent service disruption.' 
        : 'Consider purchasing tokens soon to maintain adequate inventory.'}</p>
    </div>
  </div>
</body>
</html>
  `;
}
