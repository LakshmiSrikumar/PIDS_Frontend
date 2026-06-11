import { useState, useRef, useEffect } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeAdmin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import serverRoomImage from '../assets/server_screen.png';

type Status = 'idle' | 'submitting' | 'success';

// Server-side rules, mirrored client-side for fast inline feedback.
// Backend (app/schemas/auth.py AdminInitializeRequest) is the
// authority — these regexes must stay in lockstep.
const USERNAME_RE = /^[A-Za-z0-9._-]{3,32}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function InitializeAdmin() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const cardRef = useRef<HTMLDivElement>(null);

  // Ambient glow tracking (mouse position relative to card)
  useEffect(() => {
    if (window.innerWidth <= 768) return;
    const card = cardRef.current;
    if (!card) return;
    const onMove = (e: globalThis.MouseEvent) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    document.addEventListener('mousemove', onMove);
    return () => document.removeEventListener('mousemove', onMove);
  }, []);

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<boolean>>) =>
    (e: MouseEvent) => {
      e.preventDefault();
      setter((p) => !p);
    };

  const validate = (): string | null => {
    if (!username || !newPassword || !confirmPassword)
      return 'All fields required.';
    if (!USERNAME_RE.test(username))
      return 'Username must be 3-32 chars; letters, digits, . _ - only.';
    if (!PASSWORD_RE.test(newPassword))
      return 'Password must be 8+ chars with upper, lower, digit, and special character.';
    if (newPassword !== confirmPassword)
      return 'New passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg('');
    setStatus('submitting');
    try {
      const res = await initializeAdmin(username, newPassword, confirmPassword);
      // Backend issued a session token — store it and drop the
      // operator straight into the admin portal. No second login.
      setAuth(res.token, res.role, username);
      // ── ROUTING FIX ────────────────────────────────────────
      // Removed the 600ms setTimeout wrapper. Navigate
      // immediately after setAuth with replace: true so the
      // ProtectedRoute sees the committed token/role on its
      // first render of the new route.
      // ──────────────────────────────────────────────────────
      navigate('/dashboard/admin', { replace: true });
    } catch (err: any) {
      setStatus('idle');
      // 409 = admin already initialized (race / someone else beat
      // us to the wizard). 422 = payload rejected. Anything else
      // = server. All surface inline — no blind retry.
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 409) {
        setErrorMsg(
          detail ?? 'Admin already initialized. Please sign in instead.'
        );
      } else if (status === 422) {
        setErrorMsg(
          detail ?? 'Validation failed. Check your inputs and try again.'
        );
      } else {
        setErrorMsg(detail ?? 'Initialization failed. Try again.');
      }
    }
  };

  const inputCls =
    'w-full bg-surface-container-lowest/50 border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary focus:ring-0 transition-all pl-10 pr-10 py-3 input-high-tech';
  const iconLeft =
    'absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-[18px] pointer-events-none';

  const busy = status !== 'idle';

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-server-room opacity-30"
          style={{ backgroundImage: `url(${serverRoomImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background to-background" />
      </div>

      <main className="w-full max-w-[440px] px-margin relative z-10 flex flex-col gap-stack-lg">
        <div className="flex flex-col gap-unit">
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="group flex items-center gap-2 text-on-surface-variant transition-all mb-stack-md w-fit border border-on-surface-variant/20 px-3 py-1.5 rounded hover:bg-on-surface-variant/10 hover:text-on-surface active:opacity-80 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="font-label-md text-label-md">Back</span>
          </button>

          <div className="flex flex-col">
            <p className="font-label-sm text-label-sm text-secondary tracking-[0.2em] uppercase mb-1">
              Setup Wizard
            </p>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
              Initialize Admin
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              First-time setup — create the system administrator account.
            </p>
          </div>
        </div>

        <div
          ref={cardRef}
          className="glass-panel rounded-xl p-6 md:p-8 space-y-6 relative overflow-hidden"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{
              background:
                'radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(173,198,255,0.15), transparent 40%)',
            }}
          />
          <div className="relative">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Username */}
              <div className="space-y-2 text-left group">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant block ml-1 transition-colors duration-300 group-hover:text-primary"
                  htmlFor="init-username"
                >
                  Username
                </label>
                <div className="relative flex items-center">
                  <span className={iconLeft}>person</span>
                  <input
                    className={inputCls}
                    id="init-username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={busy}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2 text-left group">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant block ml-1 transition-colors duration-300 group-hover:text-primary"
                  htmlFor="new-pass"
                >
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className={iconLeft}>lock</span>
                  <input
                    className={inputCls}
                    id="new-pass"
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={busy}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                    onClick={toggle(setShowNew)}
                    disabled={busy}
                    aria-label="Toggle new password visibility"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showNew ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 text-left group">
                <label
                  className="font-label-sm text-label-sm text-on-surface-variant block ml-1 transition-colors duration-300 group-hover:text-primary"
                  htmlFor="confirm-pass"
                >
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <span className={iconLeft}>lock</span>
                  <input
                    className={inputCls}
                    id="confirm-pass"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={busy}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-on-surface-variant hover:text-secondary transition-colors cursor-pointer"
                    onClick={toggle(setShowConfirm)}
                    disabled={busy}
                    aria-label="Toggle confirm password visibility"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-error font-label-sm text-label-sm text-center">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`w-full font-headline-sm py-4 rounded-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all group mt-2 cursor-pointer ${
                  status === 'idle'
                    ? 'bg-primary text-on-primary-container hover:brightness-110'
                    : status === 'submitting'
                      ? 'bg-primary/80 text-on-primary-container cursor-wait opacity-80'
                      : 'bg-tertiary text-on-tertiary-container cursor-default'
                }`}
              >
                {status === 'idle' && (
                  <>
                    <span className="font-bold tracking-tight uppercase text-label-md">
                      Initialize Admin
                    </span>
                    <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </>
                )}
                {status === 'submitting' && (
                  <>
                    <span className="material-symbols-outlined animate-spin">sync</span>
                    <span className="font-bold tracking-tight uppercase text-label-md">
                      Initializing…
                    </span>
                  </>
                )}
                {status === 'success' && (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="font-bold tracking-tight uppercase text-label-md">
                      Initialized
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 opacity-30 mt-stack-md">
          <p className="font-label-sm text-[10px] text-center uppercase tracking-widest">
            © 2026 Lakshmi srikumar. All rights reserved.
          </p>
        </div>
      </main>

      <style>{`
        .bg-server-room {
          background-size: cover;
          background-position: center;
        }
        .input-high-tech {
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .input-high-tech:hover {
          border-color: #8c909f;
          box-shadow: 0 0 8px rgba(140, 144, 159, 0.3);
        }
        .input-high-tech:focus-within {
          border-color: #adc6ff;
          box-shadow: 0 0 12px rgba(173, 198, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
