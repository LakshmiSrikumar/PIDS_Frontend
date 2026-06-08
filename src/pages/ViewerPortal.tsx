import { useState } from 'react';
import type { MouseEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { viewerLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import viewerRoomImage from '../assets/viewer_screen.png';

export default function ViewerPortal() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [cisfId, setCisfId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'verifying' | 'granted'>('idle');

  const handleTogglePassword = (e: MouseEvent) => {
    e.preventDefault();
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitStatus !== 'idle') return;
    setErrorMsg('');
    setSubmitStatus('verifying');

    try {
      const res = await viewerLogin(cisfId, username, password, fullName);
      setAuth(res.token, res.role);
      setSubmitStatus('granted');
      const next = res.must_change_password ? '/change-password' : '/dashboard/viewer';
      // ── ROUTING FIX ────────────────────────────────────────
      // Removed the 1-second setTimeout wrapper. Navigate
      // immediately after setAuth with replace: true so the
      // ProtectedRoute sees the committed token/role on its
      // first render of the new route.
      // ──────────────────────────────────────────────────────
      navigate(next, { replace: true });
    } catch (err: any) {
      setSubmitStatus('idle');
      setErrorMsg(err.response?.data?.detail ?? 'Login failed. Try again.');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary-container relative flex items-center justify-center overflow-y-auto">
      {/* Background Atmospheric Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-surface-container/20 via-background to-background"></div>
        <div className="scanline"></div>
        <img
          className="absolute inset-0 w-full h-full object-cover opacity-10"
          alt="A high-tech surveillance command center at night with deep blue ambient lighting."
          src={viewerRoomImage}
        />
      </div>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-[440px] flex flex-col gap-stack-lg p-container-padding">
        {/* Branding & Back Action */}
        <div className="flex flex-col gap-unit text-left">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-stack-md w-fit border border-outline-variant px-3 py-1.5 rounded hover:bg-white/10 hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-md text-label-md">Back</span>
          </button>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-primary tracking-[0.2em] mb-1">
              OPERATOR LOGIN
            </span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight uppercase">
              Viewer Access
            </h1>
          </div>
        </div>

        {/* Login Form Container */}
        <div className="glass-panel p-stack-lg flex flex-col gap-stack-md text-left">
          <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
            {/* Field: CISF ID */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="cisf-id">
                CISF ID
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                  badge
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant px-10 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline-variant transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(173,198,255,0.4)] focus:outline-none focus:border-primary focus:ring-0"
                  id="cisf-id"
                  name="cisf-id"
                  placeholder="0000-0000-0000"
                  type="text"
                  required
                  value={cisfId}
                  onChange={(e) => setCisfId(e.target.value)}
                  disabled={submitStatus !== 'idle'}
                />
              </div>
            </div>

            {/* Field: Username */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                  person
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant px-10 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline-variant transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(173,198,255,0.4)] focus:outline-none focus:border-primary focus:ring-0"
                  id="username"
                  name="username"
                  placeholder="USERNAME"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitStatus !== 'idle'}
                />
              </div>
            </div>

            {/* Field: Password */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                  lock
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant px-10 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline-variant transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(173,198,255,0.4)] focus:outline-none focus:border-primary focus:ring-0"
                  id="password"
                  name="password"
                  placeholder="••••••••••••"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitStatus !== 'idle'}
                />
                <button
                  type="button"
                  onClick={handleTogglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] hover:text-on-surface cursor-pointer"
                  disabled={submitStatus !== 'idle'}
                >
                  {showPassword ? 'visibility_off' : 'visibility'}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-red-400 font-label-sm text-label-sm text-center">
                {errorMsg}
              </p>
            )}

            {/* Field: Operator Name */}
            <div className="flex flex-col gap-unit">
              <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="operator-name">
                Operator Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px]">
                  person
                </span>
                <input
                  className="w-full bg-surface-container-lowest border border-outline-variant px-10 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline-variant transition-all hover:border-primary/50 hover:shadow-[0_0_15px_rgba(173,198,255,0.4)] focus:outline-none focus:border-primary focus:ring-0"
                  id="operator-name"
                  name="operator-name"
                  placeholder="NAME"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitStatus !== 'idle'}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-stack-sm flex flex-col gap-stack-sm">
              <button
                className={`w-full py-4 font-label-md text-label-md font-bold tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2 group cursor-pointer ${
                  submitStatus === 'idle'
                    ? 'bg-primary text-on-primary hover:brightness-110'
                    : submitStatus === 'verifying'
                    ? 'bg-primary/80 text-on-primary cursor-wait opacity-80'
                    : 'bg-tertiary text-on-tertiary-container cursor-wait'
                }`}
                type="submit"
                disabled={submitStatus !== 'idle'}
              >
                {submitStatus === 'idle' && (
                  <>
                    AUTHORIZE ACCESS
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      login
                    </span>
                  </>
                )}
                {submitStatus === 'verifying' && (
                  <>
                    VERIFYING...
                    <span className="material-symbols-outlined text-[18px] animate-spin">
                      sync
                    </span>
                  </>
                )}
                {submitStatus === 'granted' && (
                  <>
                    ACCESS GRANTED
                    <span className="material-symbols-outlined text-[18px]">
                      check_circle
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Meta */}
        <div className="flex justify-center opacity-30 mt-stack-md">
          <p className="font-label-sm text-[10px] text-center uppercase tracking-widest">
            © 2026 lakshmi srikumar. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
