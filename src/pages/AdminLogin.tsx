
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLoginHeader } from "@/components/admin/AdminLoginHeader";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { PasswordResetForm } from "@/components/admin/PasswordResetForm";
import { AdminLoginFooter } from "@/components/admin/AdminLoginFooter";
import { PasswordUpdateForm } from "@/components/admin/PasswordUpdateForm";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [searchParams] = useSearchParams();
  const [isPasswordUpdate, setIsPasswordUpdate] = useState(false);
  const { toast } = useToast();
  
  const {
    isLoading,
    isCheckingAdmin,
    isResetMode,
    resetEmailSent,
    loginForm,
    resetForm,
    onLoginSubmit,
    onResetSubmit,
    handleBackToLogin,
    handleForgotPassword,
    handleReturnToMain,
  } = useAdminAuth();

  useEffect(() => {
    const checkResetToken = async () => {
      const isReset = searchParams.get('reset') === 'true';
      if (isReset) {
        setIsPasswordUpdate(true);
      }
    };

    checkResetToken();
  }, [searchParams]);

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-dark-200 border-gray-800">
        <AdminLoginHeader 
          isResetMode={isResetMode} 
          isPasswordUpdate={isPasswordUpdate}
        />
        <CardContent>
          {isPasswordUpdate ? (
            <PasswordUpdateForm onComplete={() => setIsPasswordUpdate(false)} />
          ) : !isResetMode ? (
            <AdminLoginForm
              form={loginForm}
              onSubmit={onLoginSubmit}
              isLoading={isLoading}
            />
          ) : (
            <PasswordResetForm
              form={resetForm}
              onSubmit={onResetSubmit}
              isLoading={isLoading}
              resetEmailSent={resetEmailSent}
            />
          )}

          {!isPasswordUpdate && (
            <AdminLoginFooter
              isResetMode={isResetMode}
              onForgotPassword={handleForgotPassword}
              onBackToLogin={handleBackToLogin}
              onReturnToMain={handleReturnToMain}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
