import type { EmergencyState } from '../../types';

// Simulation-local types for the Virtual Drone Simulator Phase 2
// These are used by the local simulation engine.
// When the backend is connected in Phase 3, the SimulationService will
// forward these from backend telemetry instead of computing locally.

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MotorSimState {
  id: number;        // 1-4
  rpm: number;
  thrust: number;    // N
  efficiency: number; // 0-1
  temperature: number;
}

export interface BatterySimState {
  percentage: number;
  voltage: number;
  current: number;
  temperature: number;
}

export interface EnvironmentSimState {
  windSpeed: number;       // m/s
  windDirection: number;   // degrees 0=N
  windVx: number;
  windVy: number;
  turbulence: number;      // 0-1
  temperature: number;     // C
  airDensity: number;      // kg/m3
  visibility: number;      // 0-1 (1.0 = clear, 0.2 = dense fog)
  rain: boolean;
}

export type MissionPhase =
  | 'IDLE'
  | 'TAKEOFF'
  | 'NAVIGATING'
  | 'HOVERING'
  | 'RETURNING'
  | 'LANDING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'ABORTED';

export type ScenarioType =
  | 'NORMAL'
  | 'HIGH_WIND'
  | 'STORM'
  | 'FOG'
  | 'MOTOR_DEGRADATION'
  | 'LOW_BATTERY'
  | 'SENSOR_NOISE'
  | 'PAYLOAD_INCREASE'
  | 'COMBINED';

export interface Waypoint {
  id: number;
  name: string;
  position: Vec3;   // x=East, y=North, z=Alt AGL
  speed: number;    // m/s approach speed
  loiterTime: number; // seconds to hover
  status: 'UPCOMING' | 'CURRENT' | 'COMPLETED';
}

export interface SimulationState {
  // Drone physical state
  position: Vec3;
  velocity: Vec3;
  acceleration: Vec3;

  // Attitude in degrees
  roll: number;
  pitch: number;
  yaw: number;

  // Angular rates in deg/s (6-DoF)
  angularRates: Vec3;

  // Motors
  motors: MotorSimState[];

  // Battery
  battery: BatterySimState;

  // Environment
  environment: EnvironmentSimState;

  // Payload
  payloadKg: number;

  // Mission state
  phase: MissionPhase;
  waypoints: Waypoint[];
  currentWaypointIndex: number;
  missionProgress: number;  // 0-1
  missionElapsed: number;   // seconds
  loiterRemaining: number;  // seconds
  distanceToNext: number;   // m
  etaToNext: number;        // s

  // Scenario
  scenario: ScenarioType;

  // Authoritative Emergency State
  emergency?: EmergencyState;

  // Meta
  simulationTime: number;   // seconds since start
  frameCount: number;
  running: boolean;
  paused: boolean;
  updateHz: number;
}

export interface PhysicsValidationItem {
  id: string;
  name: string;
  status: 'PASS' | 'PARTIAL' | 'FAIL';
  metric: string;
  beforeValue: string;
  afterValue: string;
  equation: string;
  details: string;
}

export interface PhysicsValidationReport {
  timestamp: number;
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  passedCount: number;
  totalCount: number;
  items: PhysicsValidationItem[];
}

export const DEFAULT_WAYPOINTS: Waypoint[] = [
  { id: 0, name: 'HOME', position: { x: 0, y: 0, z: 0 }, speed: 2, loiterTime: 0, status: 'COMPLETED' },
  { id: 1, name: 'WP-01', position: { x: 30, y: 0, z: 30 }, speed: 6, loiterTime: 3, status: 'UPCOMING' },
  { id: 2, name: 'WP-02', position: { x: 60, y: 30, z: 40 }, speed: 8, loiterTime: 3, status: 'UPCOMING' },
  { id: 3, name: 'WP-03', position: { x: 40, y: 70, z: 35 }, speed: 8, loiterTime: 3, status: 'UPCOMING' },
  { id: 4, name: 'WP-04', position: { x: -20, y: 50, z: 30 }, speed: 6, loiterTime: 3, status: 'UPCOMING' },
  { id: 5, name: 'HOME', position: { x: 0, y: 0, z: 0 }, speed: 5, loiterTime: 0, status: 'UPCOMING' },
];

