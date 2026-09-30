'use client';

import { useState } from 'react';
import { ScenarioPreset, AdvisoryAction, Train } from '@/types/railway';
import { Sliders, Zap, AlertTriangle, CheckCircle, RefreshCw, Sparkles, Play, Pause, ChevronRight } from 'lucide-react';
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
  const isSignalFail = currentScenario === 'SIGNAL_FAIL';
  const isTSR = currentScenario === 'TSR';

  // Calculate max delay among trains to plot dynamic graph curve
  const maxNetDelay = Math.max(...trains.map((t) => t.netDelayMins), 0);
  const maxRawDelay = Math.max(...trains.map((t) => t.rawDelayMins), 0);

  // Dynamic SVG Points generation based on current scenario
  const getGraphPoints = () => {
    if (isSignalFail) {
      // Steep spike at ALJN (KM 130) cascading downstream to CNB
      return {
        line: '0,90 80,88 120,25 180,35 240,48 300,58 400,65',
        fill: '0,90 80,88 120,25 180,35 240,48 300,58 400,65 400,100 0,100',
        stroke: '#f43f5e',
      };
    }
    if (isTSR) {
      // Moderate surge starting at TDL (KM 205)
      return {
        line: '0,92 100,90 180,85 240,45 300,55 360,65 400,72',
        fill: '0,92 100,90 180,85 240,45 300,55 360,65 400,72 400,100 0,100',
        stroke: '#fbbf24',
      };
    }
    // Nominal running (flat minimal baseline)
    return {
      line: '0,95 80,94 150,92 220,93 300,92 360,94 400,95',
      fill: '0,95 80,94 150,92 220,93 300,92 360,94 400,95 400,100 0,100',
      stroke: '#06b6d4',
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
              Scenario Simulator (Jury Sandbox)
            </h3>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                isSignalFail
                  ? 'bg-rose-500 animate-ping'
                  : isTSR
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400'
              }`}
            />
            <span
              className={`font-semibold ${
                isSignalFail ? 'text-rose-400' : isTSR ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {isSignalFail ? 'Signal Failure' : isTSR ? 'TSR 30 Active' : 'Nominal Clear'}
            </span>
          </div>
        </div>

        {/* 3 Quick Interactive Preset Triggers (Border Highlight Design) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-void/80 border border-borderzinc/70 rounded-xl mb-4">
          <button
            onClick={() => {
              railwayAudio.playAlert();
              onApplyScenario('SIGNAL_FAIL');
            }}
            className={`py-2 px-2 text-xs font-mono rounded-lg transition-all flex flex-col items-center gap-1 ${
              isSignalFail
                ? 'bg-elevated/90 border-2 border-rose-500 text-rose-400 font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)] scale-105'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Signal Fail (ALJN)</span>
          </button>

          <button
            onClick={() => {
              railwayAudio.playAlert();
              onApplyScenario('TSR');
            }}
            className={`py-2 px-2 text-xs font-mono rounded-lg transition-all flex flex-col items-center gap-1 ${
              isTSR
                ? 'bg-elevated/90 border-2 border-amber-400 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>TSR 30 km/h (TDL)</span>
          </button>

          <button
            onClick={() => {
              railwayAudio.playClick();
              onApplyScenario('NORMAL');
            }}
            className={`py-2 px-2 text-xs font-mono rounded-lg transition-all flex flex-col items-center gap-1 ${
              currentScenario === 'NORMAL'
                ? 'bg-elevated/90 border-2 border-emerald-400 text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.4)] scale-105'
                : 'hover:bg-elevated text-zinc-400 hover:text-zinc-200 border border-transparent'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Normal Clear</span>
          </button>
        </div>

        {/* Interactive Sandbox Controls (Timetable Slack Slider & Simulation Multiplier) */}
        <div className="bg-void/50 border border-borderzinc/60 rounded-xl p-3.5 mb-4 space-y-3">
          <div className="flex items-center justify-between font-mono text-xs text-zinc-300">
            <span className="flex items-center gap-1.5">
              <span>Timetable Buffer Slack:</span>
              <strong className="text-emerald-400 font-mono-numbers">{slackBufferMins} mins</strong>
            </span>
            <span className="text-[10px] text-zinc-500">Subtracted from downstream raw delay</span>
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
                      : 'bg-void text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Cascading Impact Sparkline SVG Chart */}
        <div className="bg-void/60 border border-borderzinc/60 rounded-xl p-4 mb-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
              <span>Cascading Delay Projection Curve</span>
            </span>
            <div className="flex items-center gap-3 font-mono text-xs font-mono-numbers">
              <span className="text-zinc-500 text-[10px]">
                Raw: <strong className="text-zinc-300">+{maxRawDelay.toFixed(1)}m</strong>
              </span>
              <span className={`font-semibold ${maxNetDelay > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                Net: +{maxNetDelay.toFixed(1)} min
              </span>
            </div>
          </div>

          {/* SVG Trend Graph */}
          <div className="relative h-24 w-full my-2">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={points.stroke} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={points.stroke} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Reference Grid Lines */}
              <line x1="0" y1="50" x2="400" y2="50" stroke="#232633" strokeDasharray="3 3" strokeWidth="0.8" />
              <line x1="0" y1="20" x2="400" y2="20" stroke="#232633" strokeDasharray="2 2" strokeWidth="0.6" />

              {/* Fill Gradient Area */}
              <polygon points={points.fill} fill="url(#trendGradient)" className="transition-all duration-700" />

              {/* Smooth Animated Line */}
              <polyline
                points={points.line}
                fill="none"
                stroke={points.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-700"
              />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 pt-1 border-t border-borderzinc/40">
            <span>NDLS</span>
            <span>GZB</span>
            <span>ALJN</span>
            <span>TDL</span>
            <span>ETW</span>
            <span>CNB</span>
          </div>
        </div>

        {/* AI Resolver Advisory Panel */}
        {activeAdvisory && (
          <div
            className={`border p-3.5 rounded-xl flex items-center justify-between text-xs font-mono gap-3 transition-all ${
              activeAdvisory.applied
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles
                className={`w-4 h-4 shrink-0 ${
                  activeAdvisory.applied ? 'text-emerald-400' : 'text-cyan-400 animate-pulse'
                }`}
              />
              <div className="flex flex-col">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-cyan-400">
                  AI Resolver Operational Advisory
                </span>
                <span className="text-zinc-200 text-xs font-sans mt-0.5">
                  {activeAdvisory.actionText}
                </span>
              </div>
            </div>

            <button
              disabled={activeAdvisory.applied}
              onClick={() => {
                railwayAudio.playChime(1046.5, 'sine', 0.08, 0.2);
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
        )}
      </div>
    </section>
  );
}
