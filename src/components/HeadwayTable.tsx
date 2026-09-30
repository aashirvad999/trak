'use client';

import { Train } from '@/types/railway';
import { Layers, AlertTriangle, Shield, CheckCircle, Clock, ArrowUpRight } from 'lucide-react';
import { railwayAudio } from '@/lib/audio';

interface HeadwayTableProps {
  trains: Train[];
  onSelectTrain: (train: Train) => void;
  slackBufferMins: number;
}

export default function HeadwayTable({ trains, onSelectTrain, slackBufferMins }: HeadwayTableProps) {
  return (
    <section className="col-span-12 lg:col-span-7 bg-cardbg/80 border border-borderzinc/80 rounded-xl p-5 lg:p-6 backdrop-blur-md flex flex-col justify-between shadow-2xl">
      <div>
        {/* Table Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-borderzinc/60 mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-100">
              Live Headway &amp; Dynamic ETA Telemetry
            </h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
            <span className="text-zinc-500">CNB Buffer:</span>
            <span className="text-emerald-400 font-semibold px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/60">
              {slackBufferMins} min Slack
            </span>
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left font-mono border-collapse">
            <thead>
              <tr className="text-[11px] text-zinc-500 border-b border-borderzinc/50 pb-2">
                <th className="py-2.5 font-normal">Train &amp; Line</th>
                <th className="py-2.5 px-2 font-normal">Active Block</th>
                <th className="py-2.5 px-2 font-normal text-right">Speed</th>
                <th className="py-2.5 px-2 font-normal text-right">Sched.</th>
                <th className="py-2.5 px-2 font-normal text-right">Dynamic ETA</th>
                <th className="py-2.5 pl-3 font-normal">Real-Time Bottleneck Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderzinc/40 text-xs font-mono-numbers">
              {trains.map((t) => {
                const isHalted = t.status === 'HALTED';
                const isCaution = t.status === 'CAUTION';
                const isDelayed = t.netDelayMins > 0;

                return (
                  <tr
                    key={t.id}
                    onClick={() => {
                      railwayAudio.playClick();
                      onSelectTrain(t);
                    }}
                    className="hover:bg-elevated/80 transition-colors cursor-pointer group"
                  >
                    {/* Train Identity & Priority */}
                    <td className="py-3.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.colorHex }}
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-100 group-hover:text-cyan-400 transition-colors">
                            {t.number} {t.shortName.replace(t.number, '').trim()}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-sans flex items-center gap-1">
                            <span>{t.line} Line</span>
                            <span>•</span>
                            <span
                              className={`font-semibold ${
                                t.priority === 1
                                  ? 'text-cyan-400'
                                  : t.priority === 2
                                  ? 'text-emerald-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              P{t.priority}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Active Block */}
                    <td className="py-3.5 px-2 text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-void/80 border border-borderzinc/60 text-[11px]">
                        {t.currentBlockId}
                      </span>
                    </td>

                    {/* Speed */}
                    <td className="py-3.5 px-2 text-right">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-semibold ${
                            isHalted
                              ? 'text-rose-400 animate-pulse'
                              : isCaution
                              ? 'text-amber-400'
                              : 'text-zinc-200'
                          }`}
                        >
                          {Math.round(t.currentSpeedKmH)} km/h
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          Target {t.maxTargetSpeedKmH}
                        </span>
                      </div>
                    </td>

                    {/* Scheduled Time */}
                    <td className="py-3.5 px-2 text-right text-zinc-400 font-mono-numbers">
                      {t.scheduledArrival}
                    </td>

                    {/* Dynamic Predicted ETA */}
                    <td className="py-3.5 px-2 text-right font-mono-numbers">
                      <div className="flex flex-col items-end">
                        <span
                          className={`font-semibold ${
                            isDelayed ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {t.dynamicETA}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {t.netDelayMins > 0 ? (
                            <span className="text-rose-400 font-medium">
                              +{t.netDelayMins}m net delay
                              {t.slackAbsorbedMins > 0 && (
                                <span className="text-zinc-500 font-normal ml-0.5">
                                  ({t.slackAbsorbedMins}m slack absorbed)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-normal">+0m (On Time)</span>
                          )}
                        </span>
                      </div>
                    </td>

                    {/* Bottleneck Attribution Causal Tag */}
                    <td className="py-3.5 pl-3 font-sans">
                      <div
                        className={`text-xs p-1.5 rounded-md border flex items-center gap-1.5 ${
                          isHalted
                            ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                            : isCaution
                            ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                            : 'bg-void/40 border-borderzinc/40 text-zinc-400'
                        }`}
                      >
                        {isHalted ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        ) : isCaution ? (
                          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        )}
                        <span className="truncate max-w-[240px]" title={t.causalTag}>
                          {t.causalTag}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Performance Latency & Reliability Footer */}
      <div className="pt-3 border-t border-borderzinc/50 flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-4">
        <span>Kalman Headway Predictor Latency: 12ms</span>
        <span className="text-zinc-400 flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-400" />
          Model Reliability: <strong className="text-emerald-400 font-mono-numbers">99.4%</strong>
        </span>
      </div>
    </section>
  );
}
