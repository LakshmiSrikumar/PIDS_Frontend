import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import mapImage from '../assets/map.jpg';

const ALERTS = [
  { time: '14:22:04', type: 'Alert', label: 'Alert', message: 'Entry Detected - Gate 2', node: 'EXT_SURV_01' },
  { time: '14:21:48', type: 'Log', label: 'Log', message: 'Motion Sensor Triggered - Hallway B', node: 'INT_MOT_04' },
  { time: '14:20:12', type: 'System', label: 'System', message: 'Routine Backup Completed', node: 'AEGIS_STORAGE_B' },
  { time: '14:18:55', type: 'Log', label: 'Log', message: 'Badge Access: Operator 04', node: 'Server Room C' },
  { time: '14:15:30', type: 'Action', label: 'Action', message: 'Manual Zoom Activated', node: 'LOBBY_PTZ_02' },
];

export default function Viewer_Dashboard() {
  const navigate = useNavigate();
  const { clearAuth, userName, role } = useAuth();

  const displayName = userName ?? (role === 'admin' ? 'Admin' : 'Viewer');

  const handleLogout = async () => {
    try {
      await logoutUser(undefined);
    } catch {
      // swallow — still clear local session
    }
    clearAuth();
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen font-body-md text-body-md selection:bg-secondary/30 bg-background text-on-surface">
      {/* ── Top App Bar ── */}
      <header className="flex justify-between items-center w-full px-4 h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-headline-sm font-headline-sm font-bold tracking-widest text-primary uppercase">
            PIDS Viewer Surveillance
          </h1>
        </div>
        <div className="flex items-center gap-stack-md">
          <div className="text-right hidden sm:block">
            <p className="text-label-md font-label-md text-on-surface font-bold">{displayName}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all duration-200 active:scale-95 border border-outline-variant/20 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-label-sm font-label-sm uppercase tracking-widest hidden sm:block">Logout</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 relative mt-16 pb-20 overflow-hidden flex flex-col md:flex-row">
        {/* Floorplan Hub */}
        <section className="flex-1 relative bg-surface-container-lowest flex items-center justify-center p-8">
          <div className="relative w-full h-full max-w-5xl max-h-[80vh] bg-surface-container rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
            <img
              alt="Floorplan Map"
              className="w-full h-full object-contain opacity-80 mix-blend-screen"
              src={mapImage}
            />
            {/* FOV Overlays */}
            <div className="absolute top-[20%] left-[40%] w-48 h-48 bg-secondary/20 rounded-full blur-3xl fov-pulse pointer-events-none" />
            <div className="absolute top-[60%] left-[70%] w-64 h-64 bg-primary/10 rounded-full blur-3xl fov-pulse pointer-events-none" />
            <div className="absolute bottom-[10%] left-[15%] w-40 h-40 bg-secondary/15 rounded-full blur-3xl fov-pulse pointer-events-none" />
            {/* Interactive Nodes */}
            <div className="absolute top-[25%] left-[42%] group cursor-pointer">
              <div className="w-4 h-4 bg-secondary rounded-full shadow-[0_0_12px_rgba(76,215,246,0.8)] animate-pulse" />
              <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-surface-container-high border border-outline-variant rounded shadow-xl min-w-[120px] z-50">
                <p className="text-label-sm font-label-sm text-secondary">NODE_022</p>
                <p className="text-label-md font-label-md text-on-surface">Lobby West</p>
              </div>
            </div>
            <div className="absolute top-[65%] left-[75%] group cursor-pointer">
              <div className="w-4 h-4 bg-primary rounded-full shadow-[0_0_12px_rgba(173,198,255,0.8)] animate-pulse" />
            </div>
            <div className="absolute bottom-[20%] left-[20%] group cursor-pointer">
              <div className="w-4 h-4 bg-secondary rounded-full shadow-[0_0_12px_rgba(76,215,246,0.8)] animate-pulse" />
            </div>
            {/* Map Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
              <button className="w-10 h-10 bg-surface-container-highest/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-outline-variant/30 hover:bg-surface-bright transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-on-surface">add</span>
              </button>
              <button className="w-10 h-10 bg-surface-container-highest/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-outline-variant/30 hover:bg-surface-bright transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-on-surface">remove</span>
              </button>
              <button className="w-10 h-10 bg-surface-container-highest/80 backdrop-blur-md rounded-lg flex items-center justify-center border border-outline-variant/30 hover:bg-surface-bright transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-on-surface">layers</span>
              </button>
            </div>
            <div className="absolute top-6 left-6 p-4 bg-surface-container-highest/40 backdrop-blur-md rounded-xl border border-outline-variant/20">
              <h3 className="text-label-md font-label-md text-secondary tracking-widest uppercase mb-1">Current Sector</h3>
              <p className="text-headline-sm font-headline-sm text-on-surface">BAY HQ FLOOR 1</p>
            </div>
          </div>
        </section>

        {/* Live Activity Stream */}
        <aside className="md:w-80 bg-surface-container-low/95 backdrop-blur-xl border-l border-outline-variant/20 flex flex-col h-full md:relative absolute bottom-0 left-0 w-full z-40">
          <div className="p-4 border-b border-outline-variant/20 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-error animate-ping" />
              <h2 className="text-label-md font-label-md text-on-surface font-bold uppercase tracking-widest">Live Activity</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-stack-md flex flex-col gap-stack-sm">
            {ALERTS.map((alert, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border border-outline-variant/10 hover:border-secondary/30 transition-colors group ${
                  alert.type === 'Alert'
                    ? 'bg-surface-container-high'
                    : alert.type === 'Action'
                    ? 'bg-surface-container-high border-l-2 border-l-secondary'
                    : 'bg-surface-container'
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className={`text-label-sm font-label-sm ${alert.type === 'Alert' ? 'text-on-surface-variant' : alert.type === 'Action' ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {alert.time}
                  </span>
                  <span className={`text-label-sm font-label-sm uppercase ${
                    alert.type === 'Alert' ? 'text-error' : alert.type === 'Action' ? 'text-secondary' : 'text-on-surface-variant'
                  }`}>
                    {alert.label}
                  </span>
                </div>
                <p className="text-body-md font-body-md text-on-surface">{alert.message}</p>
                <p className="text-label-sm font-label-sm text-on-surface-variant mt-2">{alert.node}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container/90 backdrop-blur-xl border-t border-outline-variant/20 shadow-lg">
        <a className="flex flex-col items-center justify-center bg-secondary-container/20 text-secondary rounded-xl px-3 py-1 scale-90 transition-all duration-200" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
          <span className="text-label-sm font-label-sm">Home</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-secondary transition-colors" href="#">
          <span className="material-symbols-outlined">videocam</span>
          <span className="text-label-sm font-label-sm">Live Feeds</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-secondary transition-colors" href="#">
          <span className="material-symbols-outlined">history</span>
          <span className="text-label-sm font-label-sm">Archives</span>
        </a>
        <a className="flex flex-col items-center justify-center text-on-surface-variant/70 hover:text-secondary transition-colors relative" href="#">
          <span className="material-symbols-outlined">notifications_active</span>
          <span className="text-label-sm font-label-sm">Alerts</span>
          <div className="absolute top-0 right-1 w-2 h-2 bg-error rounded-full" />
        </a>
      </nav>
    </div>
  );
}
