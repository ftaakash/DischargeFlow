import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Activity, Shield, Clock, Users } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left side - Hero Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1692693/pexels-photo-1692693.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="relative z-10 p-12 flex flex-col justify-end">
          <div className="max-w-md">
            <h2 className="text-3xl font-semibold text-zinc-50 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Streamline Patient Discharges
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Reduce discharge time from 6-8 hours to under 2 hours with AI-powered documentation and automated workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                DischargeFlow
              </h1>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Hospital Discharge Management</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-medium text-zinc-50 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Welcome back
            </h2>
            <p className="text-zinc-400">
              Sign in to access your dashboard and manage patient discharges.
            </p>
          </div>

          {/* Google Sign In Button */}
          <Button
            data-testid="google-login-btn"
            onClick={login}
            className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-50 flex items-center justify-center gap-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Features */}
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <Clock className="w-5 h-5 text-emerald-400 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 font-medium">75% Faster</p>
              <p className="text-xs text-zinc-500">Discharge time</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <Shield className="w-5 h-5 text-blue-400 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 font-medium">HIPAA Compliant</p>
              <p className="text-xs text-zinc-500">Secure data</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <Activity className="w-5 h-5 text-amber-400 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 font-medium">AI Powered</p>
              <p className="text-xs text-zinc-500">Documentation</p>
            </div>
            <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
              <Users className="w-5 h-5 text-rose-400 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-zinc-300 font-medium">Team Coordination</p>
              <p className="text-xs text-zinc-500">Real-time updates</p>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-zinc-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
