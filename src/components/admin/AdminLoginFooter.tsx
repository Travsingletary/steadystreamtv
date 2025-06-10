
import { ArrowLeft } from "lucide-react";

interface AdminLoginFooterProps {
  isResetMode: boolean;
  onForgotPassword: () => void;
  onBackToLogin: () => void;
  onReturnToMain: () => void;
}

export const AdminLoginFooter = ({ 
  isResetMode, 
  onForgotPassword, 
  onBackToLogin, 
  onReturnToMain 
}: AdminLoginFooterProps) => {
  return (
    <div className="mt-6 text-center space-y-2">
      {!isResetMode ? (
        <>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-gold hover:underline text-sm"
          >
            Forgot your password?
          </button>
          <p className="text-gray-400 text-sm">
            Need access?{" "}
            <button
              onClick={onReturnToMain}
              className="text-gold hover:underline"
            >
              Return to main site
            </button>
          </p>
        </>
      ) : (
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center justify-center gap-2 text-gold hover:underline text-sm mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </button>
      )}
    </div>
  );
};
