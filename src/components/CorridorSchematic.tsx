'use client';

import { motion } from 'framer-motion';
import { Station, SignalingBlock, Train } from '@/types/railway';
import { TrainFront, Zap } from 'lucide-react';
import { railwayAudio } from '@/lib/audio';

interface CorridorSchematicProps {
  stations: Station[];
  blocks: SignalingBlock[];
  trains: Train[];
  onSelectBlock: (block: SignalingBlock) => void;
  onSelectStation: (station: Station) => void;
  onSelectTrain: (train: Train) => void;
}

export default function CorridorSchematic({
  stations,
  blocks,
  trains,
  onSelectBlock,
  onSelectStation,
  onSelectTrain,
}: CorridorSchematicProps) {
  const upBlocks = blocks.filter((b) => b.line === 'UP');
  const dnBlocks = blocks.filter((b) => b.line === 'DOWN');

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

  // Sorted trains for headway separation bridge calculation
  const upTrains = trains
    .filter((t) => t.line === 'UP')
    .sort((a, b) => a.positionKm - b.positionKm);
  const dnTrains = trains
    .filter((t) => t.line === 'DOWN')
    .sort((a, b) => b.positionKm - a.positionKm);

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
              Corridor Digital Twin Schematic
            </h2>
            <span className="text-zinc-500 text-xs font-mono">
              435 KM Delhi–Kanpur Block Trunk Line
            </span>
          </div>
        </div>

        {/* Telemetry Badge */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-cyan-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Telemetry (1.5s refresh)</span>
          </div>
        </div>
      </div>

      {/* Main Track View Canvas Box */}
      <div className="relative w-full py-10 px-4 sm:px-6 bg-void/70 border border-borderzinc/60 rounded-xl bg-rail-grid">
        {/* Distance Tick Marks */}
        <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 mb-6 px-1 border-b border-borderzinc/40 pb-1">
          <span>0 KM (NDLS)</span>
          <span>100 KM</span>
          <span>200 KM (TDL)</span>
          <span>300 KM</span>
          <span>435 KM (CNB)</span>
        </div>

        <div className="space-y-14 relative my-2">
          {/* UP LINE (NDLS -> CNB) */}
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                UP LINE <span className="text-zinc-600 font-light">/</span> NDLS ➔ CNB
              </span>
              <span className="text-[10px] text-zinc-500">9 Automatic Blocks</span>
            </div>

            {/* UP Line Track Container with Sleepers & Steel Rails */}
            <div className="relative w-full h-5 flex items-center my-2 rounded-sm overflow-hidden border-y border-zinc-600/80 shadow-inner bg-[#0d1117]">
              {/* Wooden/Concrete Sleepers Repeating Linear Gradient */}
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

              {/* Steel Rail Lines (Top & Bottom Highlights) */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />

              {/* Interactive Block Signal Aspect Segments */}
              <div className="relative h-full w-full flex items-center z-0">
                {upBlocks.map((block) => (
                  <button
                    key={block.id}
                    onClick={() => {
                      railwayAudio.playClick();
                      onSelectBlock(block);
                    }}
                    title={`${block.id} (${block.startKm}-${block.endKm} km): Aspect ${block.aspect}${
                      block.isSignalFaulty ? ' [FAULT]' : ''
                    }${block.hasTSR ? ' [TSR 30km/h]' : ''}`}
                    className={`h-full flex-1 border-r border-zinc-700/50 transition-all hover:brightness-125 cursor-pointer relative ${getAspectColorClass(
                      block
                    )}`}
                  >
                    {block.hasTSR && (
                      <span className="absolute inset-0 bg-amber-500/40 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* UP LINE HEADWAY DISTANCE BRIDGES (Visual Distance Between Consecutive Trains) */}
            {upTrains.map((t1, idx) => {
              if (idx === upTrains.length - 1) return null;
              const t2 = upTrains[idx + 1];
              const distKm = Math.abs(t2.positionKm - t1.positionKm);
              const leftPct = kmToPercent(t1.positionKm);
              const rightPct = kmToPercent(t2.positionKm);
              const widthPct = Math.max(0.1, rightPct - leftPct);

              return (
                <div
                  key={`up-headway-${t1.id}-${t2.id}`}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-15 flex items-center justify-center transition-all duration-1000 ease-linear"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {/* Dashed Connector Line */}
                  <div className="w-full h-[1px] relative flex items-center justify-between">
                    <div
                      className={`w-full h-full border-t border-dashed transition-colors ${
                        distKm <= 31.0
                          ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                          : distKm <= 60
                          ? 'border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]'
                          : 'border-cyan-400/70'
                      }`}
                    />
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 ${
                        distKm <= 31.0 ? 'bg-rose-500' : distKm <= 60 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-3 ${
                        distKm <= 31.0 ? 'bg-rose-500' : distKm <= 60 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                  </div>

                  {/* Central High-Visibility Separation Badge */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap backdrop-blur-md border shadow-md flex items-center gap-1.5 ${
                      distKm <= 31.0
                        ? 'bg-rose-950/95 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse font-bold'
                        : distKm <= 60
                        ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] font-semibold'
                        : 'bg-zinc-950/90 border-cyan-800/80 text-cyan-300'
                    }`}
                  >
                    <span>↔ {distKm.toFixed(1)} KM</span>
                    {distKm <= 31.0 ? (
                      <span className="text-[8px] px-1 rounded bg-rose-500 text-zinc-950 font-bold uppercase">
                        MIN DIST ENFORCED
                      </span>
                    ) : distKm <= 60 ? (
                      <span className="text-[8px] text-amber-400 font-medium">CAUTION GAP</span>
                    ) : (
                      <span className="text-[8px] text-zinc-500 font-normal">SAFE GAP</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* UP LINE TRAINS GLIDING ON TRACK (CTC Vertical Stack Centered) */}
            {trains
              .filter((t) => t.line === 'UP')
              .map((train) => {
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
                    {/* 1. TOP: Train Number, Name & Delay Tag */}
                    <div className="flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-xs whitespace-nowrap shadow-sm hover:scale-105 transition-transform">
                      <span className="font-mono text-[10px] font-bold text-zinc-100">
                        {train.number}
                      </span>
                      {train.shortName && train.shortName.replace(train.number, '').trim() !== '' && (
                        <span className="text-[10px] font-medium text-zinc-400">
                          {train.shortName.replace(train.number, '').trim()}
                        </span>
                      )}
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

                    {/* 2. MIDDLE: Track-Centered Train Dot with 30.0 KM Safety Distance Halo */}
                    <div className="relative flex items-center justify-center">
                      {/* 30.0 KM Safety Buffer Zone Radius */}
                      <div
                        className={`absolute h-2.5 rounded-full pointer-events-none transition-colors border ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500/25 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400/25 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'bg-cyan-400/20 border-cyan-400/50 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                        }`}
                        style={{ width: '64px' }}
                        title="30.0 KM Minimum Safety Distance Buffer"
                      />

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
                        className={`relative w-2.5 h-2.5 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                            : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        }`}
                      />
                    </div>

                    {/* 3. BOTTOM: Speed Readout */}
                    <div className="mt-1 px-1 py-0.2 rounded bg-zinc-950/70 border border-zinc-800/60 backdrop-blur-xs whitespace-nowrap">
                      <span className="font-mono text-[9px] text-zinc-300">
                        {Math.round(train.currentSpeedKmH)}{' '}
                        <span className="text-[8px] text-zinc-500">km/h</span>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>

          {/* DOWN LINE (CNB -> NDLS) */}
          <div className="relative">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
              <span className="flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                DOWN LINE <span className="text-zinc-600 font-light">/</span> CNB ➔ NDLS
              </span>
              <span className="text-[10px] text-zinc-500">9 Automatic Blocks</span>
            </div>

            {/* DOWN Line Track Container with Sleepers & Steel Rails */}
            <div className="relative w-full h-5 flex items-center my-2 rounded-sm overflow-hidden border-y border-zinc-600/80 shadow-inner bg-[#0d1117]">
              {/* Wooden/Concrete Sleepers Repeating Linear Gradient */}
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

              {/* Steel Rail Lines (Top & Bottom Highlights) */}
              <div className="absolute top-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />
              <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-zinc-300/90 shadow-[0_0_4px_rgba(255,255,255,0.5)] pointer-events-none z-10" />

              {/* Interactive Block Signal Aspect Segments */}
              <div className="relative h-full w-full flex items-center z-0">
                {dnBlocks.map((block) => (
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

            {/* DOWN LINE HEADWAY DISTANCE BRIDGES */}
            {dnTrains.map((t1, idx) => {
              if (idx === dnTrains.length - 1) return null;
              const t2 = dnTrains[idx + 1];
              const distKm = Math.abs(t1.positionKm - t2.positionKm);
              const leftPct = kmToPercent(t2.positionKm);
              const rightPct = kmToPercent(t1.positionKm);
              const widthPct = Math.max(0.1, rightPct - leftPct);

              return (
                <div
                  key={`dn-headway-${t1.id}-${t2.id}`}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-15 flex items-center justify-center transition-all duration-1000 ease-linear"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {/* Dashed Connector Line */}
                  <div className="w-full h-[1px] relative flex items-center justify-between">
                    <div
                      className={`w-full h-full border-t border-dashed transition-colors ${
                        distKm <= 31.0
                          ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]'
                          : distKm <= 60
                          ? 'border-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.7)]'
                          : 'border-cyan-400/70'
                      }`}
                    />
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 ${
                        distKm <= 31.0 ? 'bg-rose-500' : distKm <= 60 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                    <div
                      className={`absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-3 ${
                        distKm <= 31.0 ? 'bg-rose-500' : distKm <= 60 ? 'bg-amber-400' : 'bg-cyan-400'
                      }`}
                    />
                  </div>

                  {/* Central High-Visibility Separation Badge */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap backdrop-blur-md border shadow-md flex items-center gap-1.5 ${
                      distKm <= 31.0
                        ? 'bg-rose-950/95 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-pulse font-bold'
                        : distKm <= 60
                        ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.6)] font-semibold'
                        : 'bg-zinc-950/90 border-cyan-800/80 text-cyan-300'
                    }`}
                  >
                    <span>↔ {distKm.toFixed(1)} KM</span>
                    {distKm <= 31.0 ? (
                      <span className="text-[8px] px-1 rounded bg-rose-500 text-zinc-950 font-bold uppercase">
                        MIN DIST ENFORCED
                      </span>
                    ) : distKm <= 60 ? (
                      <span className="text-[8px] text-amber-400 font-medium">CAUTION GAP</span>
                    ) : (
                      <span className="text-[8px] text-zinc-500 font-normal">SAFE GAP</span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* DOWN LINE TRAINS (CTC Vertical Stack Centered) */}
            {trains
              .filter((t) => t.line === 'DOWN')
              .map((train) => {
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
                    {/* 1. TOP: Train Number, Name & Delay Tag */}
                    <div className="flex items-center gap-1.5 mb-1 px-1.5 py-0.5 rounded bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-xs whitespace-nowrap shadow-sm hover:scale-105 transition-transform">
                      <span className="font-mono text-[10px] font-bold text-zinc-100">
                        {train.number}
                      </span>
                      {train.shortName && train.shortName.replace(train.number, '').trim() !== '' && (
                        <span className="text-[10px] font-medium text-zinc-400">
                          {train.shortName.replace(train.number, '').trim()}
                        </span>
                      )}
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

                    {/* 2. MIDDLE: Track-Centered Train Dot with 30.0 KM Safety Distance Halo */}
                    <div className="relative flex items-center justify-center">
                      {/* 30.0 KM Safety Buffer Zone Radius */}
                      <div
                        className={`absolute h-2.5 rounded-full pointer-events-none transition-colors border ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500/25 border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400/25 border-amber-400/60 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'bg-cyan-400/20 border-cyan-400/50 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                        }`}
                        style={{ width: '64px' }}
                        title="30.0 KM Minimum Safety Distance Buffer"
                      />

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
                        className={`relative w-2.5 h-2.5 rounded-full border-2 border-zinc-950 transition-colors duration-300 ${
                          train.status === 'HALTED'
                            ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                            : train.status === 'CAUTION'
                            ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                            : 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                        }`}
                      />
                    </div>

                    {/* 3. BOTTOM: Speed Readout */}
                    <div className="mt-1 px-1 py-0.2 rounded bg-zinc-950/70 border border-zinc-800/60 backdrop-blur-xs whitespace-nowrap">
                      <span className="font-mono text-[9px] text-zinc-300">
                        {Math.round(train.currentSpeedKmH)}{' '}
                        <span className="text-[8px] text-zinc-500">km/h</span>
                      </span>
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
