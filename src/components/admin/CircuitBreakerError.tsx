
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Zap, Home, Settings } from "lucide-react";

interface CircuitBreakerErrorProps {
  onRetry: () => void;
  onForceAccess: () => void;
  onReset: () => void;
  onShowBypass?: () => void;
}

export const CircuitBreakerError = ({ 
  onRetry, 
  onForceAccess, 
  onReset,
  onShowBypass 
}: CircuitBreakerErrorProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-dark-200 border-red-800">
        <CardHeader className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <CardTitle className="text-2xl text-white">Admin Access Blocked</CardTitle>
          <CardDescription className="text-gray-400">
            Too many failed authentication attempts. The system has temporarily blocked admin access to prevent issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-2">Circuit Breaker Activated</h3>
            <p className="text-gray-300 text-sm">
              The admin authentication system has detected repeated issues and has activated a circuit breaker to prevent further problems.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button
              onClick={onRetry}
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Authentication
            </Button>

            {onShowBypass && (
              <Button
                onClick={onShowBypass}
                variant="outline"
                className="bg-green-600 hover:bg-green-700 text-white border-green-600"
              >
                <Zap className="h-4 w-4 mr-2" />
                Use Emergency Bypass
              </Button>
            )}

            <Button
              onClick={onForceAccess}
              variant="outline"
              className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
            >
              <Settings className="h-4 w-4 mr-2" />
              Force Access (Known Admin)
            </Button>

            <Button
              onClick={onReset}
              variant="outline"
              className="bg-gray-600 hover:bg-gray-700 text-white border-gray-600"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Homepage
            </Button>
          </div>

          <div className="text-center text-sm text-gray-400 pt-4 border-t border-gray-700">
            <p>If you continue experiencing issues, please contact technical support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
