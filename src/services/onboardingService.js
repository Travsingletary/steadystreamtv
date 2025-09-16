// Enhanced Onboarding Service - Production Ready
// Handles complete user onboarding flow with comprehensive error handling

import { apiService } from './apiService.js';
import { supabase } from '../lib/supabase.js';

class OnboardingService {
  constructor() {
    this.currentStep = 0;
    this.maxSteps = 5;
    this.userData = {};
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    
    // Progress tracking
    this.progress = {
      registration: false,
      planSelection: false,
      deviceSelection: false,
      accountCreation: false,
      finalization: false
    };

    // Error tracking
    this.errors = [];
    this.retryAttempts = {};
  }

  // Initialize onboarding process
  async initializeOnboarding() {
    try {
      console.log('🚀 Initializing SteadyStream onboarding process...');
      
      // Reset state
      this.currentStep = 0;
      this.userData = {};
      this.errors = [];
      this.retryAttempts = {};
      
      // Check API health
      const healthCheck = await apiService.checkHealth();
      if (!healthCheck.success) {
        console.warn('⚠️ API health check failed, but continuing with fallback systems');
      }

      console.log('✅ Onboarding initialized successfully');
      return { success: true, step: this.currentStep };

    } catch (error) {
      console.error('❌ Failed to initialize onboarding:', error);
      this.logError('initialization', error);
      return { success: false, error: error.message };
    }
  }

