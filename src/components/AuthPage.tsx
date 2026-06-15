import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { PiggyBank, Mail, Key, UserPlus, LogIn, Chrome } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthPageProps {
  onNavigate: (view: string) => void;
}

export default function AuthPage({ onNavigate }: AuthPageProps) {
  const { signInWithGoogle, loginWithEmail, signUpWithEmail, enterGuestSession } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [failedProvider, setFailedProvider] = useState<'email' | 'google' | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFailedProvider(null);
    setAuthLoading(true);

    if (!email || !password || (isRegister && !name)) {
      setError('Please fill in all requested fields.');
      setAuthLoading(false);
      return;
    }

    try {
      if (isRegister) {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Authentication failed. Please verify your credentials.');
      const msg = err?.message || '';
      if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
        setFailedProvider('email');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setFailedProvider(null);
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      onNavigate('dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Google authorization bypassed or closed.');
      const msg = err?.message || '';
      if (msg.includes('auth/operation-not-allowed') || msg.includes('operation-not-allowed')) {
        setFailedProvider('google');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-8">
        
        {/* Title / Logo */}
        <div className="flex flex-col items-center justify-center text-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h2 className="font-display font-bold text-2xl tracking-tight text-slate-900 mt-2">
            Welcome to BudgetAlly
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister ? 'Create an officer sandbox account' : 'Access your isolated finance panels'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-xl mb-6">
          <button
            id="tab-signin"
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${!isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Register
          </button>
        </div>

        {/* Error Notification */}
        {error && (() => {
          const isOperationNotAllowed = error.includes('auth/operation-not-allowed') || error.includes('operation-not-allowed');
          if (isOperationNotAllowed) {
            const isGoogle = failedProvider === 'google';
            return (
              <div className="bg-amber-50 border border-amber-250 rounded-xl p-4 text-xs text-amber-800 mb-6 leading-relaxed flex flex-col gap-3 shadow-sm">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  Action Required: Enable {isGoogle ? 'Google' : 'Email'} Sign-In
                </div>
                <p className="text-amber-700 leading-normal">
                  {isGoogle ? 'Google Sign-In' : 'Email & Password auth'} is not currently enabled on your Firebase project. Please enable it in your console:
                </p>
                <div className="bg-white p-3 rounded-lg border border-amber-100 space-y-2">
                  <p className="font-bold text-amber-900 uppercase tracking-wider text-[9px]">Enabling Steps:</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-amber-800 leading-normal">
                    <li>
                      Open{' '}
                      <a
                        href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/providers`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-0.5 animate-none"
                      >
                        Firebase Console Auth
                      </a>
                    </li>
                    <li>Click the <strong>Add new provider</strong> button</li>
                    <li>Select <strong>{isGoogle ? 'Google' : 'Email/Password'}</strong>, slide the <strong>Enable</strong> switch, and click <strong>Save</strong></li>
                  </ol>
                </div>
                <p className="text-[10px] text-amber-600">
                  {isGoogle ? 'Alternatively, you can register email-based officer credentials.' : 'Or, use Authorized Google Login below for instant setup.'}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await enterGuestSession();
                    onNavigate('dashboard');
                  }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all text-center cursor-pointer shadow-sm uppercase tracking-wider mt-1"
                >
                  ⚡ Bypass & Enter Sandbox Mode Now
                </button>
              </div>
            );
          }
          return (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-700 mb-6 leading-relaxed animate-none">
              <span className="font-bold">Error:</span> {error}
            </div>
          );
        })()}

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Full Name / Officer Alias
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserPlus className="w-4 h-4" />
                </span>
                <input
                  id="auth-input-name"
                  type="text"
                  placeholder="Officer Alice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="auth-input-email"
                type="email"
                placeholder="alice@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Key className="w-4 h-4" />
              </span>
              <input
                id="auth-input-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={authLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {authLoading ? (
              <span>Authenticating...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
            Or Sign In With
          </span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* Google Authentication */}
        <div className="flex flex-col gap-2.5">
          <button
            id="auth-btn-google"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-705 font-semibold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <Chrome className="w-4 h-4 text-indigo-600" /> Authorized Google Login
          </button>

          <button
            id="auth-btn-guest"
            onClick={async () => {
              await enterGuestSession();
              onNavigate('dashboard');
            }}
            disabled={authLoading}
            className="w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold text-xs py-3 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>✨ Guest Sandbox Access (Instant & Free)</span>
          </button>
        </div>

        {/* Compliance Warning */}
        {isRegister && (
          <p className="text-[10px] text-slate-400 text-center leading-normal mt-6 max-w-xs mx-auto">
            Note: Standard Firebase parameters require setting up Email Auth in console on Spark accounts. Ensure config enables providers. Google authorization has immediate clearance.
          </p>
        )}
      </div>
    </div>
  );
}
