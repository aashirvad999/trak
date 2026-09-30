'use client';

import { useState, useEffect } from 'react';
import { SignalingBlock, Station, Train } from '@/types/railway';
import { X, Zap, Radio, Train as TrainIcon } from 'lucide-react';
import { railwayAudio } from '@/lib/audio';

interface BlockInspectorModalProps {
  selectedBlock: SignalingBlock | null;
  selectedStation: Station | null;
  selectedTrain: Train | null;
  onClose: () => void;
  onToggleSignalFault?: (blockId: string) => void;
  onToggleTSR?: (blockId: string) => void;
  onOverrideSpeed?: (trainId: string, speedKmH: number) => void;
}

export default function BlockInspectorModal({
  selectedBlock,
  selectedStation,
  selectedTrain,
  onClose,
  onToggleSignalFault,
  onToggleTSR,
  onOverrideSpeed,
}: BlockInspectorModalProps) {
  const [selectedSpeed, setSelectedSpeed] = useState<number | null>(null);

  // Sync and highlight closest current speed preset on open/train change
  useEffect(() => {
    if (selectedTrain) {
      const presets = [0, 30, 80, selectedTrain.maxTargetSpeedKmH];
      const current = Math.round(selectedTrain.currentSpeedKmH);
      const closest = presets.reduce((prev, curr) =>
        Math.abs(curr - current) < Math.abs(prev - current) ? curr : prev
      );
      setSelectedSpeed(closest);
    }
  }, [selectedTrain]);

  if (!selectedBlock && !selectedStation && !selectedTrain) return null;

  return (
    <div
      onClick={() => {
        railwayAudio.playClick();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/80 backdrop-blur-md animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-cardbg border border-borderzinc/80 rounded-2xl p-6 shadow-2xl overflow-hidden font-mono cursor-default"
      >
        {/* Close button */}
        <button
          onClick={() => {
            railwayAudio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-elevated hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. SIGNAL BLOCK INSPECTOR */}
        {selectedBlock && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-800/60 text-cyan-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Automatic Block Telemetry
                </h3>
                <span className="text-xs text-zinc-400 font-sans">
                  Block {selectedBlock.id} • {selectedBlock.line} Line ({selectedBlock.startKm}–
                  {selectedBlock.endKm} KM)
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-void/60 border border-borderzinc/60 p-4 rounded-xl text-xs mb-5">
              <div className="flex justify-between items-center pb-2 border-b border-borderzinc/40">
                <span className="text-zinc-500">Signal Aspect:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    selectedBlock.aspect === 'GREEN'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : selectedBlock.aspect === 'RED'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {selectedBlock.aspect}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Occupancy Status:</span>
                <span className="text-zinc-200 font-medium">
                  {selectedBlock.occupiedByTrainId
                    ? `Occupied by Train ${selectedBlock.occupiedByTrainId}`
                    : 'Clear (Unoccupied)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Track Circuit Resistance:</span>
                <span className="text-zinc-300 font-mono-numbers">0.82 Ω (Normal)</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Axle Counter Count:</span>
                <span className="text-zinc-300 font-mono-numbers">
                  {selectedBlock.occupiedByTrainId ? '96 Axles In' : '0 Axles'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">TSR (Speed Restriction):</span>
                <span className="text-amber-400">
                  {selectedBlock.hasTSR ? `Active (${selectedBlock.tsrSpeedLimitKmH} km/h)` : 'None'}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {onToggleSignalFault && (
                <button
                  onClick={() => {
                    railwayAudio.playAlert();
                    onToggleSignalFault(selectedBlock.id);
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                    selectedBlock.isSignalFaulty
                      ? 'bg-elevated/90 border-2 border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-zinc-800'
                      : 'bg-elevated/90 border-2 border-rose-500 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:bg-zinc-800'
                  }`}
                >
                  {selectedBlock.isSignalFaulty ? 'Clear Signal Interlock Fault' : 'Mark Signal Interlock Fault'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 2. STATION TELEMETRY INSPECTOR */}
        {selectedStation && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  Station Operational Master
                </h3>
                <span className="text-xs text-zinc-400 font-sans">
                  {selectedStation.name} ({selectedStation.code}) • KM {selectedStation.distanceKm}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-void/60 border border-borderzinc/60 p-4 rounded-xl text-xs mb-5">
              <div className="flex justify-between items-center pb-2 border-b border-borderzinc/40">
                <span className="text-zinc-500">Station Category:</span>
                <span className="text-cyan-400 font-semibold">
                  {selectedStation.isMajorJunction ? 'Major Junction (A1)' : 'Intermediate Block (A)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Available Platforms:</span>
                <span className="text-zinc-200 font-mono-numbers">{selectedStation.platforms} Platforms</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Timetable Buffer Slack:</span>
                <span className="text-emerald-400 font-bold font-mono-numbers">
                  +{selectedStation.slackBufferMins} minutes built-in
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Route Interlocking:</span>
                <span className="text-zinc-300">Electronic Interlocking (EI v2.4)</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. TRAIN TELEMETRY & OVERRIDE INSPECTOR */}
        {selectedTrain && (
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="p-2 rounded-lg border text-zinc-100"
                style={{ backgroundColor: `${selectedTrain.colorHex}20`, borderColor: selectedTrain.colorHex }}
              >
                <TrainIcon className="w-5 h-5" style={{ color: selectedTrain.colorHex }} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  {selectedTrain.number} {selectedTrain.name}
                </h3>
                <span className="text-xs text-zinc-400 font-sans">
                  Priority {selectedTrain.priority} • {selectedTrain.line} Line • Position: KM{' '}
                  {selectedTrain.positionKm.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="space-y-3 bg-void/60 border border-borderzinc/60 p-4 rounded-xl text-xs mb-5">
              <div className="flex justify-between items-center pb-2 border-b border-borderzinc/40">
                <span className="text-zinc-500">Current Velocity:</span>
                <span className="text-zinc-100 font-bold font-mono-numbers text-sm">
                  {Math.round(selectedTrain.currentSpeedKmH)} km/h{' '}
                  <span className="text-zinc-500 font-normal text-xs">(Max {selectedTrain.maxTargetSpeedKmH})</span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Signal Aspect Received:</span>
                <span className="text-emerald-400 font-semibold">{selectedTrain.signalAspect}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Raw Calculate Delay:</span>
                <span className="text-amber-400 font-mono-numbers">+{selectedTrain.rawDelayMins}m</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Slack Subtracted:</span>
                <span className="text-emerald-400 font-mono-numbers">-{selectedTrain.slackAbsorbedMins}m</span>
              </div>

              <div className="flex justify-between items-center font-bold">
                <span className="text-zinc-300">Net Displayed Dynamic ETA Delay:</span>
                <span className={selectedTrain.netDelayMins > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                  +{selectedTrain.netDelayMins} mins
                </span>
              </div>

              <div className="pt-2 border-t border-borderzinc/40">
                <span className="text-zinc-500 block mb-1">Causal Bottleneck Attribution:</span>
                <p className="text-zinc-300 font-sans text-xs bg-elevated p-2 rounded border border-borderzinc/60">
                  {selectedTrain.causalTag}
                </p>
              </div>
            </div>

            {onOverrideSpeed && (
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 block font-semibold uppercase tracking-wider">
                  Manual Velocity Control Override:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 30, 80, selectedTrain.maxTargetSpeedKmH].map((spd) => {
                    const isSelected = selectedSpeed === spd;
                    return (
                      <button
                        key={spd}
                        onClick={() => {
                          setSelectedSpeed(spd);
                          railwayAudio.playClick();
                          onOverrideSpeed(selectedTrain.id, spd);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          isSelected
                            ? 'bg-elevated/90 text-cyan-300 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105'
                            : 'bg-elevated/80 border border-borderzinc/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        {spd === 0 ? 'Halt (0)' : `${spd} km/h`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