  // Step 1: User Registration
  async registerUser(registrationData) {
    try {
      console.log('📝 Processing user registration...');
      
      const { email, password, name } = registrationData;
      
      // Validate input
      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      if (!this.validatePassword(password)) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Register with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            onboarding_step: 1,
            created_via: 'steadystream_onboarding'
          }
        }
      });

      if (error) {
        throw new Error(`Registration failed: ${error.message}`);
      }

      // Store user data
      this.userData = {
        ...this.userData,
        email,
        name,
        userId: data.user?.id,
        registrationComplete: true
      };

      this.progress.registration = true;
      this.currentStep = 1;

      console.log('✅ User registration completed');
      return { 
        success: true, 
        data: { userId: data.user?.id, email },
        nextStep: 'plan-selection'
      };

    } catch (error) {
      console.error('❌ Registration failed:', error);
      this.logError('registration', error);
      return { success: false, error: error.message };
    }
  }

  // Step 2: Plan Selection
  async selectPlan(planData) {
    try {
      console.log('📋 Processing plan selection...');
      
      const { plan, billingCycle } = planData;
      
      // Validate plan
      const validPlans = ['trial', 'basic', 'duo', 'family'];
      if (!validPlans.includes(plan)) {
        throw new Error('Invalid plan selected');
      }

      // Store plan data
      this.userData = {
        ...this.userData,
        plan,
        billingCycle: billingCycle || 'monthly',
        planSelectionComplete: true
      };

      this.progress.planSelection = true;
      this.currentStep = 2;

      console.log('✅ Plan selection completed');
      return { 
        success: true, 
        data: { plan, billingCycle },
        nextStep: 'device-selection'
      };

    } catch (error) {
      console.error('❌ Plan selection failed:', error);
      this.logError('plan-selection', error);
      return { success: false, error: error.message };
    }
  }

  // Step 3: Device Type Selection
  async selectDeviceType(deviceData) {
    try {
      console.log('📱 Processing device type selection...');
      
      const { deviceType, additionalDevices } = deviceData;
      
      // Validate device type
      const validDevices = ['web', 'firestick', 'android', 'ios', 'smart-tv', 'roku'];
      if (!validDevices.includes(deviceType)) {
        throw new Error('Invalid device type selected');
      }

      // Store device data
      this.userData = {
        ...this.userData,
        deviceType,
        additionalDevices: additionalDevices || [],
        deviceSelectionComplete: true
      };

      this.progress.deviceSelection = true;
      this.currentStep = 3;

      console.log('✅ Device selection completed');
      return { 
        success: true, 
        data: { deviceType, additionalDevices },
        nextStep: 'account-creation'
      };

    } catch (error) {
      console.error('❌ Device selection failed:', error);
      this.logError('device-selection', error);
      return { success: false, error: error.message };
    }
  }

  // Step 4: Create Xtream Account
  async createXtreamAccount() {
    try {
      console.log('🔐 Creating Xtream account...');
      
      // Validate we have all required data
      if (!this.userData.email || !this.userData.plan || !this.userData.deviceType) {
        throw new Error('Missing required user data for account creation');
      }

      // Create account via API service
      const accountResult = await apiService.createXtreamAccount({
        email: this.userData.email,
        name: this.userData.name,
        plan: this.userData.plan,
        deviceType: this.userData.deviceType
      });

      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create Xtream account');
      }

      // Store account credentials
      this.userData = {
        ...this.userData,
        xtreamCredentials: accountResult.data,
        playlistToken: accountResult.data.playlist_token,
        activationCode: accountResult.data.activation_code,
        accountCreationComplete: true,
        fallbackMode: accountResult.source === 'local_fallback'
      };

      this.progress.accountCreation = true;
      this.currentStep = 4;

      // Update user profile in Supabase
      if (this.userData.userId) {
        await this.updateUserProfile({
          onboarding_step: 4,
          plan: this.userData.plan,
          device_type: this.userData.deviceType,
          xtream_username: accountResult.data.username,
          playlist_token: accountResult.data.playlist_token,
          activation_code: accountResult.data.activation_code,
          account_created_at: new Date().toISOString()
        });
      }

      console.log('✅ Xtream account created successfully');
      return { 
        success: true, 
        data: {
          credentials: accountResult.data,
          fallbackMode: accountResult.source === 'local_fallback'
        },
        nextStep: 'finalization'
      };

    } catch (error) {
      console.error('❌ Account creation failed:', error);
      this.logError('account-creation', error);
      
      // Try fallback if main creation failed
      if (!this.retryAttempts['account-creation']) {
        this.retryAttempts['account-creation'] = 1;
        console.log('🔄 Attempting fallback account creation...');
        return this.createXtreamAccount();
      }
      
      return { success: false, error: error.message };
    }
  }

  // Step 5: Finalize Onboarding
  async finalizeOnboarding() {
    try {
      console.log('🎉 Finalizing onboarding process...');
      
      // Validate all steps completed
      const requiredSteps = ['registration', 'planSelection', 'deviceSelection', 'accountCreation'];
      const missingSteps = requiredSteps.filter(step => !this.progress[step]);
      
      if (missingSteps.length > 0) {
        throw new Error(`Missing required steps: ${missingSteps.join(', ')}`);
      }

      // Send welcome email (non-blocking)
      apiService.sendWelcomeEmail(this.userData).catch(error => {
        console.warn('⚠️ Welcome email failed:', error.message);
      });

      // Update final user profile
      if (this.userData.userId) {
        await this.updateUserProfile({
          onboarding_step: 5,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          is_active: true
        });
      }

      this.progress.finalization = true;
      this.currentStep = 5;

      console.log('✅ Onboarding completed successfully');
      
      return { 
        success: true, 
        data: {
          userId: this.userData.userId,
          credentials: this.userData.xtreamCredentials,
          plan: this.userData.plan,
          deviceType: this.userData.deviceType,
          activationCode: this.userData.activationCode,
          completedAt: new Date().toISOString()
        },
        message: 'Welcome to SteadyStream! Your account is ready to use.'
      };

    } catch (error) {
      console.error('❌ Onboarding finalization failed:', error);
      this.logError('finalization', error);
      return { success: false, error: error.message };
    }
  }

  // Update user profile in Supabase
  async updateUserProfile(updates) {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: this.userData.userId,
          ...updates,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      console.log('✅ User profile updated');
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      // Don't throw - this is not critical for onboarding flow
    }
  }

  // Get current onboarding status
  getOnboardingStatus() {
    return {
      currentStep: this.currentStep,
      maxSteps: this.maxSteps,
      progress: this.progress,
      userData: {
        email: this.userData.email,
        name: this.userData.name,
        plan: this.userData.plan,
        deviceType: this.userData.deviceType,
        hasCredentials: !!this.userData.xtreamCredentials
      },
      errors: this.errors,
      completionPercentage: Math.round((this.currentStep / this.maxSteps) * 100)
    };
  }

  // Validation helpers
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    return password && password.length >= 8;
  }

  // Error logging
  logError(step, error) {
    const errorLog = {
      step,
      error: error.message,
      timestamp: new Date().toISOString(),
      userData: {
        email: this.userData.email,
        currentStep: this.currentStep
      }
    };
    
    this.errors.push(errorLog);
    
    if (this.debugMode) {
      console.error('🐛 Debug Error Log:', errorLog);
    }
  }

  // Reset onboarding (for testing/retry)
  reset() {
    this.currentStep = 0;
    this.userData = {};
    this.progress = {
      registration: false,
      planSelection: false,
      deviceSelection: false,
      accountCreation: false,
      finalization: false
    };
    this.errors = [];
    this.retryAttempts = {};
    
    console.log('🔄 Onboarding service reset');
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();

// Export class for testing
export { OnboardingService };

