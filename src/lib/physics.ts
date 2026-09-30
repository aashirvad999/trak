import { Train, ScenarioPreset, SwitchPointInfo } from '@/types/railway';

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
  slackBufferMins: number = 12
): Train {
  let currentSpeed = train.currentSpeedKmH;
  let targetSpeed = train.maxTargetSpeedKmH;
  let status: 'RUNNING' | 'CAUTION' | 'HALTED' | 'ARRIVED' = 'RUNNING';
  let statusReason = 'Line Clear (Green Aspect)';
  let aspect: 'GREEN' | 'DOUBLE_YELLOW' | 'YELLOW' | 'RED' = 'GREEN';

  const switchStatus = getSwitchPointStatus(allTrains, incidents.scenarioPreset);

  // 1. SCENARIO A: Convergence Conflict at km 320 Switch SW-12
  if (incidents.scenarioPreset === 'CONVERGENCE_CONFLICT') {
    if (train.priority === 3 || train.number.includes('BOXN')) {
      // Freight train approaching km 320
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
      // High-priority Rajdhani clearing the single-line junction
      if (train.positionKm >= 305 && train.positionKm <= 335) {
        targetSpeed = train.maxTargetSpeedKmH;
        statusReason = 'Single Line Right-of-Way: Express precedence granted through SW-12 turnout';
        aspect = 'GREEN';
      }
    }
  }

  // 2. SCENARIO B: Engine Defect / Stoppage at Tundla (km 205)
  if (incidents.scenarioPreset === 'ENGINE_DEFECT') {
    const leadVandeBharat = allTrains.find((t) => t.number === '12004');
    if (train.number === '12004') {
      targetSpeed = 0;
      statusReason = 'Engine Defect: Stalled consist at Tundla (km 205)';
      aspect = 'RED';
    } else if (leadVandeBharat && train.line === leadVandeBharat.line && train.positionKm < leadVandeBharat.positionKm) {
      const distToLead = leadVandeBharat.positionKm - train.positionKm;
      if (distToLead <= 12) {
        targetSpeed = 0;
        statusReason = 'Headway Interlock: Mandatory Red halt behind stalled consist at km 205';
        aspect = 'RED';
      } else if (distToLead <= 30) {
        targetSpeed = 35;
        statusReason = `Headway Compression: Operating under Yellow aspect due to stalled consist at km 205 (${distToLead.toFixed(1)}km gap)`;
        aspect = 'YELLOW';
      } else if (distToLead <= 60) {
        targetSpeed = 70;
        statusReason = `Advance Caution: Closing gap on stalled consist at km 205 (${distToLead.toFixed(1)}km gap)`;
        aspect = 'DOUBLE_YELLOW';
      }
    }
  }

  // 3. SCENARIO C: Timetable Slack Absorption & Recovery
  if (incidents.scenarioPreset === 'SLACK_RECOVERY') {
    targetSpeed = train.maxTargetSpeedKmH;
    if (train.netDelayMins <= 3 && train.rawDelayMins > 0) {
      statusReason = `${slackBufferMins}m terminal recovery buffer utilized; arriving with nominal deviation`;
    }
  }

  // 4. HARD OVERRIDE / MANUAL FAULT INSPECTION
  if (incidents.forcedHaltTrainId === train.id) {
    targetSpeed = 0;
    statusReason = 'Manual Emergency Halt (Controller Override)';
  }

  // 5. SMOOTH KINEMATIC ACCELERATION & DECELERATION
  let speed = currentSpeed;
  if (speed > targetSpeed) {
    // Decelerate smoothly (~15 km/h per 1.5s tick)
    const decelRate = 15;
    speed = Math.max(targetSpeed, speed - decelRate);
  } else if (speed < targetSpeed) {
    // Accelerate smoothly (~8 km/h per 1.5s tick)
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
      // Pure halt: accumulate full tick duration as raw delay
      delaySec += deltaTimeSec * simSpeedMultiplier;
    } else {
      // Partial speed loss: accumulate proportional time loss
      const timeLossRatio = 1 - (speed / train.maxTargetSpeedKmH);
      delaySec += timeLossRatio * deltaTimeSec * simSpeedMultiplier;
    }
  } else if (incidents.scenarioPreset === 'SLACK_RECOVERY' && delaySec > 0) {
    // When running at max speed in recovery mode, slowly recover raw delay
    delaySec = Math.max(0, delaySec - deltaTimeSec * simSpeedMultiplier * 0.5);
  }

  const rawDelayMins = Math.floor(delaySec / 60);
  const slackAbsorbed = Math.min(rawDelayMins, slackBufferMins);
  const netDelay = Math.max(0, rawDelayMins - slackAbsorbed);
  const dynamicETA = addMinutesToTime(train.scheduledArrival, netDelay);

  // Compute position progression
  const distanceTravelled = (speed / 3600) * deltaTimeSec * simSpeedMultiplier * 8; // Scale factor for visual track glide
  let nextPos = train.positionKm + (train.line === 'UP' ? distanceTravelled : -distanceTravelled);

  // Position clamping for loop wrap
  if (nextPos > 435) nextPos = 0;
  if (nextPos < 0) nextPos = 435;

  // Active Block ID Calculation
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
