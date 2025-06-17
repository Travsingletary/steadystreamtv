
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Shield, Home } from "lucide-react";

interface CircuitBreakerErrorProps {
  onRetry: () => void;
  onForceAccess: () => void;
  onReset: () => void;
}

export const CircuitBreakerError = ({ onRetry, onForceAccess, onReset }: CircuitBreakerErrorProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-red-500">
        <CardHeader className="text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <CardTitle className="text-xl text-red-500">Admin Access Circuit Breaker</CardTitle>
          <CardDescription className="text-gray-300">
            Too many failed admin verification attempts detected. The system has temporarily disabled admin checks to prevent loops.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-500 rounded p-3 text-sm">
            <p className="text-yellow-300">
              <strong>What happened?</strong><br />
              The admin authentication system detected multiple failed attempts and activated circuit breaker protection.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button 
              onClick={onRetry} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Admin Check
            </Button>
            
            <Button 
              onClick={onForceAccess} 
              variant="outline" 
              className="w-full border-green-500 text-green-400 hover:bg-green-500 hover:text-black"
            >
              <Shield className="h-4 w-4 mr-2" />
              Force Admin Access (Emergency)
            </Button>
            
            <Button 
              onClick={onReset} 
              variant="outline" 
              className="w-full border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-black"
            >
              <Home className="h-4 w-4 mr-2" />
              Return to Homepage
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 text-center mt-4">
            Circuit breaker will automatically reset after 30 seconds of inactivity
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
