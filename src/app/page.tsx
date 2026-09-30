'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import CursorGlow from '@/components/CursorGlow';
import CorridorSchematic from '@/components/CorridorSchematic';
import HeadwayTable from '@/components/HeadwayTable';
import ScenarioSimulator from '@/components/ScenarioSimulator';
import BlockInspectorModal from '@/components/BlockInspectorModal';
import { Station, SignalingBlock, Train, ScenarioPreset, AdvisoryAction } from '@/types/railway';
import { computeNextTrainState, IncidentState } from '@/lib/physics';
import { railwayAudio } from '@/lib/audio';

// Initial Stations Definition
const INITIAL_STATIONS: Station[] = [
  { id: 'ndls', code: 'NDLS', name: 'New Delhi Junction', distanceKm: 0, platforms: 16, slackBufferMins: 0, isMajorJunction: true },
  { id: 'gzb', code: 'GZB', name: 'Ghaziabad Junction', distanceKm: 25, platforms: 8, slackBufferMins: 0, isMajorJunction: false },
  { id: 'aljn', code: 'ALJN', name: 'Aligarh Junction', distanceKm: 130, platforms: 7, slackBufferMins: 0, isMajorJunction: false },
  { id: 'tdl', code: 'TDL', name: 'Tundla Junction', distanceKm: 205, platforms: 5, slackBufferMins: 0, isMajorJunction: false },
  { id: 'etw', code: 'ETW', name: 'Etawah Junction', distanceKm: 315, platforms: 4, slackBufferMins: 0, isMajorJunction: false },
  { id: 'cnb', code: 'CNB', name: 'Kanpur Central Junction', distanceKm: 435, platforms: 10, slackBufferMins: 12, isMajorJunction: true },
];

