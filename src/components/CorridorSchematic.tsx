'use client';

import { motion } from 'framer-motion';
import { Station, SignalingBlock, Train } from '@/types/railway';
import { TrainFront, Zap, GitMerge } from 'lucide-react';
import { railwayAudio } from '@/lib/audio';
import { getSwitchPointStatus } from '@/lib/physics';

interface CorridorSchematicProps {
  stations: Station[];
  blocks: SignalingBlock[];
  trains: Train[];
  onSelectBlock: (block: SignalingBlock) => void;
  onSelectStation: (station: Station) => void;
  onSelectTrain: (train: Train) => void;
  scenarioPreset?: string;
}

export default function CorridorSchematic({
  stations,
  blocks,
  trains,
  onSelectBlock,
  onSelectStation,
  onSelectTrain,
  scenarioPreset = 'NORMAL',
}: CorridorSchematicProps) {
  const upBlocks = blocks.filter((b) => b.line === 'UP');

  // Convert kilometer position (0 - 435km) to percentage (0% - 100%)
  const kmToPercent = (km: number) => {
    const minKm = 0;
    const maxKm = 435;
    const pct = ((km - minKm) / (maxKm - minKm)) * 100;
    return Math.max(2, Math.min(96, pct));
  };

  const getAspectColorClass = (block: SignalingBlock) => {
    if (block.isSignalFaulty || block.aspect === 'RED') {
      return 'bg-rose-500/80 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]';
    }
    if (block.aspect === 'YELLOW') {
      return 'bg-amber-400/80 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
    }
    if (block.aspect === 'DOUBLE_YELLOW') {
      return 'bg-yellow-400/80 border-yellow-300 shadow-[0_0_8px_rgba(234,179,8,0.4)]';
    }
    return 'bg-emerald-500/60 border-emerald-400/80';
  };

  // Switch SW-12 Status at km 320
  const switchStatus = getSwitchPointStatus(trains, scenarioPreset as any);
  const isSwitchLocked = switchStatus.isLocked;

  // Group trains by track line (strictly mutually exclusive)
  const track1Trains = trains.filter((t) => t.priority < 3 && !t.number.includes('BOXN'));
  const track2Trains = trains.filter((t) => t.priority === 3 || t.number.includes('BOXN'));

  return (
    <section className="w-full bg-cardbg/80 border border-borderzinc/80 rounded-xl p-5 lg:p-6 backdrop-blur-md flex flex-col justify-between shadow-2xl relative overflow-hidden">
      {/* Schematic Header */}
      <div className="flex items-center justify-between pb-4 border-b border-borderzinc/60 mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            <TrainFront className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-mono text-xs font-semibold tracking-wider text-zinc-100 uppercase flex items-center gap-2">
              Corridor Digital Twin Schematic (Dual-to-Single Bottleneck Topology)
            </h2>
            <span className="text-zinc-500 text-xs font-mono">
              435 KM Delhi–Kanpur Corridor • Track 1 &amp; 2 Convergence at SW-12 (km 320)
            </span>
          </div>
        </div>

        {/* SW-12 Interlocking Status Badge */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono transition-all ${
              isSwitchLocked
                ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.7)] animate-pulse'
                : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
            }`}
          >
            <GitMerge className={`w-3.5 h-3.5 ${isSwitchLocked ? 'text-rose-400' : 'text-emerald-400'}`} />
            <span className="font-semibold">Switch SW-12 (km 320):</span>
            <span>{isSwitchLocked ? 'LOCKED (Interlocking Precedence Halt)' : 'CLEAR (Merged Single Line)'}</span>
          </div>

          <div className="flex items-center gap-1 text-xs text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Telemetry (1.5s refresh)</span>
          </div>
        </div>
      </div>

      {/* Main Track View Canvas Box */}
      <div className="relative w-full py-10 px-4 sm:px-6 bg-void/70 border border-borderzinc/60 rounded-xl bg-rail-grid overflow-x-auto">
        {/* Distance Tick Marks */}
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mb-6 px-1 border-b border-borderzinc/40 pb-1">
          <span>0 KM (NDLS)</span>
          <span>100 KM</span>
          <span>200 KM (TDL)</span>
          <span className="text-amber-400 font-bold">320 KM (SW-12 Merge)</span>
          <span>435 KM (CNB Yard)</span>
        </div>

        <div className="space-y-16 relative my-4">
          {/* TRACK 1 (FAST LINE - 0 to 435 KM) */}
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                TRACK 1 (FAST LINE) <span className="text-zinc-600 font-light">/</span> NDLS ➔ CNB (0–435 KM)
              </span>
              <span className="text-[10px] text-zinc-500">Continuous Trunk Rail</span>
            </div>

            {/* Track 1 Container */}
            <div className="relative w-full h-6 flex items-center my-2 rounded-sm overflow-hidden border-y border-zinc-600/80 shadow-inner bg-[#0d1117]">
              {/* Sleeper Linear Gradient */}
              <div
                className="absolute inset-0 opacity-70 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    to right,
                    rgba(255, 255, 255, 0.18) 0px,
                    rgba(255, 255, 255, 0.18) 2px,
                    transparent 2px,
                    transparent 10px
                  )`,
                }}
              />

              {/* Steel Rails */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />

              {/* Interactive Signal Blocks */}
              <div className="relative h-full w-full flex items-center z-0">
                {upBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => {
                      railwayAudio.playClick();
                      onSelectBlock(block);
                    }}
                    title={`${block.id} (${block.startKm}-${block.endKm} km): Aspect ${block.aspect}`}
                    className={`h-full flex-1 border-r border-zinc-700/50 transition-all hover:brightness-125 cursor-pointer relative ${getAspectColorClass(
                      block
                    )}`}
                  />
                ))}
              </div>
            </div>

            {/* Track 1 Trains */}
            {track1Trains.map((train) => {
              const leftPct = kmToPercent(train.positionKm);
              return (
                <motion.div
                  key={train.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto transition-all duration-1000 ease-linear z-20 group cursor-pointer"
                  initial={{ left: `${leftPct}%` }}
                  animate={{ left: `${leftPct}%` }}
                  transition={{ duration: 1.2, ease: 'linear' }}
                  onClick={() => {
                    railwayAudio.playClick();
                    onSelectTrain(train);
                  }}
                >
                  {/* ABOVE: Train Number & Name Tag */}
                  <div className="flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-xs whitespace-nowrap shadow-sm hover:scale-105 transition-transform">
                    <span className="font-mono text-[10px] font-bold text-zinc-100">
                      {train.number}
                    </span>
                    {train.shortName && train.shortName.replace(train.number, '').trim() !== '' && (
                      <span className="text-[10px] font-medium text-zinc-400">
                        {train.shortName.replace(train.number, '').trim()}
                      </span>
                    )}
                  </div>

                  {/* CENTER: Track-Centered Train Dot */}
                  <div className="relative flex items-center justify-center">
                    {train.currentSpeedKmH > 0 && (
                      <span
                        className={`absolute w-4 h-4 rounded-full opacity-75 animate-ping ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    )}
                    <span
                      className={`relative w-3 h-3 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                        train.status === 'HALTED'
                          ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                          : train.status === 'CAUTION'
                          ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                          : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                      }`}
                    />
                  </div>

                  {/* BELOW: Dynamic Speed & Dynamic Delay */}
                  <div className="mt-1 flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-950/80 border border-zinc-800/60 backdrop-blur-xs whitespace-nowrap">
                    <span className="font-mono text-[9px] text-zinc-300">
                      {Math.round(train.currentSpeedKmH)} <span className="text-zinc-500">km/h</span>
                    </span>
                    {train.netDelayMins > 0 ? (
                      <span className="text-[9px] font-mono font-semibold px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        +{train.netDelayMins}m
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/10 text-emerald-400">
                        RT
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* TURNOUT CROSSOVER SW-12 VISUAL SVG (at 75% / km 320) */}
          <div className="relative h-12 w-full my-[-24px] pointer-events-none">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 48" preserveAspectRatio="none">
              {/* Angled turnout track from Track 2 at x=735 to Track 1 at x=745 */}
              <path
                d="M 730 40 L 750 8"
                stroke={isSwitchLocked ? '#f43f5e' : '#06b6d4'}
                strokeWidth="2.5"
                strokeDasharray={isSwitchLocked ? '4 3' : 'none'}
                fill="none"
              />
              <circle
                cx="740"
                cy="24"
                r="5"
                fill={isSwitchLocked ? '#f43f5e' : '#10b981'}
                stroke="#0d1117"
                strokeWidth="2"
              />
            </svg>
            <div
              className={`absolute top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap backdrop-blur-md border shadow-md flex items-center gap-1 z-30 ${
                isSwitchLocked
                  ? 'bg-rose-950/95 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse'
                  : 'bg-zinc-950/90 border-cyan-800/80 text-cyan-300'
              }`}
              style={{ left: '73.5%' }}
            >
              <GitMerge className="w-3 h-3 text-cyan-400" />
              <span>SW-12 Turnout (km 320)</span>
            </div>
          </div>

          {/* TRACK 2 (SLOW LINE - 0 to 320 KM, Converges into Track 1) */}
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                TRACK 2 (SLOW / FREIGHT LINE) <span className="text-zinc-600 font-light">/</span> NDLS ➔ SW-12 MERGE (0–320 KM)
              </span>
              <span className="text-[10px] text-amber-400 font-semibold">Merges into Track 1 at km 320</span>
            </div>

            {/* Track 2 Container (Ends at 74% width / km 320) */}
            <div className="relative w-full h-6 flex items-center my-2 rounded-sm overflow-hidden border-y border-zinc-600/80 shadow-inner bg-[#0d1117]">
              {/* Active Track 2 Portion up to 74% */}
              <div className="absolute top-0 bottom-0 left-0 w-[74%] flex items-center overflow-hidden border-r-2 border-amber-400/80">
                <div
                  className="absolute inset-0 opacity-70 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      to right,
                      rgba(255, 255, 255, 0.18) 0px,
                      rgba(255, 255, 255, 0.18) 2px,
                      transparent 2px,
                      transparent 10px
                    )`,
                  }}
                />
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-300/90 pointer-events-none z-10" />
                <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-zinc-300/90 pointer-events-none z-10" />

                <div className="relative h-full w-full flex items-center z-0">
                  {upBlocks.slice(0, 7).map((block) => (
                    <button
                      key={`tr2-${block.id}`}
                      onClick={() => {
                        railwayAudio.playClick();
                        onSelectBlock(block);
                      }}
                      title={`${block.id}: Aspect ${block.aspect}`}
                      className={`h-full flex-1 border-r border-zinc-700/50 transition-all hover:brightness-125 cursor-pointer relative ${getAspectColorClass(
                        block
                      )}`}
                    />
                  ))}
                </div>
              </div>

              {/* Merged Zone Hatching beyond 74% */}
              <div className="absolute top-0 bottom-0 right-0 left-[74%] bg-zinc-950/90 flex items-center justify-center text-[10px] font-mono text-zinc-600 italic">
                <span>[ Single Common Bottleneck Track Above ]</span>
              </div>
            </div>

            {/* Track 2 Trains */}
            {track2Trains.map((train) => {
              const leftPct = kmToPercent(train.positionKm);
              return (
                <motion.div
                  key={train.id}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto transition-all duration-1000 ease-linear z-20 group cursor-pointer"
                  initial={{ left: `${leftPct}%` }}
                  animate={{ left: `${leftPct}%` }}
                  transition={{ duration: 1.2, ease: 'linear' }}
                  onClick={() => {
                    railwayAudio.playClick();
                    onSelectTrain(train);
                  }}
                >
                  {/* ABOVE: Train Number & Name Tag */}
                  <div className="flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-xs whitespace-nowrap shadow-sm hover:scale-105 transition-transform">
                    <span className="font-mono text-[10px] font-bold text-zinc-100">
                      {train.number}
                    </span>
                    {train.shortName && train.shortName.replace(train.number, '').trim() !== '' && (
                      <span className="text-[10px] font-medium text-zinc-400">
                        {train.shortName.replace(train.number, '').trim()}
                      </span>
                    )}
                  </div>

                  {/* CENTER: Track-Centered Train Dot */}
                  <div className="relative flex items-center justify-center">
                    {train.currentSpeedKmH > 0 && (
                      <span
                        className={`absolute w-4 h-4 rounded-full opacity-75 animate-ping ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                      />
                    )}
                    <span
                      className={`relative w-3 h-3 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                        train.status === 'HALTED'
                          ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                          : train.status === 'CAUTION'
                          ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                          : 'bg-emerald-400 shadow-[0_0_10px_#34d399]'
                      }`}
                    />
                  </div>

                  {/* BELOW: Dynamic Speed & Dynamic Delay */}
                  <div className="mt-1 flex items-center gap-1 px-1.5 py-0.2 rounded bg-zinc-950/80 border border-zinc-800/60 backdrop-blur-xs whitespace-nowrap">
                    <span className="font-mono text-[9px] text-zinc-300">
                      {Math.round(train.currentSpeedKmH)} <span className="text-zinc-500">km/h</span>
                    </span>
                    {train.netDelayMins > 0 ? (
                      <span className="text-[9px] font-mono font-semibold px-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        +{train.netDelayMins}m
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/10 text-emerald-400">
                        RT
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Station Markers across the Corridor */}
        <div className="relative w-full flex justify-between items-center pt-8 border-t border-borderzinc/50 mt-10">
          {stations.map((stn) => {
            const isFaultNear = blocks.some(
              (b) => b.isSignalFaulty && Math.abs(b.startKm - stn.distanceKm) < 50
            );
            return (
              <button
                key={stn.id}
                onClick={() => {
                  railwayAudio.playClick();
                  onSelectStation(stn);
                }}
                className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-110"
              >
                <span
                  className={`w-3 h-3 rounded-full mb-1.5 transition-colors ${
                    isFaultNear
                      ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-ping'
                      : stn.isMajorJunction
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                      : 'bg-zinc-500 group-hover:bg-zinc-300'
                  }`}
                />
                <span
                  className={`font-mono text-xs font-bold tracking-tight ${
                    stn.isMajorJunction ? 'text-zinc-100' : 'text-zinc-400'
                  }`}
                >
                  {stn.code}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{stn.distanceKm} KM</span>

                {stn.slackBufferMins > 0 && (
                  <span className="text-[9px] font-mono text-emerald-400 mt-0.5 px-1 rounded bg-emerald-950/60 border border-emerald-800/40">
                    +{stn.slackBufferMins}m Slack
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
