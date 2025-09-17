import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = location.hash || window.location.hash;
    const params = new URLSearchParams(location.search);
    const hasRecovery = hash.includes('type=recovery') || params.get('code');

    if (hasRecovery && location.pathname !== '/auth') {
      const url = new URL(window.location.href);
      // Ensure mode=reset is present
      if (!params.get('mode')) {
        params.set('mode', 'reset');
      }
      const next = `/auth?${params.toString()}${hash}`;
      navigate(next, { replace: true });
    }
  }, [location, navigate]);

  return null;
};

export default AuthRedirect;