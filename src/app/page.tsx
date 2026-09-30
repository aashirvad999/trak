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

// Initial 4 Active Trains
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
    currentSpeedKmH: 104,
    positionKm: 85,
    currentBlockId: 'UP-BLK-02',
    signalAspect: 'YELLOW',
    scheduledArrival: '17:15',
    baseETA: '17:15',
    dynamicETA: '17:19',
    rawDelayMins: 16,
    slackAbsorbedMins: 12,
    netDelayMins: 4,
    causalTag: 'ALJN approach caution aspect',
    colorHex: '#f59e0b',
    status: 'CAUTION',
  },
  {
    id: '12560',
    number: '12560',
    name: 'Shiv Ganga Express',
    shortName: 'SHIV',
    line: 'DOWN',
    priority: 2,
    maxTargetSpeedKmH: 110,
    currentSpeedKmH: 118,
    positionKm: 280,
    currentBlockId: 'DN-BLK-04',
    signalAspect: 'GREEN',
    scheduledArrival: '18:05',
    baseETA: '18:05',
    dynamicETA: '18:05',
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
    currentSpeedKmH: 58,
    positionKm: 25,
    currentBlockId: 'UP-BLK-01',
    signalAspect: 'GREEN',
    scheduledArrival: '20:30',
    baseETA: '20:30',
    dynamicETA: '20:48',
    rawDelayMins: 30,
    slackAbsorbedMins: 12,
    netDelayMins: 18,
    causalTag: 'Loop regulation for Vande Bharat overtake',
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
    faultyBlockId: null,
    forcedHaltTrainId: null,
    tsrActive: false,
  });

  // Use a Ref to ensure the interval closure always sees latest incidents without recreating the timer
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

  // Deterministic Telemetry Physics Loop (interval created ONCE)
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
            slackBufferMinsRef.current
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

    if (preset === 'SIGNAL_FAIL') {
      handleToggleFaultyBlock(3); // Block 3: ALJN-TDL (130-205 km)
      setBlocks((prev) =>
        prev.map((b) => (b.id === 'UP-BLK-03' ? { ...b, aspect: 'RED', isSignalFaulty: true } : b))
      );
      setActiveAdvisory({
        id: 'adv-01',
        trainId: '12004',
        actionText:
          'Divert BOXN-9024 freight to ALJN Loop Line 3 with 15 km/h control to clear main UP line for 12004 Vande Bharat. Priority gain: +14m recovery.',
        impactMinutes: 14,
        type: 'DIVERT_LOOP',
        applied: false,
      });
    } else if (preset === 'TSR') {
      setIncidents((prev) => ({ ...prev, tsrActive: true }));
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === 'UP-BLK-05' ? { ...b, aspect: 'YELLOW', hasTSR: true, tsrSpeedLimitKmH: 30 } : b
        )
      );
      setActiveAdvisory({
        id: 'adv-02',
        trainId: '12302',
        actionText:
          'Regulate freight BOXN at GZB Loop to preserve 120 km/h headway for Rajdhani through TDL restriction zone.',
        impactMinutes: 8,
        type: 'SPEED_HOLD',
        applied: false,
      });
    } else {
      // Normal Reset
      setIncidents({ faultyBlockId: null, forcedHaltTrainId: null, tsrActive: false });
      setBlocks(INITIAL_BLOCKS);
      setActiveAdvisory(null);
    }
  };

  // Apply AI Advisory Action
  const handleApplyAdvisory = (advisory: AdvisoryAction) => {
    setActiveAdvisory({ ...advisory, applied: true });
    // Reset track to normal clear running with recovered priority!
    setTimeout(() => {
      handleApplyScenario('NORMAL');
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
        {/* 1. Header with Train Locomotive SVG Glide Animation */}
        <Header
          avgVelocityKmH={avgVelocity}
          corridorSaturationPct={84}
          normalBlocksCount={normalBlocksCount}
          totalBlocksCount={blocks.length}
          isMuted={isMuted}
          onToggleSound={handleToggleSound}
        />

        {/* 2. Interactive Linear Corridor Track View */}
        <CorridorSchematic
          stations={stations}
          blocks={blocks}
          trains={trains}
          onSelectBlock={(b) => setSelectedBlock(b)}
          onSelectStation={(stn) => setSelectedStation(stn)}
          onSelectTrain={(t) => setSelectedTrain(t)}
        />

        {/* 3. Operational Dock (Live Headway Table + Jury Scenario Simulator) */}
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

      {/* Interactive Telemetry Modal */}
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
