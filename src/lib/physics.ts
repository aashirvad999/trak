import { Train, ScenarioPreset, SwitchPointInfo, SignalingBlock } from '@/types/railway';

// Corridor Block Definitions (in km)
export const CORRIDOR_BLOCKS = [
  { id: 1, name: "NDLS-GZB", startKm: 0, endKm: 25 },
  { id: 2, name: "GZB-ALJN", startKm: 25, endKm: 130 },
  { id: 3, name: "ALJN-TDL", startKm: 130, endKm: 205 },
  { id: 4, name: "TDL-CONVERGE", startKm: 205, endKm: 320 },
  { id: 5, name: "CONVERGE-CNB", startKm: 320, endKm: 435 }, // Single Common Bottleneck Line
];

export interface IncidentState {
  scenarioPreset: ScenarioPreset;
  faultyBlockId: number | null;
  forcedHaltTrainId: string | null;
  tsrActive: boolean;
}

export const MIN_HEADWAY_SAFETY_KM = 25.0;
export const CONVERGENCE_KM = 320.0;

export function getSwitchPointStatus(allTrains: Train[], scenario: ScenarioPreset): SwitchPointInfo {
  // Check if there is a conflict at SW-12 (km 320)
  const rajdhani = allTrains.find((t) => t.number === '12302');
  const freight = allTrains.find((t) => t.number.includes('BOXN') || t.priority === 3);

  const isRajdhaniNearJunction = rajdhani && rajdhani.positionKm >= 300 && rajdhani.positionKm <= 335;
  const isFreightNearJunction = freight && freight.positionKm >= 295 && freight.positionKm <= 325;

  const isConflictActive = scenario === 'CONVERGENCE_CONFLICT' && (isRajdhaniNearJunction || isFreightNearJunction);

  if (isConflictActive && isFreightNearJunction && isRajdhaniNearJunction && rajdhani.positionKm < 335) {
    return {
      id: 'SW-12',
      positionKm: 320,
      isLocked: true,
      heldTrainId: freight?.id,
      priorityPassTrainId: rajdhani?.id,
      activeMessage: 'Switch SW-12 Locked: Priority precedence given to 12302 Rajdhani',
    };
  }

  return {
    id: 'SW-12',
    positionKm: 320,
    isLocked: false,
    activeMessage: 'Switch SW-12 Interlocking: Clear',
  };
}

