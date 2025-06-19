
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEdgeFunctionHealth } from "@/hooks/useEdgeFunctionHealth";
import { CheckCircle, XCircle, RefreshCw, Clock } from "lucide-react";

export const EdgeFunctionMonitor = () => {
  const { functions, isChecking, checkAllFunctions } = useEdgeFunctionHealth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      healthy: 'bg-green-500',
      error: 'bg-red-500',
      checking: 'bg-yellow-500'
    };

    return (
      <Badge className={`${colorMap[status as keyof typeof colorMap] || 'bg-gray-500'} text-white`}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="bg-dark-200 border-gray-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white">Edge Function Health</CardTitle>
            <CardDescription className="text-gray-400">
              Monitor the status of critical edge functions
            </CardDescription>
          </div>
          <Button 
            onClick={checkAllFunctions}
            disabled={isChecking}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isChecking ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {functions.map((func) => (
            <div key={func.name} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(func.status)}
                <div>
                  <p className="text-white font-medium">{func.name}</p>
                  <p className="text-gray-400 text-sm">
                    Last checked: {func.lastChecked.toLocaleTimeString()}
                  </p>
                  {func.error && (
                    <p className="text-red-400 text-sm mt-1">{func.error}</p>
                  )}
                </div>
              </div>
              {getStatusBadge(func.status)}
            </div>
          ))}
        </div>

        {functions.length === 0 && !isChecking && (
          <div className="text-center py-8 text-gray-400">
            No functions checked yet. Click refresh to start monitoring.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
