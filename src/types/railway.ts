export type PriorityLevel = 1 | 2 | 3; // 1: High (Vande Bharat/Rajdhani), 2: Medium (Superfast), 3: Low (Freight)

export type SignalAspect = 'GREEN' | 'DOUBLE_YELLOW' | 'YELLOW' | 'RED';

export interface Station {
  id: string;
  code: string;
  name: string;
  distanceKm: number; // Km from NDLS (0)
  platforms: number;
  slackBufferMins: number; // Built-in timetable slack before/at this junction
  isMajorJunction: boolean;
}

export interface SignalingBlock {
  id: string; // e.g. "UP-BLK-05"
  line: 'UP' | 'DOWN';
  startKm: number;
  endKm: number;
  aspect: SignalAspect;
  occupiedByTrainId: string | null;
  hasTSR: boolean;
  tsrSpeedLimitKmH?: number;
  isSignalFaulty: boolean;
}

export interface Train {
  id: string; // e.g. "12004"
  number: string;
  name: string;
  shortName: string;
  line: 'UP' | 'DOWN';
  priority: PriorityLevel;
  maxTargetSpeedKmH: number;
  currentSpeedKmH: number;
  positionKm: number; // 0 to 435 km
  currentBlockId: string;
  signalAspect: SignalAspect;
  scheduledArrival: string; // HH:mm format
  baseETA: string; // Original timetable ETA
  dynamicETA: string; // Dynamic predicted ETA calculated by model
  rawDelayMins: number; // Delay calculated purely from speed drop
  slackAbsorbedMins: number; // Slack subtracted by smart engine
  netDelayMins: number; // Net delay displayed = rawDelay - slackAbsorbed
  causalTag: string; // Real-time bottleneck attribution e.g. "Trailing BOXN-9024 by 6.2km"
  colorHex: string;
  status: 'RUNNING' | 'CAUTION' | 'HALTED' | 'ARRIVED';
}

export type ScenarioPreset = 'NORMAL' | 'SIGNAL_FAIL' | 'TSR' | 'FREIGHT_OVERTAKE' | 'CUSTOM';

export interface AdvisoryAction {
  id: string;
  trainId: string;
  actionText: string;
  impactMinutes: number; // e.g. -14 mins saved
  type: 'DIVERT_LOOP' | 'OVERTAKE_PRIORITY' | 'CLEAR_SIGNAL' | 'SPEED_HOLD';
  applied: boolean;
}
