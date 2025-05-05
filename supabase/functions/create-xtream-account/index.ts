import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Constants
const SUPABASE_URL = "https://ojueihcytxwcioqtvwez.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const XTREAM_API_URL = Deno.env.get("XTREAM_API_URL") || "";
const XTREAM_ADMIN_USERNAME = Deno.env.get("XTREAM_ADMIN_USERNAME") || "";
const XTREAM_ADMIN_PASSWORD = Deno.env.get("XTREAM_ADMIN_PASSWORD") || "";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateXtreamAccountRequest {
  userId: string;
  plan: string;
}

// Map subscription tiers to Xtream connection limits
const planToConnections = {
  "standard": 2,
  "premium": 4,
  "ultimate": 6,
  "free-trial": 2 // Free trial gets standard connections
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, plan }: CreateXtreamAccountRequest = await req.json();

    // Validate request
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already has Xtream credentials
    if (profile.xtream_username && profile.xtream_password) {
      console.log("User already has Xtream credentials");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already has Xtream account", 
          username: profile.xtream_username,
          password: profile.xtream_password
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate credentials
    const xtreamUsername = `steadystream_${userId.substring(0, 8)}`;
    const xtreamPassword = generateRandomPassword(12);
    const maxConnections = planToConnections[plan as keyof typeof planToConnections] || 2;
    
    // For demonstration purposes - in production, you would call your Xtream API
    // to create the actual account using XTREAM_API_URL, XTREAM_ADMIN_USERNAME, XTREAM_ADMIN_PASSWORD
    console.log(`Creating Xtream account for user ${userId} with plan ${plan}`);
    console.log(`Would call ${XTREAM_API_URL} with admin credentials to create account`);
    
    // Simulate API call success
    const xtreamResponse = {
      success: true,
      username: xtreamUsername,
      password: xtreamPassword,
      message: "Account created successfully",
      max_connections: maxConnections
    };

    // If we had a real API, we would do something like this:
    /*
    const xtreamResponse = await fetch(`${XTREAM_API_URL}/create_user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: XTREAM_ADMIN_USERNAME,
        password: XTREAM_ADMIN_PASSWORD,
        new_username: xtreamUsername,
        new_password: xtreamPassword,
        max_connections: maxConnections,
        // other required parameters for your specific Xtream API
      }),
    }).then(res => res.json());
    */
    
    // Store credentials in user profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        xtream_username: xtreamUsername,
        xtream_password: xtreamPassword
      })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error updating user profile with Xtream credentials:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to store credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Xtream account created successfully",
        username: xtreamUsername,
        password: xtreamPassword
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
    
  } catch (error) {
    console.error("Error in create-xtream-account function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Helper function to generate random password
function generateRandomPassword(length: number): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}
