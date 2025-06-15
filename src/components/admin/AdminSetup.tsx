
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, CheckCircle } from "lucide-react";

export const AdminSetup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, ensureAdminRole, checkAdminAccess, isAdmin } = useAuth();

  const handleSetupAdmin = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to set up admin role",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await ensureAdminRole();
      if (success) {
        toast({
          title: "Success",
          description: "Admin role has been set successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to set admin role",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to set admin role",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAdmin = async () => {
    setIsLoading(true);
    try {
      const adminStatus = await checkAdminAccess();
      toast({
        title: "Admin Status",
        description: adminStatus ? "You have admin privileges" : "You don't have admin privileges",
        variant: adminStatus ? "default" : "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check admin status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="w-full max-w-md bg-dark-200 border-gray-800">
      <CardHeader className="text-center">
        <Shield className="h-16 w-16 mx-auto text-gold" />
        <CardTitle className="text-2xl mt-4 text-white">Admin Setup</CardTitle>
        <CardDescription className="text-gray-400">
          Set up admin privileges for user: {user.email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin && (
          <div className="flex items-center justify-center p-4 bg-green-900/30 border border-green-600 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-400">Admin privileges active</span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={handleSetupAdmin}
            disabled={isLoading}
            className="w-full bg-gold hover:bg-gold-dark text-black"
          >
            {isLoading ? "Setting up..." : "Set Admin Role"}
          </Button>
          
          <Button
            onClick={handleCheckAdmin}
            disabled={isLoading}
            variant="outline"
            className="w-full border-gray-600 text-white hover:bg-gray-800"
          >
            {isLoading ? "Checking..." : "Check Admin Status"}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          This utility helps set up admin privileges for testing purposes
        </div>
      </CardContent>
    </Card>
  );
};
