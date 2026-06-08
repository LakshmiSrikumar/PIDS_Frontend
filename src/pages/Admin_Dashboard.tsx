import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import mapImage from '../assets/map.jpg';

const MAP_PRIMARY = mapImage;
const STITCH_MAP_FALLBACK =
  'https://lh3.googleusercontent.com/aida/AP1WRLs06AwRinWHTTxGydyxBTC0YaD41amfriTFX-UsKbEbTjnifsW55Pkq9RkvWMJBefcl4OlBMGAq08DM0xXqBx-4n9BKB4_8A1zXCpdgbG-UVyiWEBJtKxQxQJR4534G6XzidGhEfOlLNujZuvUhzQF-r0qJq0zRD_0DxXzQg0bkCDfenkgUT5jOJ1gcNgJwTHbA__WA9iEeatNd25cAFiQvXjzHsAqvs0eYH2v7qhlFFKEbEMvegLtZqNo';

const NAV = [
  { id: 'home', label: 'Home', icon: 'dashboard' },
  { id: 'nodes', label: 'Nodes', icon: 'hub' },
  { id: 'devices', label: 'Devices', icon: 'router' },
  { id: 'users', label: 'Users', icon: 'group' },
] as const;

export default function Admin_Dashboard() {
  const navigate = useNavigate();
  const { clearAuth, role } = useAuth();
  const [activeNav, setActiveNav] = useState<string>('home');
  const [mapSrc, setMapSrc] = useState<string>(MAP_PRIMARY);

  // admin-only guard (defense in depth — route already protected)
  useEffect(() => {
    if (role !== null && role !== undefined && role !== 'admin') navigate('/', { replace: true });
  }, [role, navigate]);

  const handleLogout = async () => {
    try {
      await logoutUser(undefined);
    } catch {
      // swallow — still clear local session
    }
    clearAuth();
    navigate('/');
  };

  const handleImgError = () => {
    if (mapSrc !== STITCH_MAP_FALLBACK) setMapSrc(STITCH_MAP_FALLBACK);
  };

  return (
    <div className="bg-background text-on-surface font-body-md text-body-md selection:bg-secondary/30 min-h-screen">
      {/* ── Sidebar ── */}
      <aside
        id="side-nav"
        className="fixed left-0 top-0 h-full z-[60] bg-surface/90 backdrop-blur-xl border-r border-outline-variant group hover:w-64 w-16 transition-all duration-300 ease-in-out flex flex-col overflow-hidden"
      >
        {/* PIDS header */}
        <div className="h-16 flex items-center px-4 gap-4 border-b border-outline-variant overflow-hidden shrink-0">
          <span className="material-symbols-outlined text-primary shrink-0">security</span>
          <h1 className="font-headline-md text-headline-sm tracking-tighter text-secondary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            PIDS
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-2">
          {NAV.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={
                  isActive
                    ? 'flex items-center gap-4 px-4 py-3 text-secondary border-l-4 border-secondary bg-secondary/10 w-full text-left'
                    : 'flex items-center gap-4 px-4 py-3 text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface transition-all w-full text-left'
                }
              >
                <span className="material-symbols-outlined shrink-0">{item.icon}</span>
                <span className="font-label-md text-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer: avatar + Admin + Terminate */}
        <div className="p-3 border-t border-outline-variant overflow-hidden shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-4 px-1 flex-1 overflow-hidden">
              <div className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container overflow-hidden shrink-0" />
              <div className="flex flex-col whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-on-surface font-label-md">Admin</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Terminate Session"
              className="flex items-center justify-center p-2 rounded-lg text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span className="ml-2 text-label-sm font-medium uppercase tracking-wider">
                Terminate
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Canvas (Map) ── */}
      <main className="fixed inset-0 w-full h-full overflow-hidden pl-16">
        <div className="relative w-full h-full bg-[#060e20]">
          {/* Map container */}
          <div className="absolute inset-0 z-0 overflow-hidden glass-panel">
            <img
              alt="Industrial Map Interface"
              className="w-full h-full object-contain opacity-50 mix-blend-screen grayscale contrast-125"
              src={mapSrc}
              onError={handleImgError}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-40" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#060e20_100%)] opacity-30" />
          </div>

          {/* Left toolset */}
          <div className="absolute top-margin z-20 flex flex-col gap-4 left-4">
            <div className="glass-panel bg-surface-container-low/40 p-stack-sm rounded-xl border border-outline-variant/30 flex flex-col gap-2 w-14 items-center">
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary-container/20 text-on-surface transition-all"
                aria-label="Zoom in"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary-container/20 text-on-surface transition-all"
                aria-label="Zoom out"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
              <div className="w-8 h-px bg-outline-variant/30 mx-auto my-1" />
              <button
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-secondary-container/20 text-on-surface transition-all"
                aria-label="Layers"
              >
                <span className="material-symbols-outlined">layers</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