export const SCENARIO_PARAMS: Record<ScenarioType, {
  windSpeed: number;
  turbulence: number;
  visibility: number;
  rain: boolean;
  motorDegradation: number; // 0=none, 1=full
  batteryDrainMultiplier: number;
  payloadExtra: number;
  sensorNoise: number;
}> = {
  NORMAL:             { windSpeed: 2,  turbulence: 0.0,  visibility: 1.0,  rain: false, motorDegradation: 0,    batteryDrainMultiplier: 1.0, payloadExtra: 0,   sensorNoise: 0 },
  HIGH_WIND:          { windSpeed: 14, turbulence: 0.45, visibility: 0.85, rain: false, motorDegradation: 0,    batteryDrainMultiplier: 1.5, payloadExtra: 0,   sensorNoise: 0.1 },
  STORM:              { windSpeed: 18, turbulence: 0.75, visibility: 0.35, rain: true,  motorDegradation: 0,    batteryDrainMultiplier: 2.2, payloadExtra: 0.1, sensorNoise: 0.25 },
  FOG:                { windSpeed: 3,  turbulence: 0.08, visibility: 0.20, rain: false, motorDegradation: 0,    batteryDrainMultiplier: 1.1, payloadExtra: 0,   sensorNoise: 0.05 },
  MOTOR_DEGRADATION:  { windSpeed: 2,  turbulence: 0.0,  visibility: 1.0,  rain: false, motorDegradation: 0.4,  batteryDrainMultiplier: 1.25, payloadExtra: 0,   sensorNoise: 0 },
  LOW_BATTERY:        { windSpeed: 2,  turbulence: 0.0,  visibility: 1.0,  rain: false, motorDegradation: 0,    batteryDrainMultiplier: 3.2, payloadExtra: 0,   sensorNoise: 0 },
  SENSOR_NOISE:       { windSpeed: 3,  turbulence: 0.1,  visibility: 0.95, rain: false, motorDegradation: 0,    batteryDrainMultiplier: 1.0, payloadExtra: 0,   sensorNoise: 0.5 },
  PAYLOAD_INCREASE:   { windSpeed: 2,  turbulence: 0.0,  visibility: 1.0,  rain: false, motorDegradation: 0,    batteryDrainMultiplier: 1.35, payloadExtra: 0.4, sensorNoise: 0 },
  COMBINED:           { windSpeed: 11, turbulence: 0.35, visibility: 0.75, rain: false, motorDegradation: 0.25, batteryDrainMultiplier: 2.1, payloadExtra: 0.2, sensorNoise: 0.3 },
};