// 18 Signaling Blocks (9 UP, 9 DOWN)
const INITIAL_BLOCKS: SignalingBlock[] = [
  { id: 'UP-BLK-01', line: 'UP', startKm: 0, endKm: 48, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-02', line: 'UP', startKm: 48, endKm: 96, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-03', line: 'UP', startKm: 96, endKm: 144, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-04', line: 'UP', startKm: 144, endKm: 192, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-05', line: 'UP', startKm: 192, endKm: 240, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-06', line: 'UP', startKm: 240, endKm: 288, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-07', line: 'UP', startKm: 288, endKm: 336, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-08', line: 'UP', startKm: 336, endKm: 384, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'UP-BLK-09', line: 'UP', startKm: 384, endKm: 435, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },

  { id: 'DN-BLK-01', line: 'DOWN', startKm: 435, endKm: 384, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-02', line: 'DOWN', startKm: 384, endKm: 336, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-03', line: 'DOWN', startKm: 336, endKm: 288, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-04', line: 'DOWN', startKm: 288, endKm: 240, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-05', line: 'DOWN', startKm: 240, endKm: 192, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-06', line: 'DOWN', startKm: 192, endKm: 144, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-07', line: 'DOWN', startKm: 144, endKm: 96, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-08', line: 'DOWN', startKm: 96, endKm: 48, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
  { id: 'DN-BLK-09', line: 'DOWN', startKm: 48, endKm: 0, aspect: 'GREEN', occupiedByTrainId: null, hasTSR: false, isSignalFaulty: false },
];

// Initial Active Trains
const INITIAL_TRAINS: Train[] = [
  {
    id: '12004',
    number: '12004',
    name: 'Vande Bharat Express',
    shortName: 'VB',
    line: 'UP',
    priority: 1,
    maxTargetSpeedKmH: 130,
    currentSpeedKmH: 128,
    positionKm: 165,
    currentBlockId: 'UP-BLK-04',
    signalAspect: 'GREEN',
    scheduledArrival: '16:40',
    baseETA: '16:40',
    dynamicETA: '16:40',
    delaySeconds: 0,
    rawDelayMins: 0,
    slackAbsorbedMins: 0,
    netDelayMins: 0,
    causalTag: 'Clear signal run — nominal headway',
    colorHex: '#06b6d4',
    status: 'RUNNING',
  },
  {
    id: '12302',
    number: '12302',
    name: 'Howrah Rajdhani Express',
    shortName: 'RAJ',
    line: 'UP',
    priority: 1,
    maxTargetSpeedKmH: 120,
    currentSpeedKmH: 115,
    positionKm: 312,
    currentBlockId: 'UP-BLK-07',
    signalAspect: 'GREEN',
    scheduledArrival: '17:15',
    baseETA: '17:15',
    dynamicETA: '17:15',
    delaySeconds: 0,
    rawDelayMins: 0,
    slackAbsorbedMins: 0,
    netDelayMins: 0,
    causalTag: 'Approaching SW-12 single line bottleneck',
    colorHex: '#f59e0b',
    status: 'RUNNING',
  },
  {
    id: '12560',
    number: '12560',
    name: 'Shiv Ganga Express',
    shortName: 'SHIV',
    line: 'DOWN',
    priority: 2,
    maxTargetSpeedKmH: 110,
    currentSpeedKmH: 110,
    positionKm: 280,
    currentBlockId: 'DN-BLK-04',
    signalAspect: 'GREEN',
    scheduledArrival: '18:05',
    baseETA: '18:05',
    dynamicETA: '18:05',
    delaySeconds: 0,
    rawDelayMins: 0,
    slackAbsorbedMins: 0,
    netDelayMins: 0,
    causalTag: 'Full line priority',
    colorHex: '#10b981',
    status: 'RUNNING',
  },
  {
    id: 'BOXN-9024',
    number: 'BOXN-9024',
    name: 'BOXN Heavy Freight',
    shortName: 'FREIGHT',
    line: 'UP',
    priority: 3,
    maxTargetSpeedKmH: 60,
    currentSpeedKmH: 55,
    positionKm: 308,
    currentBlockId: 'UP-BLK-07',
    signalAspect: 'GREEN',
    scheduledArrival: '20:30',
    baseETA: '20:30',
    dynamicETA: '20:30',
    delaySeconds: 0,
    rawDelayMins: 0,
    slackAbsorbedMins: 0,
    netDelayMins: 0,
    causalTag: 'Track 2 Slow Line — SW-12 approach',
    colorHex: '#a1a1aa',
    status: 'RUNNING',
  },
];

export default function Page() {
  const [stations] = useState<Station[]>(INITIAL_STATIONS);
  const [blocks, setBlocks] = useState<SignalingBlock[]>(INITIAL_BLOCKS);
  const [trains, setTrains] = useState<Train[]>(INITIAL_TRAINS);
  const [scenario, setScenario] = useState<ScenarioPreset>('NORMAL');

  // Incident State
  const [incidents, setIncidents] = useState<IncidentState>({
    scenarioPreset: 'NORMAL',
    faultyBlockId: null,
    forcedHaltTrainId: null,
    tsrActive: false,
  });

  const incidentsRef = useRef(incidents);
  useEffect(() => {
    incidentsRef.current = incidents;
  }, [incidents]);

  const [slackBufferMins, setSlackBufferMins] = useState<number>(12);
  const slackBufferMinsRef = useRef(slackBufferMins);
  useEffect(() => {
    slackBufferMinsRef.current = slackBufferMins;
  }, [slackBufferMins]);

  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState<number>(1);
  const simSpeedMultiplierRef = useRef(simSpeedMultiplier);
  useEffect(() => {
    simSpeedMultiplierRef.current = simSpeedMultiplier;
  }, [simSpeedMultiplier]);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Inspector Modal states
  const [selectedBlock, setSelectedBlock] = useState<SignalingBlock | null>(null);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

  // AI Resolver Advisory State
  const [activeAdvisory, setActiveAdvisory] = useState<AdvisoryAction | null>(null);

  // Toggle Mute Audio
  const handleToggleSound = () => {
    const muted = railwayAudio.toggleMute();
    setIsMuted(muted);
  };

  const blocksRef = useRef(blocks);
  useEffect(() => {
    blocksRef.current = blocks;
  }, [blocks]);

  // Deterministic Telemetry Physics Loop (runs every 1.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPausedRef.current) return;
      setTrains((prevTrains) =>
        prevTrains.map((train) =>
          computeNextTrainState(
            train,
            prevTrains,
            incidentsRef.current,
            1.5,
            simSpeedMultiplierRef.current,
            slackBufferMinsRef.current,
            blocksRef.current
          )
        )
      );
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Handlers for interactive incident triggers
  const handleToggleFaultyBlock = (blockId: number) => {
    setIncidents((prev) => ({
      ...prev,
      faultyBlockId: prev.faultyBlockId === blockId ? null : blockId,
    }));
  };

  const handleToggleTrainHalt = (trainId: string) => {
    setIncidents((prev) => ({
      ...prev,
      forcedHaltTrainId: prev.forcedHaltTrainId === trainId ? null : trainId,
    }));
  };

  // Apply Preset Scenarios
  const handleApplyScenario = (preset: ScenarioPreset) => {
    setScenario(preset);

    if (preset === 'CONVERGENCE_CONFLICT') {
      setIncidents({
        scenarioPreset: 'CONVERGENCE_CONFLICT',
        faultyBlockId: null,
        forcedHaltTrainId: null,
        tsrActive: false,
      });

      // Reposition trains at the SW-12 junction merge threshold
      setTrains((prev) =>
        prev.map((t) => {
          if (t.number === '12302') {
            return { ...t, positionKm: 312, currentSpeedKmH: 115, status: 'RUNNING', signalAspect: 'GREEN' };
          }
          if (t.number.includes('BOXN')) {
            return { ...t, positionKm: 308, currentSpeedKmH: 55, status: 'RUNNING', signalAspect: 'YELLOW' };
          }
          return t;
        })
      );

      setActiveAdvisory({
        id: 'adv-conv-01',
        trainId: 'BOXN-9024',
        actionText:
          'Interlocking Precedence Halt: Hold BOXN Freight at SW-12 outer home signal (km 320) to grant 12302 Rajdhani clear passage onto single-line bottleneck. Saved priority delay: +12m.',
        impactMinutes: 12,
        type: 'OVERTAKE_PRIORITY',
        applied: false,
      });
    } else if (preset === 'ENGINE_DEFECT') {
      setIncidents({
        scenarioPreset: 'ENGINE_DEFECT',
        faultyBlockId: 3,
        forcedHaltTrainId: '12004',
        tsrActive: false,
      });

      setTrains((prev) =>
        prev.map((t) => {
          if (t.number === '12004') {
            return { ...t, positionKm: 205, currentSpeedKmH: 0, status: 'HALTED', signalAspect: 'RED' };
          }
          if (t.number === '12302') {
            return { ...t, positionKm: 185, currentSpeedKmH: 35, status: 'CAUTION', signalAspect: 'YELLOW' };
          }
          return t;
        })
      );

      setActiveAdvisory({
        id: 'adv-def-02',
        trainId: '12302',
        actionText:
          'Headway Compression Caution: Regulate speed of trailing 12302 Rajdhani to 35 km/h to maintain safe gap behind stalled Vande Bharat (km 205).',
        impactMinutes: 15,
        type: 'SPEED_HOLD',
        applied: false,
      });
    } else if (preset === 'SLACK_RECOVERY') {
      setIncidents({
        scenarioPreset: 'SLACK_RECOVERY',
        faultyBlockId: null,
        forcedHaltTrainId: null,
        tsrActive: false,
      });

      setBlocks(INITIAL_BLOCKS);

      setActiveAdvisory({
        id: 'adv-rec-03',
        trainId: '12302',
        actionText:
          'Timetable Slack Absorption Active: 12m Kanpur terminal recovery allowance actively absorbs accrued line delay. Destination arrival deviation restored to +2m.',
        impactMinutes: 12,
        type: 'CLEAR_SIGNAL',
        applied: true,
      });
    } else {
      // Normal Reset
      setIncidents({ scenarioPreset: 'NORMAL', faultyBlockId: null, forcedHaltTrainId: null, tsrActive: false });
      setBlocks(INITIAL_BLOCKS);
      setTrains(INITIAL_TRAINS);
      setActiveAdvisory(null);
    }
  };

  // Apply AI Advisory Action
  const handleApplyAdvisory = (advisory: AdvisoryAction) => {
    setActiveAdvisory({ ...advisory, applied: true });
    setTimeout(() => {
      handleApplyScenario('SLACK_RECOVERY');
    }, 1200);
  };

  // Manual Speed Override from Modal
  const handleOverrideSpeed = (trainId: string, speedKmH: number) => {
    if (speedKmH === 0) {
      handleToggleTrainHalt(trainId);
    } else {
      setIncidents((prev) => ({
        ...prev,
        forcedHaltTrainId: prev.forcedHaltTrainId === trainId ? null : prev.forcedHaltTrainId,
      }));
    }
    setTrains((prev) =>
      prev.map((t) =>
        t.id === trainId
          ? {
              ...t,
              currentSpeedKmH: speedKmH,
              status: speedKmH === 0 ? 'HALTED' : speedKmH < 60 ? 'CAUTION' : 'RUNNING',
            }
          : t
      )
    );
  };

  // Calculate Corridor Telemetry Header Aggregates
  const avgVelocity =
    trains.reduce((acc, t) => acc + t.currentSpeedKmH, 0) / (trains.length || 1);
  const normalBlocksCount = blocks.filter((b) => !b.isSignalFaulty && !b.hasTSR).length;

  return (
    <div className="min-h-screen bg-void text-zinc-300 font-sans selection:bg-cyan-500/20 selection:text-cyan-200 flex flex-col justify-between p-4 md:p-6 lg:p-7 relative overflow-hidden">
      {/* Interactive Cursor Glow Follower */}
      <CursorGlow />

      <div className="w-full max-w-[1720px] mx-auto flex flex-col gap-5 relative z-10">
        {/* 1. Header */}
        <Header
          avgVelocityKmH={avgVelocity}
          corridorSaturationPct={84}
          normalBlocksCount={normalBlocksCount}
          totalBlocksCount={blocks.length}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* 2. Corridor Track Schematic */}
        <CorridorSchematic
          stations={stations}
          blocks={blocks}
          trains={trains}
          onSelectBlock={(b) => setSelectedBlock(b)}
          onSelectStation={(stn) => setSelectedStation(stn)}
          onSelectTrain={(t) => setSelectedTrain(t)}
          scenarioPreset={scenario}
        />

        {/* 3. Operational Dock (Headway Table + Scenario Sandbox) */}
        <div className="w-full grid grid-cols-12 gap-5 flex-1">
          <HeadwayTable
            trains={trains}
            onSelectTrain={(t) => setSelectedTrain(t)}
            slackBufferMins={slackBufferMins}
          />

          <ScenarioSimulator
            currentScenario={scenario}
            onApplyScenario={handleApplyScenario}
            slackBufferMins={slackBufferMins}
            onSlackChange={(v) => setSlackBufferMins(v)}
            simSpeedMultiplier={simSpeedMultiplier}
            onSimSpeedChange={(v) => setSimSpeedMultiplier(v)}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            trains={trains}
            activeAdvisory={activeAdvisory}
            onApplyAdvisory={handleApplyAdvisory}
          />
        </div>
      </div>

      {/* Telemetry Modal */}
      <BlockInspectorModal
        selectedBlock={selectedBlock}
        selectedStation={selectedStation}
        selectedTrain={selectedTrain}
        onClose={() => {
          setSelectedBlock(null);
          setSelectedStation(null);
          setSelectedTrain(null);
        }}
        onToggleSignalFault={(blockId) => {
          const isCurrentlyFaulty = selectedBlock?.isSignalFaulty ?? false;
          const nextFaultyState = !isCurrentlyFaulty;

          setBlocks((prev) =>
            prev.map((b) =>
              b.id === blockId
                ? { ...b, isSignalFaulty: nextFaultyState, aspect: nextFaultyState ? 'RED' : 'GREEN' }
                : b
            )
          );

          setSelectedBlock((prev) =>
            prev && prev.id === blockId
              ? { ...prev, isSignalFaulty: nextFaultyState, aspect: nextFaultyState ? 'RED' : 'GREEN' }
              : prev
          );

          setIncidents((prev) => ({
            ...prev,
            faultyBlockId: nextFaultyState ? 3 : null,
          }));
        }}
        onOverrideSpeed={handleOverrideSpeed}
      />
    </div>
  );
}
