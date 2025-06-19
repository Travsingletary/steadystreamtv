
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';

interface SystemHealth {
  supabase: boolean;
  megaott: boolean;
  stripe: boolean;
}

interface SystemStatusProps {
  systemHealth: SystemHealth;
}

export const SystemStatus: React.FC<SystemStatusProps> = ({ systemHealth }) => {
  const getHealthStatus = (service: keyof SystemHealth) => {
    const isHealthy = systemHealth[service];
    return {
      color: isHealthy ? 'bg-green-500' : 'bg-red-500',
      status: isHealthy ? 'Operational' : 'Issues Detected'
    };
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5" />
          System Status
        </CardTitle>
        <CardDescription className="text-gray-400">
          Current system health and integration status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className={`w-3 h-3 rounded-full ${getHealthStatus('supabase').color}`}></div>
            <div>
              <p className="font-medium text-white">Supabase Database</p>
              <p className="text-sm text-gray-400">{getHealthStatus('supabase').status}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className={`w-3 h-3 rounded-full ${getHealthStatus('megaott').color}`}></div>
            <div>
              <p className="font-medium text-white">MegaOTT API</p>
              <p className="text-sm text-gray-400">{getHealthStatus('megaott').status}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-dark-300 rounded-lg border border-gray-700">
            <div className={`w-3 h-3 rounded-full ${getHealthStatus('stripe').color}`}></div>
            <div>
              <p className="font-medium text-white">Stripe Payments</p>
              <p className="text-sm text-gray-400">{getHealthStatus('stripe').status}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
