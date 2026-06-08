import { useState } from 'react';
import type { MouseEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import serverRoomImage from '../assets/server_screen.png';

export default function AdminPortal() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const res = await adminLogin(username, password);
      setSubmitStatus('granted');
      // Bootstrap was retired: must_change_password is no longer a
      // possible login outcome for admins. The wizard path lives at
      // /admin/initialize and creates a fully-rotated account in
      // one shot. Keep the field defensive just in case some legacy
      // data still has the flag set.
      if (res.must_change_password) {
        setErrorMsg(
          'This account still requires a password reset. Contact the operator.'
        );
        setSubmitStatus('idle');
        return;
      }
      setAuth(res.token, res.role);
      // ── ROUTING FIX ────────────────────────────────────────
      // Removed the 1-second setTimeout wrapper. The setTimeout
      // was a UX flourish to show "ACCESS GRANTED" before
      // navigating, but it created a window where the AuthContext
      // state was already updated while the URL hadn't changed.
      // Navigating immediately after setAuth, with replace: true,
      // ensures ProtectedRoute sees the committed token/role on
      // its first render of the new route.
      // ──────────────────────────────────────────────────────
      navigate('/dashboard/admin', { replace: true });
    } catch (err: any) {
      setSubmitStatus('idle');
      setErrorMsg(err.response?.data?.detail ?? 'Login failed. Try again.');
    }
  };

  return (
    <div className="bg-background text-on-surface selection:bg-primary/30 min-h-screen flex flex-col justify-center relative overflow-hidden">
      {/* Atmospheric Background Layer */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-background/60"></div>
        <img
          className="w-full h-full object-cover brightness-50 opacity-30"
          alt="A highly detailed cinematic shot of a dark, high-tech server room with glowing blue fiber optic cables and server racks."
          src={serverRoomImage}
        />
        <div className="scanline"></div>
      </div>

      {/* Main Content Canvas */}
      <main className="relative z-10 flex p-container-padding w-full max-w-md mx-auto items-center justify-center h-screen">
        <div className="w-full max-w-md flex flex-col gap-stack-md -translate-y-6">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-stack-md w-fit border border-outline-variant px-3 py-1.5 rounded hover:bg-white/10 hover:text-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-md text-label-md">Back</span>
          </button>

          <div className="space-y-unit mb-6 text-left">
            <div className="flex items-center gap-3">
              <span className="font-label-sm text-label-sm text-primary tracking-[0.2em] uppercase">
                Configurator Login
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface leading-none drop-shadow-lg uppercase">
              Admin Access
            </h1>
          </div>

          <div className="w-full">
            <form className="flex flex-col gap-stack-lg" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="group flex flex-col gap-unit hover-highlight text-left">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant flex justify-between transition-colors duration-300"
                  htmlFor="username"
                >
                  <span>Username</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] transition-colors duration-300">
                    person
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest/20 border border-outline-variant/50 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline/30 focus:outline-none focus:border-primary focus:ring-0 transition-all px-10"
                    id="username"
                    name="username"
                    placeholder="ADMIN_ID"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={submitStatus !== 'idle'}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group flex flex-col gap-unit hover-highlight text-left">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant flex justify-between transition-colors duration-300"
                  htmlFor="password"
                >
                  <span>Password</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[18px] transition-colors duration-300">
                    lock
                  </span>
                  <input
                    className="w-full bg-surface-container-lowest/20 border border-outline-variant/50 py-3 font-label-md text-label-md text-on-surface placeholder:text-outline/30 focus:outline-none focus:border-primary focus:ring-0 transition-all px-10"
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
                    aria-label="Toggle password visibility"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors flex items-center justify-center p-1 cursor-pointer"
                    id="togglePasswordBtn"
                    type="button"
                    onClick={handleTogglePassword}
                    disabled={submitStatus !== 'idle'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-400 font-label-sm text-label-sm text-center">
                  {errorMsg}
                </p>
              )}

              {/* Action Button */}
              <button
                className={`mt-2 w-full h-14 flex items-center justify-center gap-2 group active:scale-[0.98] transition-all shadow-lg cursor-pointer ${
                  submitStatus === 'idle'
                    ? 'bg-primary text-on-primary-container hover:brightness-110'
                    : submitStatus === 'verifying'
                    ? 'bg-primary/80 text-on-primary-container cursor-wait opacity-80'
                    : 'bg-tertiary text-on-tertiary-container cursor-wait'
                }`}
                id="submitBtn"
                type="submit"
                disabled={submitStatus !== 'idle'}
              >
                {submitStatus === 'idle' && (
                  <>
                    <span className="font-label-md text-label-md font-bold uppercase tracking-[0.1em]">
                      Initialize Session
                    </span>
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                      login
                    </span>
                  </>
                )}
                {submitStatus === 'verifying' && (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span className="font-label-md text-label-md font-bold uppercase tracking-[0.1em]">
                      VERIFYING...
                    </span>
                  </>
                )}
                {submitStatus === 'granted' && (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-label-md text-label-md font-bold uppercase tracking-[0.1em]">
                      ACCESS GRANTED
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Status Logs (Aesthetic Data) */}
          <footer className="w-full flex items-center justify-center mt-stack-lg opacity-50">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              © 2026 Lakshmi Srikumar. All Rights reserved
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
