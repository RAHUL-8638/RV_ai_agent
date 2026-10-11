import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  Eye,
  EyeOff,
  Lock,
  User as UserIcon,
  Mail,
  Sliders,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';
import { safeFetch } from '../utils/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  ownerConfigured: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ownerConfigured,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'owner_bootstrap'>(
    !ownerConfigured ? 'owner_bootstrap' : 'login'
  );

  // Form Fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Pre-fill owner email when opening or switching to owner_bootstrap tab
  useEffect(() => {
    if (tab === 'owner_bootstrap' && !email) {
      setEmail('rahulamirisetti@gmail.com');
    }
  }, [tab]);

  // States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'login') {
        const result = await safeFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: username,
            password,
          }),
        });

        if (!result.ok || !result.data) {
          throw new Error(result.error || 'Login failed');
        }

        onSuccess(result.data.user);
        onClose();
      } else if (tab === 'register') {
        const result = await safeFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email,
            password,
            displayName: displayName || username,
          }),
        });

        if (!result.ok || !result.data) {
          throw new Error(result.error || 'Registration failed');
        }

        onSuccess(result.data.user);
        onClose();
      } else if (tab === 'owner_bootstrap') {
        const result = await safeFetch('/api/admin/bootstrap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            email: email || 'rahulamirisetti@gmail.com',
            password,
            displayName: displayName || 'System Owner',
          }),
        });

        if (!result.ok || !result.data) {
          if (
            result.code === 'OWNER_ALREADY_INITIALIZED' ||
            result.error?.includes('OWNER_ALREADY_INITIALIZED') ||
            result.error?.includes('already been established')
          ) {
            throw new Error(
              'Platform owner is already initialized. Please switch to the "Login" tab to authenticate with your owner credentials.'
            );
          }
          throw new Error(result.error || 'Owner initialization failed');
        }

        setSuccessMsg('Owner account verified and provisioned! Administrative access established.');
        setTimeout(() => {
          onSuccess(result.data.user);
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-lg border border-emerald-500/50 bg-zinc-950 p-6 sm:p-8 shadow-[0_0_40px_rgba(0,255,102,0.15)] font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              {tab === 'login'
                ? 'AUTHENTICATE ACCESS'
                : tab === 'register'
                ? 'REGISTER RESEARCHER'
                : 'INITIALIZE SYSTEM OWNER'}
            </h2>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-black p-1 rounded border border-zinc-800 mb-6">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-center rounded transition-colors ${
              tab === 'login' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setTab('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 text-center rounded transition-colors ${
              tab === 'register' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => {
              setTab('owner_bootstrap');
              setErrorMsg('');
              if (!email) setEmail('rahulamirisetti@gmail.com');
            }}
            className={`flex-1 py-1.5 text-center rounded transition-colors text-amber-300 ${
              tab === 'owner_bootstrap'
                ? 'bg-amber-950/80 border border-amber-500/50 text-amber-200 font-bold'
                : 'text-amber-500 hover:text-amber-300'
            }`}
          >
            {ownerConfigured ? 'Admin / Owner' : 'First Owner'}
          </button>
        </div>

        {/* Owner Bootstrap Notice */}
        {tab === 'owner_bootstrap' && (
          <div className="mb-4 rounded border border-amber-500/40 bg-amber-950/20 p-3 text-[11px] text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>System Owner Credentials</span>
            </div>
            <p className="text-zinc-300">
              Provision or claim the root administrative account for <span className="text-amber-400 font-bold">rahulamirisetti@gmail.com</span> with full Owner privileges.
            </p>
          </div>
        )}

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 rounded border border-red-500/50 bg-red-950/20 p-3 text-red-300">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded border border-emerald-500/50 bg-emerald-950/20 p-3 text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-300 mb-1">
              {tab === 'login' ? 'Username or Email:' : 'Unique Username:'}
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tab === 'login' ? 'Enter username or email' : 'e.g. cyber_analyst'}
                className="w-full rounded border border-zinc-800 bg-black pl-9 pr-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {tab !== 'login' && (
            <div>
              <label className="block text-zinc-300 mb-1">Display Name:</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Cyber"
                className="w-full rounded border border-zinc-800 bg-black px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {tab !== 'login' && (
            <div>
              <label className="block text-zinc-300 mb-1">Email Address:</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.local"
                  className="w-full rounded border border-zinc-800 bg-black pl-9 pr-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-300 mb-1">Password:</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded border border-zinc-800 bg-black pl-9 pr-9 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-emerald-500 py-2.5 font-bold text-black shadow-[0_0_15px_rgba(0,255,102,0.25)] hover:bg-emerald-400 disabled:opacity-50 transition-colors"
            >
              {loading
                ? 'Validating Credentials...'
                : tab === 'login'
                ? 'Sign In'
                : tab === 'register'
                ? 'Create Researcher Account'
                : 'Initialize Owner Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
