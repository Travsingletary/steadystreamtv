
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { AdminLoginHeader } from "@/components/admin/AdminLoginHeader";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { PasswordResetForm } from "@/components/admin/PasswordResetForm";
import { AdminLoginFooter } from "@/components/admin/AdminLoginFooter";
import { PasswordUpdateForm } from "@/components/admin/PasswordUpdateForm";
import { AdminSetup } from "@/components/admin/AdminSetup";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminLogin = () => {
  const {
    isLoading,
    isCheckingAdmin,
    isResetMode,
    resetEmailSent,
    isPasswordReset,
    loginForm,
    resetForm,
    onLoginSubmit,
    onResetSubmit,
    handleBackToLogin,
    handleForgotPassword,
    handleReturnToMain,
    handlePasswordUpdateComplete,
  } = useAdminAuth();

  const { user } = useAuth();

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {user ? (
          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-dark-200">
              <TabsTrigger value="setup" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                Admin Setup
              </TabsTrigger>
              <TabsTrigger value="login" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                Login
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup">
              <AdminSetup />
            </TabsContent>
            
            <TabsContent value="login">
              <Card className="bg-dark-200 border-gray-800">
                <AdminLoginHeader 
                  isResetMode={isResetMode} 
                  isPasswordUpdate={isPasswordReset}
                />
                <CardContent>
                  {isPasswordReset ? (
                    <PasswordUpdateForm onComplete={handlePasswordUpdateComplete} />
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

                  {!isPasswordReset && (
                    <AdminLoginFooter
                      isResetMode={isResetMode}
                      onForgotPassword={handleForgotPassword}
                      onBackToLogin={handleBackToLogin}
                      onReturnToMain={handleReturnToMain}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-dark-200 border-gray-800">
            <AdminLoginHeader 
              isResetMode={isResetMode} 
              isPasswordUpdate={isPasswordReset}
            />
            <CardContent>
              {isPasswordReset ? (
                <PasswordUpdateForm onComplete={handlePasswordUpdateComplete} />
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

              {!isPasswordReset && (
                <AdminLoginFooter
                  isResetMode={isResetMode}
                  onForgotPassword={handleForgotPassword}
                  onBackToLogin={handleBackToLogin}
                  onReturnToMain={handleReturnToMain}
                />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
