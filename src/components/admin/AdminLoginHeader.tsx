
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface AdminLoginHeaderProps {
  isResetMode: boolean;
}

export const AdminLoginHeader = ({ isResetMode }: AdminLoginHeaderProps) => {
  return (
    <CardHeader className="text-center">
      <div className="flex justify-center mb-4">
        <Shield className="h-12 w-12 text-gold" />
      </div>
      <CardTitle className="text-2xl text-white">
        {isResetMode ? "Reset Password" : "Admin Access"}
      </CardTitle>
      <CardDescription className="text-gray-400">
        {isResetMode 
          ? "Enter your email to reset your password"
          : "Sign in to access the SteadyStream TV admin dashboard"
        }
      </CardDescription>
    </CardHeader>
  );
};
