import { useEffect, useState } from 'react';
import {
  Download,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Cpu,
  Terminal,
  User as UserIcon,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { UrlInspector } from './components/media/UrlInspector';
import { MediaPreviewCard } from './components/media/MediaPreviewCard';
import { MediaInspectionResult } from './types/media';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  database: string;
  version: string;
  timestamp: string;
}

function DashboardContent() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [inspectedMedia, setInspectedMedia] = useState<MediaInspectionResult | null>(null);
  const [inspecting, setInspecting] = useState(false);

  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/v1/health');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to reach API`);
        }
        const data = await res.json();
        setHealth(data.data);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to connect to backend server');
        }
      } finally {
        setLoading(false);
      }
    }

    checkHealth();
  }, []);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                VideoDownloader
              </span>
              <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 3 Inspection
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>API Gateway Online</span>
            </div>

            {/* User Auth Navigation */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{user.role.toUpperCase()}</div>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl transition-colors"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SSRF-Safe Media Inspection Engine Active</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Inspect & Download Media Safely
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Submit an authorized media URL to extract metadata, inspect stream properties, and select output formats.
          </p>
        </div>

        {/* URL Inspection Component */}
        <UrlInspector
          onInspected={(res) => setInspectedMedia(res)}
          loading={inspecting}
          setLoading={setInspecting}
        />

        {/* Media Preview & Format Selector Card */}
        {inspectedMedia && <MediaPreviewCard media={inspectedMedia} />}

        {/* User Account / Storage Card (If Logged In) */}
        {isAuthenticated && user && (
          <div className="mt-10 mb-8 p-6 bg-slate-900/60 border border-emerald-500/20 rounded-2xl backdrop-blur flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{user.name}</h3>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="w-full md:w-64 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Storage Quota</span>
                <span className="font-mono text-emerald-400">
                  {formatBytes(user.storageUsageBytes)} / 2000 MB
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (user.storageUsageBytes / (2000 * 1024 * 1024)) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Foundation & API Healthcheck Card */}
        <div className="mt-10 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur mb-8">
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">System Foundation Healthcheck</h2>
            </div>
            {loading ? (
              <span className="text-xs text-slate-400 animate-pulse">Pinging backend...</span>
            ) : health ? (
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Connected</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Backend Offline</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center space-x-3 text-slate-400 mb-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Database Link</span>
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                {health ? health.database.toUpperCase() : 'CHECKING...'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Mongoose persistence driver</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center space-x-3 text-slate-400 mb-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium uppercase tracking-wider">Uptime</span>
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                {health ? `${health.uptimeSeconds}s` : '---'}
              </div>
              <p className="text-xs text-slate-500 mt-1">Node.js Express runtime</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
              <div className="flex items-center space-x-3 text-slate-400 mb-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-medium uppercase tracking-wider">API Version</span>
              </div>
              <div className="text-lg font-mono font-semibold text-white">
                {health ? `v${health.version}` : '---'}
              </div>
              <p className="text-xs text-slate-500 mt-1">REST API Contract v1</p>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              Connection warning: {error}. Start the backend via <code className="bg-slate-900 px-1 py-0.5 rounded">npm run dev --workspace=server</code>.
            </div>
          )}
        </div>

        {/* Feature Architecture Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60">
            <div className="flex items-center space-x-3 text-emerald-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-semibold text-white">SSRF Defense & Inspection</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every submitted media URL is filtered through pre-request DNS resolution to block private IP spaces and internal cloud metadata before inspecting content length and format headers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60">
            <div className="flex items-center space-x-3 text-emerald-400 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold text-white">Asynchronous Worker Queue</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Selected formats are submitted to background worker queues with live Socket.IO progress streaming, guaranteeing resilience against process restarts and network stalls.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        VideoDownloader &bull; Built strictly to PRD specifications &bull; Phase 3 Media Inspection Active
      </footer>

      {/* Login & Register Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
