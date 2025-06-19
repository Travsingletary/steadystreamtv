
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle, Rocket } from "lucide-react";
import { DEPLOYMENT_CHECKLIST, getDeploymentConfig, validateEnvironmentVariables } from "@/utils/deploymentHelper";

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const DeploymentDashboard: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runHealthChecks = async () => {
    setLoading(true);
    const checks: HealthCheck[] = [];

    // Environment check
    checks.push({
      name: 'Environment Variables',
      status: validateEnvironmentVariables() ? 'pass' : 'fail',
      message: validateEnvironmentVariables() ? 'All required variables present' : 'Missing required variables'
    });

    // Supabase connectivity
    try {
      const response = await fetch(`${getDeploymentConfig().supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || ''
        }
      });
      checks.push({
        name: 'Supabase Connection',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Connected successfully' : 'Connection failed'
      });
    } catch (error) {
      checks.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Network error'
      });
    }

    // Domain check
    const config = getDeploymentConfig();
    checks.push({
      name: 'Domain Configuration',
      status: config.environment === 'production' ? 'pass' : 'warning',
      message: `Running on ${config.domain} (${config.environment})`
    });

    setHealthChecks(checks);
    setLoading(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-500';
      case 'fail': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Rocket className="text-gold" />
            Deployment Dashboard
          </h2>
          <p className="text-gray-400">
            Monitor the health and status of your SteadyStream TV deployment
          </p>
        </div>
        <Button onClick={runHealthChecks} disabled={loading}>
          {loading ? 'Checking...' : 'Run Health Checks'}
        </Button>
      </div>

      {/* Health Checks */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Real-time status of critical components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {healthChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-dark-300 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <span className="font-medium">{check.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{check.message}</span>
                  <Badge className={`${getStatusColor(check.status)} text-white`}>
                    {check.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(DEPLOYMENT_CHECKLIST).map(([category, items]) => (
          <Card key={category} className="bg-dark-200 border-gray-800">
            <CardHeader>
              <CardTitle className="capitalize">{category} Checklist</CardTitle>
              <CardDescription>
                {items.length} items to verify
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environment Info */}
      <Card className="bg-dark-200 border-gray-800">
        <CardHeader>
          <CardTitle>Environment Information</CardTitle>
          <CardDescription>Current deployment configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400">Environment</label>
              <p className="font-medium">{getDeploymentConfig().environment}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Domain</label>
              <p className="font-medium">{getDeploymentConfig().domain}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Supabase URL</label>
              <p className="font-medium text-xs">{getDeploymentConfig().supabaseUrl}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
