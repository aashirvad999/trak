'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Router Boundary Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6 text-zinc-300 font-mono">
      <div className="max-w-md w-full bg-cardbg border border-rose-500/50 rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="p-3 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wider mb-2">
          Telemetry Stream Reset Required
        </h2>
        <p className="text-xs text-zinc-400 font-sans mb-6">
          A temporary operational telemetry interruption occurred. Please click below to reset the corridor state loop.
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/80 hover:bg-cyan-900 transition-colors font-medium text-xs cursor-pointer shadow-lg"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Corridor Telemetry</span>
        </button>
      </div>
    </div>
  );
}
