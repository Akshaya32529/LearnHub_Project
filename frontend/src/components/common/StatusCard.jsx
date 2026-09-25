import React, { useState, useEffect } from 'react';
import { checkHealth } from '../../services/healthService';
import { useAppStore } from '../../store/useAppStore';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Database,
  Monitor,
  Clock,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

export default function StatusCard() {
  const [loading, setLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState(null);
  const [error, setError] = useState(null);
  const setBackendStatus = useAppStore((state) => state.setBackendStatus);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await checkHealth();
      setBackendHealth(data);
      setBackendStatus('Connected', data);
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err.message || 'Failed to connect to backend server');
      setBackendStatus('Disconnected', null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const apiUrl = import.meta.env.VITE_API_URL || 'https://learnhub-project-1-xu2q.onrender.com/api';

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">System Integration Status</span>
          <h2 className="text-xl font-bold tracking-tight">Full-Stack Connectivity Monitor</h2>
          <p className="text-xs text-slate-300 mt-1">Live health verification between React Frontend and Express Backend</p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white backdrop-blur-sm border border-white/10 transition-all duration-200 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Testing...' : 'Retest Health'}
        </button>
      </div>

      {/* Status Indicators Grid */}
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Status */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
              <Monitor className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Frontend Client</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Running
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">React + Vite</p>
              <p className="text-xs text-slate-500 mt-0.5">SPA client active on port 5173 with Tailwind CSS</p>
            </div>
          </div>

          {/* Backend Status */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex items-start space-x-4">
            <div className={`p-3 rounded-lg ${
              loading
                ? 'bg-amber-100 text-amber-600'
                : backendHealth
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-rose-100 text-rose-600'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Backend Server</span>
                {loading ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Checking...
                  </span>
                ) : backendHealth ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    Disconnected
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-slate-900 mt-1">Express REST API</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: <code className="bg-slate-200/70 px-1 py-0.5 rounded text-[11px] text-slate-700">{apiUrl}/health</code>
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Backend Response Card */}
        {backendHealth && (
          <div className="mt-6 bg-slate-50/80 rounded-xl p-5 border border-slate-200/90 text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Server className="w-4 h-4 text-brand-600" />
                Live API Response (/api/health)
              </span>
              <a
                href={`${apiUrl}/health`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
              >
                Open in browser <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium">Platform</span>
                <span className="font-semibold text-slate-800 text-sm">{backendHealth.platform}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-500" /> MongoDB Status
                </span>
                <span className="font-semibold text-slate-800 text-sm capitalize">
                  {backendHealth.database?.isConnected ? (
                    <span className="text-emerald-600 flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Connected ({backendHealth.database?.databaseName || 'learnhub_db'})
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> {backendHealth.database?.state || 'Standby'}
                    </span>
                  )}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-400 block font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" /> Server Uptime
                </span>
                <span className="font-semibold text-slate-800 text-sm">
                  {backendHealth.uptime} ({backendHealth.environment})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {error && (
          <div className="mt-6 bg-rose-50 border border-rose-200 rounded-xl p-5 text-rose-800 text-sm">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-900">Backend Connection Error</h4>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
                <div className="mt-3 text-xs bg-white/70 p-3 rounded-lg border border-rose-200 text-slate-700 space-y-1">
                  <p className="font-semibold text-slate-800">To start the backend server:</p>
                  <p><code>cd backend</code></p>
                  <p><code>npm run dev</code></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
