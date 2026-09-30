import { Train } from '@/types/railway';

// Corridor Block Definitions (in km)
export const CORRIDOR_BLOCKS = [
  { id: 1, name: "NDLS-GZB", startKm: 0, endKm: 25 },
  { id: 2, name: "GZB-ALJN", startKm: 25, endKm: 130 },
  { id: 3, name: "ALJN-TDL", startKm: 130, endKm: 205 }, // Commonly faulted block
  { id: 4, name: "TDL-ETW",  startKm: 205, endKm: 315 },
  { id: 5, name: "ETW-CNB",  startKm: 315, endKm: 435 },
];

export interface IncidentState {
  faultyBlockId: number | null;      // e.g. 3 for ALJN-TDL
  forcedHaltTrainId: string | null;  // e.g. "12004"
  tsrActive: boolean;                // Temporary speed restriction
}

export const MIN_HEADWAY_SAFETY_KM = 30.0;

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
  let delayMinutes = train.rawDelayMins;

  // 1. HARD OVERRIDE: Is this specific train explicitly forced on halt?
  if (incidents.forcedHaltTrainId === train.id) {
    targetSpeed = 0;
    statusReason = 'Manual Emergency Halt (Controller Override)';
  } else {
    // Find which block the train is currently in
    const currentBlock = CORRIDOR_BLOCKS.find(
      (b) => train.positionKm >= b.startKm && train.positionKm < b.endKm
    );

    // 2. HARD OVERRIDE: Is the current block or the IMMEDIATELY approaching block RED?
    const isInsideFaultyBlock = incidents.faultyBlockId === currentBlock?.id;
    
    // Check if approaching the entrance of the faulty block (within 6km of the signal)
    const faultyBlock = CORRIDOR_BLOCKS.find((b) => b.id === incidents.faultyBlockId);
    const isApproachingSignal =
      faultyBlock &&
      train.positionKm < faultyBlock.startKm &&
      train.positionKm >= faultyBlock.startKm - 6;

    if (isInsideFaultyBlock || isApproachingSignal) {
      targetSpeed = 0;
      statusReason = `Interlock Stop Signal: Red Aspect at Block ${faultyBlock?.name || 'ALJN-TDL'}`;
    } else {
      // 3. HEADWAY & MULTI-ASPECT SIGNALING CHECK: Is there a train directly ahead on the same track?
      const sameTrackTrains = allTrains
        .filter((t) => t.line === train.line && t.id !== train.id)
        .sort((a, b) => (train.line === 'UP' ? a.positionKm - b.positionKm : b.positionKm - a.positionKm));

      // Find the closest train ahead
      const leadTrain = sameTrackTrains.find((t) =>
        train.line === 'UP' ? t.positionKm > train.positionKm : t.positionKm < train.positionKm
      );

      const headwayKm = leadTrain ? Math.abs(leadTrain.positionKm - train.positionKm) : 999;

      if (headwayKm <= MIN_HEADWAY_SAFETY_KM) {
        // Red Aspect: Mandatory Stop before breaching minimum 30.0 km safety distance
        targetSpeed = 0;
        statusReason = `Halted: Min Safety Gap Enforced (${headwayKm.toFixed(1)}km < ${MIN_HEADWAY_SAFETY_KM}km behind ${leadTrain?.shortName})`;
      } else if (headwayKm <= 55) {
        // Yellow Aspect: Restricted speed (35 km/h) & active deceleration
        targetSpeed = 35;
        statusReason = `Caution (Yellow): Gradual deceleration trailing ${leadTrain?.shortName} (${headwayKm.toFixed(1)}km gap)`;
      } else if (headwayKm <= 85) {
        // Double Yellow Aspect: Advance caution speed (70 km/h)
        targetSpeed = 70;
        statusReason = `Advance Caution (Double Yellow): Headway closing on ${leadTrain?.shortName} (${headwayKm.toFixed(1)}km gap)`;
      } else if (incidents.tsrActive && train.positionKm >= 205 && train.positionKm <= 230) {
        // Speed restriction zone
        targetSpeed = 30;
        statusReason = 'TSR 30 km/h Enforced (Track Maintenance)';
      }
    }
  }

  // 4. SMOOTH GRADUAL DECELERATION / ACCELERATION PHYSICS
  let speed = currentSpeed;
  if (speed > targetSpeed) {
    // Smooth deceleration step (drops ~18 km/h per 1.5s tick)
    const decelRate = 18;
    speed = Math.max(targetSpeed, speed - decelRate);
    if (targetSpeed < train.maxTargetSpeedKmH) {
      delayMinutes += 0.25;
    }
  } else if (speed < targetSpeed) {
    // Smooth acceleration step (gains ~8 km/h per tick)
    const accelRate = 8;
    speed = Math.min(targetSpeed, speed + accelRate);
  }

  // Set status & signal aspect based on updated smooth speed and target
  if (speed === 0) {
    status = 'HALTED';
    aspect = 'RED';
  } else if (targetSpeed <= 35 || speed <= 45) {
    status = 'CAUTION';
    aspect = 'YELLOW';
  } else if (targetSpeed <= 75 || speed <= 80) {
    status = 'CAUTION';
    aspect = 'DOUBLE_YELLOW';
  } else {
    status = 'RUNNING';
    aspect = 'GREEN';
  }

  // Compute position delta (km = speed * hours)
  const distanceTravelled = (speed / 3600) * deltaTimeSec * simSpeedMultiplier * 10; // scale factor for visual glide
  let nextPos = train.positionKm + (train.line === 'UP' ? distanceTravelled : -distanceTravelled);

  // Recalculate lead train position for hard safety position clamping
  const sameTrackTrains = allTrains
    .filter((t) => t.line === train.line && t.id !== train.id);
  const leadTrain = sameTrackTrains.find((t) =>
    train.line === 'UP' ? t.positionKm > train.positionKm : t.positionKm < train.positionKm
  );

  // Hard position clamping to ensure minimum safety distance gap is NEVER breached
  if (leadTrain) {
    if (train.line === 'UP') {
      const maxAllowedPos = leadTrain.positionKm - MIN_HEADWAY_SAFETY_KM;
      if (nextPos > maxAllowedPos) {
        nextPos = Math.max(train.positionKm, maxAllowedPos);
      }
    } else {
      const minAllowedPos = leadTrain.positionKm + MIN_HEADWAY_SAFETY_KM;
      if (nextPos < minAllowedPos) {
        nextPos = Math.min(train.positionKm, minAllowedPos);
      }
    }
  }

  const faultyBlock = CORRIDOR_BLOCKS.find((b) => b.id === incidents.faultyBlockId);
  // If approaching the red signal boundary, clamp position so it stops right at the signal post
  if (faultyBlock && train.line === 'UP' && train.positionKm < faultyBlock.startKm && nextPos >= faultyBlock.startKm) {
    nextPos = faultyBlock.startKm - 0.1; // clamp 100m before the red signal
  }

  if (nextPos > 435) nextPos = 0;
  if (nextPos < 0) nextPos = 435;

  // Timetable Recovery Slack Subtraction
  const roundedRawDelay = Math.round(delayMinutes);
  const slackAbsorbed = Math.min(roundedRawDelay, slackBufferMins);
  const netDelay = Math.max(0, roundedRawDelay - slackAbsorbed);
  const dynamicETA = addMinutesToTime(train.scheduledArrival, netDelay);

  // Active Block ID
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
    rawDelayMins: roundedRawDelay,
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
