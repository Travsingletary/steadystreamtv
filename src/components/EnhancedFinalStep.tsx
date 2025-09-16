// Enhanced Final Step Component - Production Ready
// Real-time progress tracking, comprehensive error handling, and user feedback

import React, { useState, useEffect, useCallback } from 'react';
import { onboardingService } from '../services/onboardingService.js';
import { enhancedSupabase } from '../lib/enhanced-supabase-client.ts';

interface FinalStepProps {
  userData: {
    email: string;
    name: string;
    plan: string;
    deviceType: string;
  };
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

interface ProgressStep {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  message?: string;
  timestamp?: Date;
}

const EnhancedFinalStep: React.FC<FinalStepProps> = ({ userData, onComplete, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    { id: 'validation', title: 'Validating Information', status: 'pending' },
    { id: 'account', title: 'Creating Xtream Account', status: 'pending' },
    { id: 'credentials', title: 'Generating Credentials', status: 'pending' },
    { id: 'profile', title: 'Setting Up Profile', status: 'pending' },
    { id: 'finalization', title: 'Finalizing Setup', status: 'pending' }
  ]);
  
  const [result, setResult] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  // Update progress step status
  const updateStepStatus = useCallback((stepId: string, status: ProgressStep['status'], message?: string) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, message, timestamp: new Date() }
        : step
    ));
  }, []);

  // Process final onboarding step
  const processFinalStep = useCallback(async () => {
    setIsProcessing(true);
    
    try {
      console.log('🎯 Starting final onboarding process...');
      
      // Step 1: Validation
      updateStepStatus('validation', 'processing', 'Checking provided information...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      
      if (!userData.email || !userData.plan || !userData.deviceType) {
        throw new Error('Missing required user information');
      }
      
      updateStepStatus('validation', 'completed', 'Information validated successfully');
      setCurrentStep(1);

      // Step 2: Create Xtream Account
      updateStepStatus('account', 'processing', 'Creating your streaming account...');
      
      const accountResult = await onboardingService.createXtreamAccount();
      
      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create streaming account');
      }

      updateStepStatus('account', 'completed', 
        accountResult.data.fallbackMode 
          ? 'Account created (fallback mode)'
          : 'Account created successfully'
      );
      setCurrentStep(2);

      // Step 3: Generate Credentials
      updateStepStatus('credentials', 'processing', 'Generating your access credentials...');
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing
      
      if (!accountResult.data.credentials) {
        throw new Error('Failed to generate access credentials');
      }

      updateStepStatus('credentials', 'completed', 'Credentials generated successfully');
      setCurrentStep(3);

      // Step 4: Setup Profile
      updateStepStatus('profile', 'processing', 'Setting up your profile...');
      
      // Get current user and update profile
      const { user } = await enhancedSupabase.getCurrentUser();
      
      if (user) {
        await enhancedSupabase.insertData('profiles', {
          id: user.id,
          email: userData.email,
          name: userData.name,
          plan: userData.plan,
          device_type: userData.deviceType,
          xtream_username: accountResult.data.credentials.username,
          playlist_token: accountResult.data.credentials.playlist_token,
          activation_code: accountResult.data.credentials.activation_code,
          onboarding_completed: true,
          created_at: new Date().toISOString()
        });
      }

      updateStepStatus('profile', 'completed', 'Profile setup completed');
      setCurrentStep(4);

      // Step 5: Finalization
      updateStepStatus('finalization', 'processing', 'Finalizing your account...');
      
      const finalResult = await onboardingService.finalizeOnboarding();
      
      if (!finalResult.success) {
        throw new Error(finalResult.error || 'Failed to finalize onboarding');
      }

      updateStepStatus('finalization', 'completed', 'Account setup completed successfully!');
      setCurrentStep(5);

      // Set final result
      const completeResult = {
        success: true,
        userData: {
          email: userData.email,
          name: userData.name,
          plan: userData.plan,
          deviceType: userData.deviceType
        },
        credentials: accountResult.data.credentials,
        activationCode: accountResult.data.credentials.activation_code,
        playlistToken: accountResult.data.credentials.playlist_token,
        fallbackMode: accountResult.data.fallbackMode,
        completedAt: new Date().toISOString()
      };

      setResult(completeResult);
      
      // Wait a moment to show completion, then call onComplete
      setTimeout(() => {
        onComplete(completeResult);
      }, 2000);

      console.log('✅ Final onboarding step completed successfully');

    } catch (error) {
      console.error('❌ Final step processing failed:', error);
      
      // Update the current step as error
      const errorStepId = progressSteps[currentStep]?.id || 'validation';
      updateStepStatus(errorStepId, 'error', error.message);
      
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [userData, currentStep, progressSteps, updateStepStatus, onComplete, onError]);

  // Get debug information
  const getDebugInfo = useCallback(async () => {
    try {
      const onboardingStatus = onboardingService.getOnboardingStatus();
      const connectionStatus = enhancedSupabase.getConnectionStatus();
      const healthMetrics = enhancedSupabase.getHealthMetrics();
      
      setDebugInfo({
        onboarding: onboardingStatus,
        connection: connectionStatus,
        health: healthMetrics,
        timestamp: new Date().toISOString()
      });
      
      setConnectionStatus(connectionStatus);
    } catch (error) {
      console.error('Failed to get debug info:', error);
    }
  }, []);

  // Initialize component
  useEffect(() => {
    getDebugInfo();
    
    // Update debug info every 5 seconds during processing
    const interval = setInterval(() => {
      if (isProcessing) {
        getDebugInfo();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isProcessing, getDebugInfo]);

  // Auto-start processing when component mounts
  useEffect(() => {
    if (!isProcessing && !result) {
      processFinalStep();
    }
  }, [processFinalStep, isProcessing, result]);

  return (
    <div className="final-step-container">
      <div className="final-step-header">
        <h2>🎉 Setting Up Your SteadyStream Account</h2>
        <p>Please wait while we complete your account setup...</p>
      </div>

      <div className="progress-container">
        {progressSteps.map((step, index) => (
          <div 
            key={step.id} 
            className={`progress-step ${step.status} ${index === currentStep ? 'current' : ''}`}
          >
            <div className="step-indicator">
              {step.status === 'completed' && <span className="checkmark">✅</span>}
              {step.status === 'processing' && <span className="spinner">⏳</span>}
              {step.status === 'error' && <span className="error-mark">❌</span>}
              {step.status === 'pending' && <span className="pending-mark">⚪</span>}
            </div>
            
            <div className="step-content">
              <h3>{step.title}</h3>
              {step.message && <p className="step-message">{step.message}</p>}
              {step.timestamp && (
                <small className="step-timestamp">
                  {step.timestamp.toLocaleTimeString()}
                </small>
              )}
            </div>
          </div>
        ))}
      </div>

      {result && (
        <div className="completion-summary">
          <h3>🎊 Account Setup Complete!</h3>
          <div className="account-details">
            <p><strong>Plan:</strong> {result.userData.plan}</p>
            <p><strong>Device:</strong> {result.userData.deviceType}</p>
            <p><strong>Activation Code:</strong> <code>{result.activationCode}</code></p>
            {result.fallbackMode && (
              <div className="fallback-notice">
                <p>⚠️ <strong>Note:</strong> Account created in fallback mode. Full features will be available shortly.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {connectionStatus && (
        <div className="connection-status">
          <div className={`status-indicator ${connectionStatus.isConnected ? 'connected' : 'disconnected'}`}>
            {connectionStatus.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {connectionStatus.latency > 0 && (
            <small>Latency: {connectionStatus.latency}ms</small>
          )}
        </div>
      )}

      {debugInfo && process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>🐛 Debug Information</summary>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      )}

      <style>{`
        .final-step-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .final-step-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .final-step-header h2 {
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .final-step-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .progress-container {
          margin: 2rem 0;
        }

        .progress-step {
          display: flex;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .progress-step.pending {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
        }

        .progress-step.processing {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          animation: pulse 2s infinite;
        }

        .progress-step.completed {
          background: #d1edff;
          border: 1px solid #74b9ff;
        }

        .progress-step.error {
          background: #ffe6e6;
          border: 1px solid #ff7675;
        }

        .progress-step.current {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .step-indicator {
          margin-right: 1rem;
          font-size: 1.2rem;
        }

        .step-content h3 {
          margin: 0 0 0.5rem 0;
          color: #2d3436;
        }

        .step-message {
          margin: 0.25rem 0;
          color: #636e72;
          font-size: 0.9rem;
        }

        .step-timestamp {
          color: #b2bec3;
          font-size: 0.8rem;
        }

        .completion-summary {
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          padding: 1.5rem;
          margin: 2rem 0;
        }

        .completion-summary h3 {
          color: #155724;
          margin-bottom: 1rem;
        }

        .account-details p {
          margin: 0.5rem 0;
          color: #155724;
        }

        .account-details code {
          background: #f8f9fa;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
        }

        .fallback-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 4px;
          padding: 0.75rem;
          margin-top: 1rem;
        }

        .fallback-notice p {
          margin: 0;
          color: #856404;
        }

        .connection-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin: 1rem 0;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 4px;
        }

        .status-indicator.connected {
          color: #28a745;
          font-weight: bold;
        }

        .status-indicator.disconnected {
          color: #dc3545;
          font-weight: bold;
        }

        .debug-info {
          margin-top: 2rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .debug-info pre {
          margin: 0.5rem 0 0 0;
          white-space: pre-wrap;
          word-break: break-word;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .final-step-container {
            padding: 1rem;
          }
          
          .progress-step {
            padding: 0.75rem;
          }
          
          .step-content h3 {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedFinalStep;

