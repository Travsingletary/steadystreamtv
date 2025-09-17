
import { supabase } from "@/integrations/supabase/client";
import { generateSecurePassword } from "@/utils/passwordUtils";
import { OnboardingUserData } from "@/types/onboarding";

export const createUserAccount = async (userData: OnboardingUserData) => {
  console.log("Starting user account creation process...");
  console.log("User data:", userData);
  
  // Generate a secure random password that meets Supabase requirements
  const password = generateSecurePassword();
  console.log("Generated secure password for user");
  
  // Sign up user with Supabase
  console.log("Creating Supabase user...");
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: password,
    options: {
      data: {
        name: userData.name,
        preferred_device: userData.preferredDevice
      }
    }
  });

  if (authError) {
    console.error("Supabase auth error:", authError);
    throw new Error(`Authentication failed: ${authError.message}`);
  }
  
  console.log("Supabase user created successfully:", authData?.user?.id);
  
  return authData;
};

export const createUserProfile = async (userId: string, userData: OnboardingUserData) => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + (userData.subscription?.trialDays || 7));
  
  console.log("Creating user profile...");
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      supabase_user_id: userId,
      email: userData.email,
      full_name: userData.name,
      trial_end_date: trialEndDate.toISOString()
    });
  
  if (profileError) {
    console.error("Profile creation error:", profileError);
    throw new Error(`Profile creation failed: ${profileError.message}`);
  }
  
  console.log("User profile created successfully");
};

export const createXtreamAccount = async (userId: string, userData: OnboardingUserData) => {
  console.log("Creating IPTV account...");
  const { data: xtreamData, error: xtreamError } = await supabase.functions.invoke('create-xtream-account', {
    body: { 
      userId: userId,
      planType: (userData.subscription?.plan || 'standard').toLowerCase(), 
      email: userData.email,
      name: userData.name
    }
  });

  if (xtreamError) {
    console.error("IPTV account creation error:", xtreamError);
    throw new Error(`IPTV account creation failed: ${xtreamError.message}`);
  }
  
  console.log("IPTV account created successfully:", xtreamData);
  return xtreamData;
};
