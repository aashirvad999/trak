import Link from 'next/link';
import { TrainFront, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6 text-zinc-300 font-mono">
      <div className="max-w-md w-full bg-cardbg border border-borderzinc rounded-xl p-6 shadow-2xl flex flex-col items-center text-center">
        <div className="p-3 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 mb-4">
          <TrainFront className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-100 uppercase tracking-wider mb-2">
          404 - Corridor Segment Not Found
        </h2>
        <p className="text-xs text-zinc-400 font-sans mb-6">
          The requested station or block monitor route does not exist on the Delhi–Kanpur quad trunk line.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-700/80 hover:bg-cyan-900 transition-colors font-medium text-xs cursor-pointer shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Corridor Master Control</span>
        </Link>
      </div>
    </div>
  );
}