export function computeSimulationEmergency(s: SimulationState): EmergencyState {
  const windSpd = s.environment.windSpeed;
  const batPct = s.battery.percentage;
  const m3Eff = s.motors[2]?.efficiency ?? 1.0;
  const isStorm = s.scenario === 'STORM' || s.environment.rain || windSpd > 16;
  const isHighWind = s.scenario === 'HIGH_WIND' || (windSpd > 10 && !isStorm);
  const isMotorFault = s.scenario === 'MOTOR_DEGRADATION' || m3Eff < 0.75;
  const isLowBattery = s.scenario === 'LOW_BATTERY' || batPct < 25;
  const isFog = s.scenario === 'FOG' || (s.environment.visibility !== undefined && s.environment.visibility < 0.35);
  const isCombined = s.scenario === 'COMBINED';

  if (isCombined) {
    return {
      emergencyActive: true,
      emergencyType: 'COMBINED_FAILURE',
      emergencySeverity: 'CRITICAL',
      emergencyReason: 'Multiple concurrent system hazards: high wind, Motor 3 fault, and rapid battery sag',
      affectedComponent: 'MULTIPLE_SYSTEMS',
      environmentCondition: `Severe Wind (${windSpd.toFixed(1)} m/s, Turb: ${Math.round(s.environment.turbulence * 100)}%)`,
      safetyEnvelopeStatus: 'BREACH',
      recommendedAction: 'RETURN_TO_BASE',
      contributingFactors: [
        `Wind above safe margin (${windSpd.toFixed(1)} m/s)`,
        `Motor 3 efficiency degraded to ${Math.round(m3Eff * 100)}%`,
        `Energy reserve reduced (${batPct.toFixed(1)}%)`,
        '10s Predicted trajectory corridor breach',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  if (isStorm) {
    return {
      emergencyActive: true,
      emergencyType: 'STORM',
      emergencySeverity: 'CRITICAL',
      emergencyReason: `Gale-force storm (${windSpd.toFixed(1)} m/s) with active precipitation and airframe buffeting`,
      affectedComponent: 'ENVIRONMENT',
      environmentCondition: `Storm Gale (${windSpd.toFixed(1)} m/s, Rain)`,
      safetyEnvelopeStatus: 'BREACH',
      recommendedAction: 'RETURN_TO_BASE',
      contributingFactors: [
        `Gale velocity (${windSpd.toFixed(1)} m/s) exceeds 15.0 m/s envelope`,
        'Active rain precipitation impacting optical sensors and motor sealings',
        'Severe aerodynamic lateral drift',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  if (isMotorFault) {
    return {
      emergencyActive: true,
      emergencyType: 'MOTOR_FAULT',
      emergencySeverity: 'CRITICAL',
      emergencyReason: `Motor 3 efficiency dropped to ${Math.round(m3Eff * 100)}% (thrust loss threatening roll/pitch authority)`,
      affectedComponent: 'MOTOR_3',
      environmentCondition: `Wind: ${windSpd.toFixed(1)} m/s`,
      safetyEnvelopeStatus: 'BREACH',
      recommendedAction: 'RETURN_TO_BASE',
      contributingFactors: [
        `Motor 3 operating at ${Math.round(m3Eff * 100)}% output (asymmetric torque)`,
        'Compensatory yaw/pitch counter-trim active',
        'Return to base required to prevent loss of control',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  if (isLowBattery) {
    return {
      emergencyActive: true,
      emergencyType: 'LOW_BATTERY',
      emergencySeverity: batPct < 15 ? 'CRITICAL' : 'WARNING',
      emergencyReason: `Battery reserve dropped to ${batPct.toFixed(1)}% under accelerated discharge`,
      affectedComponent: 'BATTERY',
      environmentCondition: `Wind: ${windSpd.toFixed(1)} m/s`,
      safetyEnvelopeStatus: batPct < 20 ? 'BREACH' : 'WARNING',
      recommendedAction: batPct < 20 ? 'RETURN_TO_BASE' : 'REDUCE_SPEED',
      contributingFactors: [
        `Battery capacity at ${batPct.toFixed(1)}%`,
        'Predicted landing reserve below 20.0% safety threshold',
        'Rapid cell voltage sag under cruise load',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  if (isHighWind) {
    return {
      emergencyActive: true,
      emergencyType: 'HIGH_WIND',
      emergencySeverity: 'WARNING',
      emergencyReason: `High atmospheric crosswind (${windSpd.toFixed(1)} m/s) causing elevated aerodynamic drift`,
      affectedComponent: 'ENVIRONMENT',
      environmentCondition: `Crosswind (${windSpd.toFixed(1)} m/s, Turb: ${Math.round(s.environment.turbulence * 100)}%)`,
      safetyEnvelopeStatus: 'WARNING',
      recommendedAction: 'REDUCE_SPEED',
      contributingFactors: [
        `Crosswind speed: ${windSpd.toFixed(1)} m/s`,
        'Turbulent gust buffeting active',
        'Lateral trajectory displacement approaching 3.5m boundary',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  if (isFog) {
    return {
      emergencyActive: true,
      emergencyType: 'FOG',
      emergencySeverity: 'WARNING',
      emergencyReason: `Heavy atmospheric fog with optical visibility reduced to ${Math.round((s.environment.visibility ?? 0.2) * 100)}%`,
      affectedComponent: 'ENVIRONMENT',
      environmentCondition: `Dense Fog (Vis: ${Math.round((s.environment.visibility ?? 0.2) * 100)}%)`,
      safetyEnvelopeStatus: 'WARNING',
      recommendedAction: 'REDUCE_SPEED',
      contributingFactors: [
        `Optical visibility at ${Math.round((s.environment.visibility ?? 0.2) * 100)}%`,
        'Visual collision avoidance range degraded',
        'Speed reduction recommended for situational awareness',
      ],
      timestamp: Date.now(),
      sequence: s.frameCount,
    };
  }

  return {
    emergencyActive: false,
    emergencyType: 'NONE',
    emergencySeverity: 'LOW',
    emergencyReason: 'Nominal flight conditions. All physical parameters within safe envelope.',
    affectedComponent: 'NONE',
    environmentCondition: `Calm (${windSpd.toFixed(1)} m/s)`,
    safetyEnvelopeStatus: 'SAFE',
    recommendedAction: 'CONTINUE_MISSION',
    contributingFactors: ['Atmosphere calm', 'Motors nominal', 'Battery reserve safe'],
    timestamp: Date.now(),
    sequence: s.frameCount,
  };
}
