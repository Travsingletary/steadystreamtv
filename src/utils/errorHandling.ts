
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const useAuthErrorHandler = () => {
  const location = useLocation();
  const { toast } = useToast();

  const checkAuthErrors = () => {
    const query = new URLSearchParams(location.search);
    const error = query.get("error");
    const errorDescription = query.get("error_description");
    
    if (error) {
      toast({
        title: "Authentication Error",
        description: errorDescription || "An error occurred during sign-up. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { checkAuthErrors };
};
