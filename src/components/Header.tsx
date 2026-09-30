'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX, Cpu, Clock } from 'lucide-react';

interface HeaderProps {
  avgVelocityKmH?: number;
  corridorSaturationPct?: number;
  normalBlocksCount?: number;
  totalBlocksCount?: number;
  isMuted: boolean;
  onToggleSound: () => void;
}

export default function Header({
  isMuted,
  onToggleSound,
}: HeaderProps) {
  const [istTime, setIstTime] = useState<string>('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // IST is UTC + 5:30
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utc + 3600000 * 5.5);
      const h = String(istDate.getHours()).padStart(2, '0');
      const m = String(istDate.getMinutes()).padStart(2, '0');
      const s = String(istDate.getSeconds()).padStart(2, '0');
      setIstTime(`${h}:${m}:${s}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative w-full bg-cardbg/90 border border-borderzinc/80 rounded-xl px-5 py-3.5 backdrop-blur-md overflow-hidden shadow-2xl flex flex-wrap items-center justify-between gap-4">
      {/* Sleek Hairline Track in Header with gliding train SVG */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-borderzinc/40 overflow-hidden">
        <div className="w-full h-full relative">
          <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-loco-loop opacity-80" />
        </div>
      </div>

      {/* Brand & Sector Identification */}
      <div className="flex items-center gap-4">
        {/* Centered Train Logo with Visible Rotating Wheels & Scrolling Track Bed */}
        <div className="relative flex items-center justify-center h-10 w-28 bg-void/90 border border-borderzinc/80 rounded-lg overflow-hidden shadow-inner px-1">
          {/* Continuously Scrolling Track Bed under the Wheels */}
          <div className="absolute inset-x-0 bottom-1.5 h-2.5 bg-[#0d1117] border-y border-zinc-700/80 pointer-events-none flex items-center overflow-hidden">
            {/* Scrolling Wooden/Concrete Sleepers */}
            <div
              className="absolute inset-0 opacity-70 animate-scroll-track"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  to right,
                  rgba(255, 255, 255, 0.28) 0px,
                  rgba(255, 255, 255, 0.28) 2.5px,
                  transparent 2.5px,
                  transparent 8px
                )`,
              }}
            />
            {/* Top Steel Rail Highlight */}
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-200 shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          </div>

          {/* Centered Locomotive Body with Suspension Vibration & Rotating Wheels */}
          <div className="relative z-10 flex items-center justify-center animate-train-vibrate pb-1">
            <svg
              className="w-20 h-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              viewBox="0 0 120 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Aerodynamic Locomotive Main Body Silhouette */}
              <path
                d="M115 30 C96 30, 78 25, 58 16 C44 10, 28 10, 4 10 L4 32 L115 32 Z"
                fill="#12141d"
                stroke="#333748"
                strokeWidth="1.2"
              />
              {/* Vande Bharat Cyan Streamline Swoosh */}
              <path
                d="M112 30 C94 30, 76 25, 58 17 C46 12, 30 12, 4 12 L4 17 C30 17, 46 17, 58 21 C76 27, 94 30, 112 30 Z"
                fill="#06b6d4"
              />
              {/* Saffron Accent Stripe */}
              <path
                d="M115 30 C100 30, 84 27, 66 20 L64 22 C82 28, 98 31, 115 31 Z"
                fill="#f97316"
              />
              {/* Cockpit / Passenger Windows */}
              <path
                d="M86 18 C76 15, 66 13, 54 12 L56 16 C66 17, 74 19, 84 21 Z"
                fill="#38bdf8"
                fillOpacity="0.9"
              />
              {/* Headlight Lens */}
              <circle cx="112" cy="28.5" r="2" fill="#fef08a" />
              <circle cx="112" cy="28.5" r="3.5" fill="#fef08a" fillOpacity="0.3" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-wider text-zinc-100">
            <span className="text-cyan-400">Trak</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>GZB–CNB Quad Trunk Corridor</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Bar */}
      <div className="hidden lg:flex items-center gap-6 font-mono text-xs text-zinc-400 bg-void/50 border border-borderzinc/60 px-4 py-1.5 rounded-lg">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-500">Trunk Line 1:</span>
          <span className="text-zinc-200 font-medium">UP/DN Quad</span>
        </div>
      </div>

      {/* Clock & Sound Control */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-elevated/80 border border-borderzinc/70 px-3 py-1.5 rounded-md">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-zinc-500 uppercase text-[10px] tracking-wider">IST</span>
          <span className="font-mono-numbers font-medium text-zinc-100">{istTime}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90" title="Time Synchronized" />
        </div>

        <button
          onClick={onToggleSound}
          className={`p-2 rounded-md border transition ${
            !isMuted
              ? 'bg-cyan-950/70 border-cyan-800/80 text-cyan-300'
              : 'bg-elevated border-borderzinc/80 text-zinc-400 hover:text-zinc-200'
          }`}
          title={isMuted ? 'Unmute Audio Beacons' : 'Mute Audio Beacons'}
        >
          {!isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
