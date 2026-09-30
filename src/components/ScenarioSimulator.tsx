'use client';

import { ScenarioPreset, AdvisoryAction, Train } from '@/types/railway';
import { Sliders, Zap, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Play, Pause, ChevronRight, GitMerge } from 'lucide-react';
import { railwayAudio } from '@/lib/audio';

interface ScenarioSimulatorProps {
  currentScenario: ScenarioPreset;
  onApplyScenario: (preset: ScenarioPreset) => void;
  slackBufferMins: number;
  onSlackChange: (val: number) => void;
  simSpeedMultiplier: number;
  onSimSpeedChange: (val: number) => void;
  isPaused: boolean;
  onTogglePause: () => void;
  trains: Train[];
  activeAdvisory: AdvisoryAction | null;
  onApplyAdvisory: (advisory: AdvisoryAction) => void;
}

export default function ScenarioSimulator({
  currentScenario,
  onApplyScenario,
  slackBufferMins,
  onSlackChange,
  simSpeedMultiplier,
  onSimSpeedChange,
  isPaused,
  onTogglePause,
  trains,
  activeAdvisory,
  onApplyAdvisory,
}: ScenarioSimulatorProps) {
  const isConvergence = currentScenario === 'CONVERGENCE_CONFLICT';
  const isEngineDefect = currentScenario === 'ENGINE_DEFECT';
  const isSlackRecovery = currentScenario === 'SLACK_RECOVERY';

  // Dynamic SVG Points generation based on current scenario
  const getGraphPoints = () => {
    if (isConvergence) {
      // Spike at km 320 (Convergence Point)
      return {
        line: '0,95 100,94 200,90 280,85 320,30 380,50 400,60',
        fill: '0,95 100,94 200,90 280,85 320,30 380,50 400,60 400,100 0,100',
        stroke: '#f43f5e',
      };
    }
    if (isEngineDefect) {
      // Steep surge at Tundla (KM 205) cascading downstream
      return {
        line: '0,92 100,90 205,25 260,45 320,60 380,70 400,75',
        fill: '0,92 100,90 205,25 260,45 320,60 380,70 400,75 400,100 0,100',
        stroke: '#fbbf24',
      };
    }
    // Nominal / Slack Recovery baseline
    return {
      line: '0,95 80,94 150,92 220,93 300,92 360,94 400,95',
      fill: '0,95 80,94 150,92 220,93 300,92 360,94 400,95 400,100 0,100',
      stroke: '#10b981',
    };
  };

  const points = getGraphPoints();

  return (
    <section className="col-span-12 lg:col-span-5 bg-cardbg/80 border border-borderzinc/80 rounded-xl p-5 lg:p-6 backdrop-blur-md flex flex-col justify-between shadow-2xl">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-borderzinc/60 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60">
              <Sliders className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100">
              Incident &amp; What-If Sandbox
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isConvergence
                  ? 'bg-rose-500 animate-ping'
                  : isEngineDefect
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span
              className={`font-semibold ${
                isConvergence ? 'text-rose-400' : isEngineDefect ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isConvergence
                ? 'SW-12 Convergence Conflict'
                : isEngineDefect
                ? 'Tundla Stoppage (km 205)'
                : 'Nominal / Slack Absorbed'}
            </span>
          </div>
        </div>

        {/* 3 Practical Operational Scenarios */}
        <div className="grid grid-cols-1 gap-2 p-1.5 bg-void/80 border border-borderzinc/70 rounded-xl mb-4">
          {/* SCENARIO A */}
          <button
            onClick={() => {
              railwayAudio.playAlert();
              onApplyScenario('CONVERGENCE_CONFLICT');
            }}
            className={`py-2 px-3 text-xs font-mono rounded-lg transition-all flex items-center justify-between ${
              isConvergence
                ? 'bg-elevated/90 border-2 border-rose-500 text-rose-300 font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-rose-400" />
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-zinc-100">Simulate Convergence Conflict (km 320)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Track 2 Freight yields to 12302 Rajdhani at single-line junction</span>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 uppercase shrink-0">
              Scenario A
            </span>
          </button>

          {/* SCENARIO B */}
          <button
            onClick={() => {
              railwayAudio.playAlert();
              onApplyScenario('ENGINE_DEFECT');
            }}
            className={`py-2 px-3 text-xs font-mono rounded-lg transition-all flex items-center justify-between ${
              isEngineDefect
                ? 'bg-elevated/90 border-2 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-zinc-100">Simulate Engine Defect / Stoppage (Tundla - km 205)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Cascading headway ripple: Green ➔ Double Yellow ➔ Yellow ➔ Red</span>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/60 uppercase shrink-0">
              Scenario B
            </span>
          </button>

          {/* SCENARIO C */}
          <button
            onClick={() => {
              railwayAudio.playClick();
              onApplyScenario('SLACK_RECOVERY');
            }}
            className={`py-2 px-3 text-xs font-mono rounded-lg transition-all flex items-center justify-between ${
              isSlackRecovery
                ? 'bg-elevated/90 border-2 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col items-start text-left">
                <span className="font-bold text-zinc-100">Clear Block &amp; Absorb Slack</span>
                <span className="text-[10px] text-zinc-400 font-normal">Restores signals to Green; 12m terminal slack absorbs accumulated delay</span>
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 uppercase shrink-0">
              Scenario C
            </span>
          </button>
        </div>

        {/* Interactive Sandbox Controls (Timetable Slack Slider & Simulation Multiplier) */}
        <div className="bg-void/50 border border-borderzinc/60 rounded-xl p-3.5 mb-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span>Kanpur Terminal Recovery Slack:</span>
              <strong className="text-emerald-400 font-mono-numbers">{slackBufferMins} mins</strong>
            </span>
            <span className="text-[10px] text-zinc-500">Deducted from destination ETA delay</span>
          </div>

          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={slackBufferMins}
            onChange={(e) => onSlackChange(Number(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex items-center justify-between pt-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  railwayAudio.playClick();
                  onTogglePause();
                }}
                className="p-1 rounded bg-elevated border border-borderzinc text-zinc-300 hover:text-white"
                title={isPaused ? 'Resume Physics Clock' : 'Pause Physics Clock'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              </button>
              <span className="text-zinc-400 text-[11px]">
                {isPaused ? 'Physics Paused' : 'Live Running'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-zinc-500">Speed:</span>
              {[1, 2, 5, 10].map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    railwayAudio.playClick();
                    onSimSpeedChange(m);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                    simSpeedMultiplier === m
                      ? 'bg-elevated text-cyan-400 border border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)] font-bold'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Delay Accumulation Curve Graph */}
        <div className="bg-void/60 border border-borderzinc/60 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Real-Time Delay Accumulation Curve</span>
            </span>
            <span className="text-[10px] text-zinc-500">435 KM Corridor</span>
          </div>

          <div className="relative h-16 w-full overflow-hidden rounded bg-[#0d1117]/80 border border-zinc-800/60 p-1">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={points.stroke} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={points.stroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="25" x2="400" y2="25" stroke="#1f2433" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="#1f2433" strokeDasharray="3 3" />
              <line x1="0" y1="75" x2="400" y2="75" stroke="#1f2433" strokeDasharray="3 3" />

              {/* Polygon Area Fill */}
              <polygon points={points.fill} fill="url(#areaGradient)" />

              {/* Trend Polyline */}
              <polyline points={points.line} fill="none" stroke={points.stroke} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Dynamic AI Dispatch Advisory Panel */}
        {activeAdvisory && (
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-xl p-3.5 flex items-start gap-3 shadow-lg">
            <div className="p-1.5 rounded-lg bg-cyan-900/60 text-cyan-400 shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-cyan-200 mb-1">
                <span>Recommended Dispatch Action</span>
                <span className="text-emerald-400">{activeAdvisory.impactMinutes} mins saved</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-2">
                {activeAdvisory.actionText}
              </p>
              <button
                onClick={() => {
                  railwayAudio.playClick();
                  onApplyAdvisory(activeAdvisory);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 flex items-center gap-1 ${
                  activeAdvisory.applied
                    ? 'bg-emerald-800/80 text-white cursor-default'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold shadow-md'
                }`}
              >
                {activeAdvisory.applied ? (
                  <>
                    <span>Applied</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <span>Apply Advisory</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
