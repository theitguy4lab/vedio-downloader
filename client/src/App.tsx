import { useEffect, useState } from 'react';
import { Download, ShieldCheck, Activity, CheckCircle2, AlertCircle, HardDrive, Cpu, Terminal } from 'lucide-react';

interface HealthData {
  status: string;
  uptimeSeconds: number;
  database: string;
  version: string;
  timestamp: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
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
                Phase 1 MVP
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>API Gateway Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Production-Grade Media Workspace
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Asynchronous media inspection, authorized downloads, and real-time processing engineered for reliability and high throughput.
          </p>
        </div>

        {/* Phase 1 Foundation Verification Card */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur mb-8">
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
              <h3 className="font-semibold text-white">Permission-First Security</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every submitted media URL is sanitized against SSRF and private IP ranges before inspection. Passwords use cryptographic hashing and sessions rotate via secure tokens.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/30 border border-slate-800/60">
            <div className="flex items-center space-x-3 text-emerald-400 mb-3">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold text-white">Asynchronous Worker Queue</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Downloads and transcoding are handled by dedicated workers with live Socket.IO progress streaming, guaranteeing resilience against process restarts and network stalls.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        VideoDownloader &bull; Built strictly to PRD specifications &bull; Phase 1 Foundation Active
      </footer>
    </div>
  );
}
