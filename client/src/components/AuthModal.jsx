import React, { useState } from 'react';
import { X, Lock, Mail, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const AuthModal = ({ onClose }) => {
  const { login, register, loginGoogleDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDemo = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginGoogleDemo();
      onClose();
    } catch {
      setErrorMsg('Google sign in demo failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-surface-dark-card border border-surface-dark-border p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-zinc-100 mb-1">
          {isRegister ? 'Join DuTube' : 'Welcome back'}
        </h3>
        <p className="text-xs text-zinc-400 mb-5">
          {isRegister ? 'Create an account to save history and playlists' : 'Sign in to access your subscriptions and library'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* 1-Click Google Sign-In Demo */}
        <button
          onClick={handleGoogleDemo}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-white text-zinc-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-zinc-100 active:scale-98 transition-all mb-4 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Or with email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-dark-elevated border border-surface-dark-border focus-within:border-dutube-500">
              <User className="w-4 h-4 text-zinc-400 ml-1" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-dark-elevated border border-surface-dark-border focus-within:border-dutube-500">
            <Mail className="w-4 h-4 text-zinc-400 ml-1" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-surface-dark-elevated border border-surface-dark-border focus-within:border-dutube-500">
            <Lock className="w-4 h-4 text-zinc-400 ml-1" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-dutube-500 to-dutube-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-dutube-500/25 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{isRegister ? 'Create Account' : 'Sign In'}</span>}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(p => !p);
              setErrorMsg('');
            }}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            {isRegister ? 'Already have an account? Sign in' : 'Don’t have an account? Create one'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
