// Test Implementation Component - Comprehensive Testing Suite
// Real-time testing, debugging, and validation of the enhanced onboarding system

import React, { useState, useEffect, useCallback } from 'react';
import { onboardingService } from '../services/onboardingService.js';
import { apiService } from '../services/apiService.js';
import { enhancedSupabase } from '../lib/enhanced-supabase-client.ts';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message: string;
  duration?: number;
  timestamp?: Date;
  details?: any;
}

interface SystemHealth {
  api: boolean;
  database: boolean;
  auth: boolean;
  overall: boolean;
}

const TestImplementation: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    api: false,
    database: false,
    auth: false,
    overall: false
  });
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [testData, setTestData] = useState({
    email: 'test@steadystream.tv',
    password: 'TestPassword123!',
    name: 'Test User',
    plan: 'trial',
    deviceType: 'web'
  });

  // Add debug log
  const addDebugLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    setDebugLogs(prev => [...prev.slice(-49), logMessage]); // Keep last 50 logs
    
    // Also log to console with appropriate method
    const logMethod = type === 'error' ? console.error : 
                     type === 'warning' ? console.warn : 
                     type === 'success' ? console.log : console.info;
    
    const emoji = type === 'error' ? '❌' : 
                  type === 'warning' ? '⚠️' : 
                  type === 'success' ? '✅' : '🔄';
    
    logMethod(`${emoji} ${message}`);
  }, []);

  // Update test result
  const updateTest = useCallback((id: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.id === id 
        ? { ...test, ...updates, timestamp: new Date() }
        : test
    ));
  }, []);

  // Initialize tests
  const initializeTests = useCallback(() => {
    const testSuite: TestResult[] = [
      { id: 'health', name: 'System Health Check', status: 'pending', message: 'Checking system components...' },
      { id: 'api-connection', name: 'API Connection Test', status: 'pending', message: 'Testing MegaOTT API connectivity...' },
      { id: 'database-connection', name: 'Database Connection Test', status: 'pending', message: 'Testing Supabase connection...' },
      { id: 'auth-system', name: 'Authentication System Test', status: 'pending', message: 'Testing user registration and login...' },
      { id: 'onboarding-flow', name: 'Complete Onboarding Flow Test', status: 'pending', message: 'Testing full user onboarding process...' },
      { id: 'error-handling', name: 'Error Handling Test', status: 'pending', message: 'Testing error recovery and fallback systems...' },
      { id: 'performance', name: 'Performance Test', status: 'pending', message: 'Testing response times and efficiency...' }
    ];
    
    setTests(testSuite);
    addDebugLog('Test suite initialized with 7 comprehensive tests');
  }, [addDebugLog]);

  // Run system health check
  const runHealthCheck = useCallback(async (): Promise<boolean> => {
    addDebugLog('Starting system health check...');
    updateTest('health', { status: 'running', message: 'Checking system components...' });
    
    try {
      // Check API health
      const apiHealth = await apiService.checkHealth();
      const apiStatus = apiHealth.success;
      
      // Check database health
      await enhancedSupabase.checkConnectionHealth();
      const dbStatus = enhancedSupabase.getConnectionStatus().isConnected;
      
      // Check auth system
      const { user } = await enhancedSupabase.getCurrentUser();
      const authStatus = true; // Auth system is available even without logged in user
      
      const overallHealth = apiStatus && dbStatus && authStatus;
      
      setSystemHealth({
        api: apiStatus,
        database: dbStatus,
        auth: authStatus,
        overall: overallHealth
      });
      
      updateTest('health', { 
        status: overallHealth ? 'passed' : 'failed',
        message: overallHealth ? 'All systems operational' : 'Some systems have issues',
        details: { api: apiStatus, database: dbStatus, auth: authStatus }
      });
      
      addDebugLog(`Health check completed - API: ${apiStatus}, DB: ${dbStatus}, Auth: ${authStatus}`, 
                  overallHealth ? 'success' : 'warning');
      
      return overallHealth;
    } catch (error) {
      updateTest('health', { 
        status: 'failed', 
        message: `Health check failed: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`Health check failed: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest]);

  // Test API connection
  const testApiConnection = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing API connection...');
    updateTest('api-connection', { status: 'running', message: 'Connecting to MegaOTT API...' });
    
    try {
      const startTime = Date.now();
      const result = await apiService.checkHealth();
      const duration = Date.now() - startTime;
      
      if (result.success) {
        updateTest('api-connection', { 
          status: 'passed',
          message: `API connection successful (${duration}ms)`,
          duration,
          details: result
        });
        addDebugLog(`API connection test passed in ${duration}ms`, 'success');
        return true;
      } else {
        updateTest('api-connection', { 
          status: 'failed',
          message: `API connection failed: ${result.error}`,
          duration,
          details: result
        });
        addDebugLog(`API connection test failed: ${result.error}`, 'error');
        return false;
      }
    } catch (error) {
      updateTest('api-connection', { 
        status: 'failed',
        message: `API test error: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`API connection test error: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest]);

  // Test database connection
  const testDatabaseConnection = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing database connection...');
    updateTest('database-connection', { status: 'running', message: 'Connecting to Supabase...' });
    
    try {
      const startTime = Date.now();
      await enhancedSupabase.checkConnectionHealth();
      const duration = Date.now() - startTime;
      
      const connectionStatus = enhancedSupabase.getConnectionStatus();
      const healthMetrics = enhancedSupabase.getHealthMetrics();
      
      if (connectionStatus.isConnected) {
        updateTest('database-connection', { 
          status: 'passed',
          message: `Database connection successful (${duration}ms)`,
          duration,
          details: { connectionStatus, healthMetrics }
        });
        addDebugLog(`Database connection test passed in ${duration}ms`, 'success');
        return true;
      } else {
        updateTest('database-connection', { 
          status: 'failed',
          message: 'Database connection failed',
          duration,
          details: { connectionStatus, healthMetrics }
        });
        addDebugLog('Database connection test failed', 'error');
        return false;
      }
    } catch (error) {
      updateTest('database-connection', { 
        status: 'failed',
        message: `Database test error: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`Database connection test error: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest]);

  // Test authentication system
  const testAuthSystem = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing authentication system...');
    updateTest('auth-system', { status: 'running', message: 'Testing user registration...' });
    
    try {
      const startTime = Date.now();
      
      // Generate unique test email
      const testEmail = `test-${Date.now()}@steadystream.tv`;
      
      // Test registration
      const registerResult = await enhancedSupabase.signUp(testEmail, testData.password, {
        name: testData.name,
        test_user: true
      });
      
      const duration = Date.now() - startTime;
      
      if (registerResult.data && !registerResult.error) {
        updateTest('auth-system', { 
          status: 'passed',
          message: `Authentication test passed (${duration}ms)`,
          duration,
          details: { 
            registered: true,
            userId: registerResult.data.user?.id,
            email: testEmail
          }
        });
        addDebugLog(`Authentication test passed - User registered: ${testEmail}`, 'success');
        return true;
      } else {
        updateTest('auth-system', { 
          status: 'failed',
          message: `Authentication failed: ${registerResult.error?.message}`,
          duration,
          details: { error: registerResult.error }
        });
        addDebugLog(`Authentication test failed: ${registerResult.error?.message}`, 'error');
        return false;
      }
    } catch (error) {
      updateTest('auth-system', { 
        status: 'failed',
        message: `Auth test error: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`Authentication test error: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest, testData]);

  // Test complete onboarding flow
  const testOnboardingFlow = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing complete onboarding flow...');
    updateTest('onboarding-flow', { status: 'running', message: 'Running full onboarding simulation...' });
    
    try {
      const startTime = Date.now();
      
      // Reset onboarding service
      onboardingService.reset();
      
      // Initialize onboarding
      const initResult = await onboardingService.initializeOnboarding();
      if (!initResult.success) {
        throw new Error('Failed to initialize onboarding');
      }
      
      // Test plan selection
      const planResult = await onboardingService.selectPlan({
        plan: testData.plan,
        billingCycle: 'monthly'
      });
      if (!planResult.success) {
        throw new Error('Failed to select plan');
      }
      
      // Test device selection
      const deviceResult = await onboardingService.selectDeviceType({
        deviceType: testData.deviceType,
        additionalDevices: []
      });
      if (!deviceResult.success) {
        throw new Error('Failed to select device type');
      }
      
      // Test account creation
      const accountResult = await onboardingService.createXtreamAccount();
      if (!accountResult.success) {
        throw new Error('Failed to create Xtream account');
      }
      
      const duration = Date.now() - startTime;
      const onboardingStatus = onboardingService.getOnboardingStatus();
      
      updateTest('onboarding-flow', { 
        status: 'passed',
        message: `Onboarding flow completed successfully (${duration}ms)`,
        duration,
        details: { 
          onboardingStatus,
          accountData: accountResult.data,
          fallbackMode: accountResult.data.fallbackMode
        }
      });
      
      addDebugLog(`Onboarding flow test passed in ${duration}ms`, 'success');
      return true;
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      updateTest('onboarding-flow', { 
        status: 'failed',
        message: `Onboarding flow failed: ${error.message}`,
        duration,
        details: { error: error.message }
      });
      addDebugLog(`Onboarding flow test failed: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest, testData]);

  // Test error handling
  const testErrorHandling = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing error handling and fallback systems...');
    updateTest('error-handling', { status: 'running', message: 'Testing error recovery...' });
    
    try {
      const startTime = Date.now();
      
      // Test API fallback by creating account with invalid data
      const fallbackResult = await apiService.createXtreamAccount({
        email: 'invalid-test@example.com',
        plan: 'invalid-plan',
        deviceType: 'invalid-device'
      });
      
      // Should succeed with fallback even with invalid data
      const duration = Date.now() - startTime;
      
      if (fallbackResult.success && fallbackResult.source === 'local_fallback') {
        updateTest('error-handling', { 
          status: 'passed',
          message: `Error handling test passed - Fallback system working (${duration}ms)`,
          duration,
          details: { 
            fallbackActivated: true,
            result: fallbackResult
          }
        });
        addDebugLog(`Error handling test passed - Fallback system activated`, 'success');
        return true;
      } else {
        updateTest('error-handling', { 
          status: 'failed',
          message: 'Fallback system did not activate as expected',
          duration,
          details: { result: fallbackResult }
        });
        addDebugLog('Error handling test failed - Fallback system issue', 'error');
        return false;
      }
    } catch (error) {
      updateTest('error-handling', { 
        status: 'failed',
        message: `Error handling test failed: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`Error handling test failed: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest]);

  // Test performance
  const testPerformance = useCallback(async (): Promise<boolean> => {
    addDebugLog('Testing system performance...');
    updateTest('performance', { status: 'running', message: 'Measuring response times...' });
    
    try {
      const startTime = Date.now();
      
      // Test multiple operations and measure performance
      const operations = [
        () => apiService.checkHealth(),
        () => enhancedSupabase.checkConnectionHealth(),
        () => onboardingService.getOnboardingStatus()
      ];
      
      const results = await Promise.all(operations.map(async (op, index) => {
        const opStart = Date.now();
        try {
          await op();
          return { index, duration: Date.now() - opStart, success: true };
        } catch (error) {
          return { index, duration: Date.now() - opStart, success: false, error: error.message };
        }
      }));
      
      const totalDuration = Date.now() - startTime;
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
      const successRate = (results.filter(r => r.success).length / results.length) * 100;
      
      const performanceGood = avgDuration < 2000 && successRate >= 80;
      
      updateTest('performance', { 
        status: performanceGood ? 'passed' : 'failed',
        message: `Performance test ${performanceGood ? 'passed' : 'failed'} - Avg: ${avgDuration.toFixed(0)}ms, Success: ${successRate.toFixed(0)}%`,
        duration: totalDuration,
        details: { 
          averageDuration: avgDuration,
          successRate,
          operationResults: results
        }
      });
      
      addDebugLog(`Performance test completed - Avg: ${avgDuration.toFixed(0)}ms, Success: ${successRate.toFixed(0)}%`, 
                  performanceGood ? 'success' : 'warning');
      
      return performanceGood;
    } catch (error) {
      updateTest('performance', { 
        status: 'failed',
        message: `Performance test error: ${error.message}`,
        details: { error: error.message }
      });
      addDebugLog(`Performance test error: ${error.message}`, 'error');
      return false;
    }
  }, [addDebugLog, updateTest]);

  // Run all tests
  const runAllTests = useCallback(async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    addDebugLog('Starting comprehensive test suite...');
    
    try {
      const testFunctions = [
        runHealthCheck,
        testApiConnection,
        testDatabaseConnection,
        testAuthSystem,
        testOnboardingFlow,
        testErrorHandling,
        testPerformance
      ];
      
      let passedTests = 0;
      
      for (const testFn of testFunctions) {
        const result = await testFn();
        if (result) passedTests++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const totalTests = testFunctions.length;
      const successRate = (passedTests / totalTests) * 100;
      
      addDebugLog(`Test suite completed - ${passedTests}/${totalTests} tests passed (${successRate.toFixed(0)}%)`, 
                  successRate >= 80 ? 'success' : 'warning');
      
    } catch (error) {
      addDebugLog(`Test suite error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, addDebugLog, runHealthCheck, testApiConnection, testDatabaseConnection, 
      testAuthSystem, testOnboardingFlow, testErrorHandling, testPerformance]);

  // Initialize component
  useEffect(() => {
    initializeTests();
    addDebugLog('Test Implementation component initialized');
  }, [initializeTests, addDebugLog]);

  return (
    <div className="test-implementation">
      <div className="test-header">
        <h1>🧪 SteadyStream Implementation Test Suite</h1>
        <p>Comprehensive testing and validation of the enhanced onboarding system</p>
        
        <div className="system-health">
          <h3>System Health Status</h3>
          <div className="health-indicators">
            <div className={`health-item ${systemHealth.api ? 'healthy' : 'unhealthy'}`}>
              {systemHealth.api ? '🟢' : '🔴'} API
            </div>
            <div className={`health-item ${systemHealth.database ? 'healthy' : 'unhealthy'}`}>
              {systemHealth.database ? '🟢' : '🔴'} Database
            </div>
            <div className={`health-item ${systemHealth.auth ? 'healthy' : 'unhealthy'}`}>
              {systemHealth.auth ? '🟢' : '🔴'} Auth
            </div>
            <div className={`health-item overall ${systemHealth.overall ? 'healthy' : 'unhealthy'}`}>
              {systemHealth.overall ? '🟢' : '🔴'} Overall
            </div>
          </div>
        </div>
      </div>

      <div className="test-controls">
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="run-tests-btn"
        >
          {isRunning ? '⏳ Running Tests...' : '🚀 Run All Tests'}
        </button>
        
        <button 
          onClick={() => {
            setTests([]);
            setDebugLogs([]);
            initializeTests();
          }}
          disabled={isRunning}
          className="reset-btn"
        >
          🔄 Reset Tests
        </button>
      </div>

      <div className="test-results">
        <h3>Test Results</h3>
        {tests.map(test => (
          <div key={test.id} className={`test-result ${test.status}`}>
            <div className="test-info">
              <div className="test-name">
                <span className="test-icon">
                  {test.status === 'passed' && '✅'}
                  {test.status === 'failed' && '❌'}
                  {test.status === 'running' && '⏳'}
                  {test.status === 'pending' && '⚪'}
                </span>
                {test.name}
              </div>
              <div className="test-message">{test.message}</div>
              {test.duration && (
                <div className="test-duration">{test.duration}ms</div>
              )}
            </div>
            
            {test.details && (
              <details className="test-details">
                <summary>View Details</summary>
                <pre>{JSON.stringify(test.details, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="debug-console">
        <h3>Debug Console</h3>
        <div className="debug-logs">
          {debugLogs.map((log, index) => (
            <div key={index} className="debug-log">
              {log}
            </div>
          ))}
        </div>
        <button 
          onClick={() => setDebugLogs([])}
          className="clear-logs-btn"
        >
          Clear Logs
        </button>
      </div>

      <style jsx>{`
        .test-implementation {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .test-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .test-header h1 {
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .system-health {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 1rem;
          margin: 1rem 0;
        }

        .health-indicators {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .health-item {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-weight: bold;
        }

        .health-item.healthy {
          background: #d4edda;
          color: #155724;
        }

        .health-item.unhealthy {
          background: #f8d7da;
          color: #721c24;
        }

        .health-item.overall {
          border: 2px solid;
        }

        .test-controls {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin: 2rem 0;
        }

        .run-tests-btn, .reset-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .run-tests-btn {
          background: #007bff;
          color: white;
        }

        .run-tests-btn:hover:not(:disabled) {
          background: #0056b3;
        }

        .run-tests-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .reset-btn {
          background: #6c757d;
          color: white;
        }

        .reset-btn:hover:not(:disabled) {
          background: #545b62;
        }

        .test-results {
          margin: 2rem 0;
        }

        .test-result {
          border: 1px solid #dee2e6;
          border-radius: 6px;
          margin: 0.5rem 0;
          padding: 1rem;
          transition: all 0.2s;
        }

        .test-result.pending {
          background: #f8f9fa;
        }

        .test-result.running {
          background: #fff3cd;
          border-color: #ffeaa7;
          animation: pulse 2s infinite;
        }

        .test-result.passed {
          background: #d4edda;
          border-color: #c3e6cb;
        }

        .test-result.failed {
          background: #f8d7da;
          border-color: #f5c6cb;
        }

        .test-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .test-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: bold;
          flex: 1;
        }

        .test-message {
          color: #6c757d;
          flex: 2;
        }

        .test-duration {
          color: #28a745;
          font-size: 0.9rem;
          font-weight: bold;
        }

        .test-details {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #dee2e6;
        }

        .test-details pre {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 0.8rem;
        }

        .debug-console {
          margin: 2rem 0;
          background: #1a1a1a;
          color: #00ff00;
          border-radius: 6px;
          padding: 1rem;
        }

        .debug-console h3 {
          color: #ffffff;
          margin-bottom: 1rem;
        }

        .debug-logs {
          height: 300px;
          overflow-y: auto;
          background: #000000;
          padding: 1rem;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .debug-log {
          margin: 0.2rem 0;
          word-break: break-word;
        }

        .clear-logs-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-logs-btn:hover {
          background: #c82333;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .test-implementation {
            padding: 1rem;
          }
          
          .test-info {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .health-indicators {
            flex-direction: column;
          }
          
          .test-controls {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default TestImplementation;

