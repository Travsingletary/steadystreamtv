
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface AdminLoginHeaderProps {
  isResetMode: boolean;
  isPasswordUpdate?: boolean;
}

export const AdminLoginHeader = ({ isResetMode, isPasswordUpdate }: AdminLoginHeaderProps) => {
  const getTitle = () => {
    if (isPasswordUpdate) return "Update Password";
    if (isResetMode) return "Reset Password";
    return "Admin Access";
  };

  const getDescription = () => {
    if (isPasswordUpdate) return "Enter your new password to complete the reset process";
    if (isResetMode) return "Enter your email to reset your password";
    return "Sign in to access the SteadyStream TV admin dashboard";
  };

  return (
    <CardHeader className="text-center">
      <div className="flex justify-center mb-4">
        <Shield className="h-12 w-12 text-gold" />
      </div>
      <CardTitle className="text-2xl text-white">
        {getTitle()}
      </CardTitle>
      <CardDescription className="text-gray-400">
        {getDescription()}
      </CardDescription>
    </CardHeader>
  );
};
