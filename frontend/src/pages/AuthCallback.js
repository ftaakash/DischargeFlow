import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { exchangeSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      // Extract session_id from URL hash
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        console.error('No session_id found');
        navigate('/login');
        return;
      }

      try {
        const user = await exchangeSession(sessionId);
        // Clear the hash and redirect
        window.history.replaceState(null, '', '/dashboard');
        navigate('/dashboard', { state: { user }, replace: true });
      } catch (error) {
        console.error('Auth failed:', error);
        navigate('/login');
      }
    };

    processAuth();
  }, [exchangeSession, navigate]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-zinc-400">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