export function computeNextTrainState(
  train: Train,
  allTrains: Train[],
  incidents: IncidentState,
  deltaTimeSec: number = 1.5,
  simSpeedMultiplier: number = 1,
  slackBufferMins: number = 12,
  blocks: SignalingBlock[] = []
): Train {
  let currentSpeed = train.currentSpeedKmH;
  let targetSpeed = train.maxTargetSpeedKmH;
  let status: 'RUNNING' | 'CAUTION' | 'HALTED' | 'ARRIVED' = 'RUNNING';
  let statusReason = 'Line Clear (Green Aspect)';
  let aspect: 'GREEN' | 'DOUBLE_YELLOW' | 'YELLOW' | 'RED' = 'GREEN';

  // 1. SIGNAL INTERLOCK FAULT CHECK IN TRACK BLOCKS
  const faultyBlock = blocks.find((b) => b.isSignalFaulty);
  const currentTrainBlock = blocks.find((b) => b.line === train.line && train.positionKm >= b.startKm && train.positionKm <= b.endKm);
  const isCurrentBlockFaulty = currentTrainBlock?.isSignalFaulty === true;

  // Check if approaching a faulty block signal on the same line (within 15km)
  const isApproachingFaultyBlock = faultyBlock && train.line === faultyBlock.line &&
    (train.line === 'UP'
      ? train.positionKm <= faultyBlock.startKm && train.positionKm >= faultyBlock.startKm - 15
      : train.positionKm >= faultyBlock.startKm && train.positionKm <= faultyBlock.startKm + 15);

  if (isCurrentBlockFaulty || isApproachingFaultyBlock) {
    targetSpeed = 0;
    aspect = 'RED';
    statusReason = `Interlock Signal Fault: Red Aspect Enforced at ${faultyBlock?.id || currentTrainBlock?.id || 'Signal Block'}`;
  }

  // 2. MANUAL EMERGENCY HALT OVERRIDE
  else if (incidents.forcedHaltTrainId === train.id) {
    targetSpeed = 0;
    aspect = 'RED';
    statusReason = 'Manual Emergency Halt (Controller Override)';
  }

  // 3. SCENARIO SPECIFIC INTERLOCKS
  else if (incidents.scenarioPreset === 'CONVERGENCE_CONFLICT') {
    const switchStatus = getSwitchPointStatus(allTrains, incidents.scenarioPreset);
    if (train.priority === 3 || train.number.includes('BOXN')) {
      if (switchStatus.isLocked && train.positionKm >= 295 && train.positionKm <= 320) {
        targetSpeed = 0;
        statusReason = 'Interlocking Halt: Priority precedence yielded to 12302 Rajdhani at single-line junction';
        aspect = 'RED';
      } else if (train.positionKm < 320 && train.positionKm >= 280) {
        targetSpeed = 45;
        statusReason = 'Approaching Switch SW-12 Convergence Junction (CNB Single Bottleneck)';
        aspect = 'YELLOW';
      }
    } else if (train.number === '12302') {
      if (train.positionKm >= 305 && train.positionKm <= 335) {
        targetSpeed = train.maxTargetSpeedKmH;
        statusReason = 'Single Line Right-of-Way: Express precedence granted through SW-12 turnout';
        aspect = 'GREEN';
      }
    }
  }
  else if (incidents.scenarioPreset === 'ENGINE_DEFECT') {
    const leadVandeBharat = allTrains.find((t) => t.number === '12004');
    if (train.number === '12004') {
      targetSpeed = 0;
      statusReason = 'Engine Defect: Stalled consist at Tundla (km 205)';
      aspect = 'RED';
    }
  }

  // 4. GENERAL HEADWAY & MULTI-ASPECT SIGNALING INTERLOCK (ACTIVE FOR ALL TRAINS)
  const sameLineTrains = allTrains.filter((t) => t.id !== train.id && t.line === train.line);
  const leadTrain = sameLineTrains.find((t) =>
    train.line === 'UP' ? t.positionKm > train.positionKm : t.positionKm < train.positionKm
  );

  if (leadTrain && targetSpeed > 0) {
    const headwayKm = Math.abs(leadTrain.positionKm - train.positionKm);

    if (headwayKm <= MIN_HEADWAY_SAFETY_KM) {
      targetSpeed = 0;
      aspect = 'RED';
      statusReason = `Headway Interlock: Mandatory Red halt behind ${leadTrain.number} ${leadTrain.shortName} (${headwayKm.toFixed(1)}km gap)`;
    } else if (headwayKm <= 45.0) {
      targetSpeed = Math.min(targetSpeed, 35);
      aspect = 'YELLOW';
      statusReason = `Caution (Yellow): Gradual deceleration trailing ${leadTrain.number} ${leadTrain.shortName} (${headwayKm.toFixed(1)}km gap)`;
    } else if (headwayKm <= 75.0) {
      targetSpeed = Math.min(targetSpeed, 70);
      aspect = 'DOUBLE_YELLOW';
      statusReason = `Advance Caution: Closing gap on ${leadTrain.number} ${leadTrain.shortName} (${headwayKm.toFixed(1)}km gap)`;
    }
  }

  // 5. SMOOTH KINEMATIC ACCELERATION & DECELERATION
  let speed = currentSpeed;
  if (speed > targetSpeed) {
    const decelRate = 18;
    speed = Math.max(targetSpeed, speed - decelRate);
  } else if (speed < targetSpeed) {
    const accelRate = 8;
    speed = Math.min(targetSpeed, speed + accelRate);
  }

  // Derive Status & Aspect
  if (speed === 0) {
    status = 'HALTED';
    aspect = 'RED';
  } else if (targetSpeed <= 45 || speed <= 45) {
    status = 'CAUTION';
    aspect = aspect === 'GREEN' ? 'YELLOW' : aspect;
  } else if (targetSpeed <= 75 || speed <= 80) {
    status = 'CAUTION';
    aspect = aspect === 'GREEN' ? 'DOUBLE_YELLOW' : aspect;
  } else {
    status = 'RUNNING';
    aspect = 'GREEN';
  }

  // 6. DYNAMIC DELAY ACCUMULATION ENGINE
  let delaySec = train.delaySeconds ?? (train.rawDelayMins * 60);

  if (speed < train.maxTargetSpeedKmH) {
    if (speed === 0) {
      delaySec += deltaTimeSec * simSpeedMultiplier;
    } else {
      const timeLossRatio = 1 - (speed / train.maxTargetSpeedKmH);
      delaySec += timeLossRatio * deltaTimeSec * simSpeedMultiplier;
    }
  } else if (incidents.scenarioPreset === 'SLACK_RECOVERY' && delaySec > 0) {
    delaySec = Math.max(0, delaySec - deltaTimeSec * simSpeedMultiplier * 0.5);
  }

  const rawDelayMins = Math.floor(delaySec / 60);
  const slackAbsorbed = Math.min(rawDelayMins, slackBufferMins);
  const netDelay = Math.max(0, rawDelayMins - slackAbsorbed);
  const dynamicETA = addMinutesToTime(train.scheduledArrival, netDelay);

  // Compute position progression
  const distanceTravelled = (speed / 3600) * deltaTimeSec * simSpeedMultiplier * 8;
  let nextPos = train.positionKm + (train.line === 'UP' ? distanceTravelled : -distanceTravelled);

  // Clamping for stopped trains or interlock signal limits
  if (faultyBlock && train.line === faultyBlock.line && train.line === 'UP' && train.positionKm < faultyBlock.startKm && nextPos >= faultyBlock.startKm) {
    nextPos = faultyBlock.startKm - 0.1;
  }

  if (nextPos > 435) nextPos = 0;
  if (nextPos < 0) nextPos = 435;

  const activeBlockId = `${train.line === 'UP' ? 'UP' : 'DN'}-BLK-0${Math.min(
    9,
    Math.floor((nextPos / 435) * 9) + 1
  )}`;

  return {
    ...train,
    positionKm: nextPos,
    currentSpeedKmH: speed,
    status,
    signalAspect: aspect,
    causalTag: statusReason,
    delaySeconds: delaySec,
    rawDelayMins: rawDelayMins,
    slackAbsorbedMins: slackAbsorbed,
    netDelayMins: netDelay,
    dynamicETA,
    currentBlockId: activeBlockId,
  };
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = h * 60 + m + Math.round(minutes);
  const newH = Math.floor((totalMins / 60) % 24);
  const newM = Math.floor(totalMins % 60);
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}
