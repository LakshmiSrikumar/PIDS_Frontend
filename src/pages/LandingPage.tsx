import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import landing from '../assets/network.png';

export default function LandingPage() {
  const navigate = useNavigate();
  const [scanSpeed, setScanSpeed] = useState<number>(8.95882);

  useEffect(() => {
    const interval = setInterval(() => {
      const duration = 6 + Math.random() * 8;
      setScanSpeed(duration);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminClick = () => navigate('/admin');
  const handleViewerClick = () => navigate('/viewer');

  return (
    <div
      className="font-body-md text-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(11, 19, 38, 0.85), rgba(11, 19, 38, 0.85)), url(${landing})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center relative px-margin min-h-screen pt-16 pb-16">
        {/* Atmospheric Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-60">
          <div className="scanline" style={{ animationDuration: `${scanSpeed}s` }}></div>
          <div className="absolute inset-0 vignette"></div>
        </div>

        {/* Centered Portal Layout */}
        <div className="relative z-20 w-full max-w-5xl mx-auto flex flex-col items-center gap-stack-lg">
          <div className="text-center space-y-stack-sm mb-stack-lg">
            <div className="flex justify-center mb-stack-md">
              <span className="font-label-md text-primary tracking-[0.3em] border-b border-primary/30 pb-1 uppercase text-[40px] md:text-[56px] font-headline-lg">
                welcome
              </span>
            </div>
            <h1
              className="font-headline-lg text-[40px] md:text-[56px] text-on-surface tracking-tighter leading-none uppercase"
              style={{ textShadow: 'rgba(0, 0, 0, 0.8) 0px 4px 12px' }}
            >
              surveillance Portal
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full">
            {/* Admin Portal Card */}
            <div className="portal-card flex flex-col items-center text-center p-stack-lg border border-outline-variant bg-surface-container-low/80 backdrop-blur-md">
              <div className="mb-stack-lg w-16 h-16 rounded-full border border-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '32px' }}>
                  admin_panel_settings
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm uppercase tracking-tight">
                Administrative
              </h2>
              <p className="font-body-md text-on-surface-variant mb-stack-lg max-w-[280px]">
                Full system oversight, hardware configuration, and protocol management.
              </p>
              <div className="w-full space-y-4">
                <button
                  onClick={handleAdminClick}
                  className="w-full h-14 bg-primary text-on-primary font-label-md text-label-md tracking-[0.2em] flex items-center justify-center gap-3 hover:brightness-110 active:opacity-80 transition-all border-none uppercase cursor-pointer"
                >
                  Admin Sign In
                </button>
                {/* Setup wizard — one-shot, only viable on first boot
                    (server returns 409 once any user exists). Kept on
                    the landing card so operators always know where
                    to find it. */}
                <button
                  onClick={() => navigate('/admin/initialize')}
                  className="w-full h-12 border border-primary/40 text-primary font-label-md text-label-md tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary/10 active:opacity-80 transition-all uppercase cursor-pointer"
                >
                  Initialize Admin Session
                </button>
              </div>
            </div>

            {/* Viewer Portal Card */}
            <div className="portal-card flex flex-col items-center text-center p-stack-lg border border-outline-variant bg-surface-container-low/80 backdrop-blur-md">
              <div className="mb-stack-lg w-16 h-16 rounded-full border border-secondary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: '32px' }}>
                  visibility
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface mb-stack-sm uppercase tracking-tight">
                Operational
              </h2>
              <p className="font-body-md text-on-surface-variant mb-stack-lg max-w-[280px]">
                Real-time surveillance feeds, event logs, and status monitoring.
              </p>
              <div className="w-full space-y-4">
                <button
                  onClick={handleViewerClick}
                  className="w-full h-14 border border-secondary text-secondary font-label-md text-label-md tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-secondary/10 active:opacity-80 transition-all uppercase cursor-pointer"
                >
                  INITIALIZE VIEWER LOGIN
                </button>
              </div>
            </div>
          </div>

          {/* System Footer Details */}
          <div className="mt-stack-lg flex flex-col items-center gap-3 opacity-40">
            <div className="h-[1px] w-24 bg-outline-variant"></div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="h-16 px-margin flex items-center justify-between border-t border-outline-variant/30 z-20">
        <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
          © 2026 Lakshmi Srikumar. All rights reserved
        </div>
      </footer>
    </div>
  );
}
