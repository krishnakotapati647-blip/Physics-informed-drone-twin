import type {
  EmergencyState,
  VehicleHealth,
  EnergyState,
  SafeOperatingEnvelope,
  PredictedState,
  AutonomousDecision,
  ComponentHealth,
} from '../../types';

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

export function computeLocalVehicleHealth(s: SimulationState): VehicleHealth {
  const compHealths: ComponentHealth[] = s.motors.map((m) => {
    const eff = m.efficiency;
    return {
      component: `Motor ${m.id}`,
      health: +eff.toFixed(2),
      status: eff < 0.65 ? 'CRITICAL' : eff < 0.85 ? 'DEGRADED' : 'NOMINAL',
      temperature: +m.temperature.toFixed(1),
      notes: eff < 0.65 ? `Degraded thrust (${Math.round(eff * 100)}%)` : 'Nominal operation',
    };
  });

  const batPct = s.battery.percentage;
  const batComp: ComponentHealth = {
    component: 'Battery',
    health: +(batPct / 100).toFixed(2),
    status: batPct < 15 ? 'CRITICAL' : batPct < 30 ? 'DEGRADED' : 'NOMINAL',
    temperature: +s.battery.temperature.toFixed(1),
    notes: batPct < 15 ? 'Critical depletion' : batPct < 30 ? 'Low reserve' : 'Voltage nominal',
  };

  const turb = s.environment.turbulence;
  const structHealth = Math.max(0.2, 1.0 - turb * 0.4);
  const structComp: ComponentHealth = {
    component: 'Structure',
    health: +structHealth.toFixed(2),
    status: structHealth > 0.75 ? 'NOMINAL' : 'DEGRADED',
    temperature: s.environment.temperature,
    notes: structHealth > 0.75 ? 'Airframe nominal' : 'Elevated buffeting',
  };

  const sensorsComp: ComponentHealth = {
    component: 'Sensors',
    health: 1.0,
    status: 'NOMINAL',
    temperature: 25.0,
    notes: 'IMU calibrated',
  };

  const overall = +(
    (compHealths.reduce((sum, c) => sum + c.health, 0) + batComp.health + structComp.health) / 6
  ).toFixed(2);

  const isCrit = compHealths.some((c) => c.status === 'CRITICAL') || batComp.status === 'CRITICAL';
  const isDeg = compHealths.some((c) => c.status === 'DEGRADED') || batComp.status === 'DEGRADED' || structComp.status === 'DEGRADED';

  return {
    timestamp: Date.now(),
    overall,
    status: isCrit ? 'CRITICAL' : isDeg ? 'DEGRADED' : 'NOMINAL',
    motor1: compHealths[0],
    motor2: compHealths[1],
    motor3: compHealths[2],
    motor4: compHealths[3],
    battery: batComp,
    structure: structComp,
    sensors: sensorsComp,
  };
}

export function computeLocalEnergyState(s: SimulationState): EnergyState {
  const v = s.battery.voltage;
  const i = s.battery.current;
  const powerW = Math.max(10, v * i);
  const remMah = (s.battery.percentage / 100) * 5200;
  const energyRemWh = (remMah * v) / 1000;
  const consumedWh = ((5200 - remMah) * v) / 1000;
  const horizSpeed = Math.sqrt(s.velocity.x * s.velocity.x + s.velocity.y * s.velocity.y);
  const enduranceS = (energyRemWh / powerW) * 3600;
  const rangeM = horizSpeed * enduranceS;
  const landingDrainPct = (45.0 / Math.max(1, enduranceS)) * s.battery.percentage;
  const landingBatPct = Math.max(0, s.battery.percentage - landingDrainPct);

  return {
    timestamp: Date.now(),
    battery_percent: +s.battery.percentage.toFixed(1),
    power_w: +powerW.toFixed(1),
    energy_remaining_wh: +energyRemWh.toFixed(2),
    energy_consumed_wh: +consumedWh.toFixed(2),
    endurance_s: Math.round(enduranceS),
    range_m: Math.round(rangeM),
    landing_battery_pct: +landingBatPct.toFixed(1),
    consumption_rate_wh_per_s: +(powerW / 3600).toFixed(4),
  };
}

export function computeLocalSafetyEnvelope(s: SimulationState): SafeOperatingEnvelope {
  const windSpd = s.environment.windSpeed;
  const batPct = s.battery.percentage;
  const speed = Math.sqrt(s.velocity.x * s.velocity.x + s.velocity.y * s.velocity.y + s.velocity.z * s.velocity.z);
  const alt = s.position.z;
  const m3Eff = s.motors[2]?.efficiency ?? 1.0;

  const violations: string[] = [];
  const warnings: string[] = [];

  if (windSpd > 15.0) violations.push(`Wind limit breached: ${windSpd.toFixed(1)} m/s (max 15.0)`);
  else if (windSpd > 10.0) warnings.push(`High wind: ${windSpd.toFixed(1)} m/s`);

  if (batPct < 20.0) violations.push(`Critical battery: ${batPct.toFixed(1)}% (min 20.0%)`);
  else if (batPct < 30.0) warnings.push(`Low battery: ${batPct.toFixed(1)}%`);

  if (m3Eff < 0.70) violations.push(`Motor 3 efficiency critical: ${Math.round(m3Eff * 100)}%`);

  const status = violations.length > 0 ? 'OUTSIDE_ENVELOPE' : warnings.length > 0 ? 'WARNING' : 'SAFE';

  return {
    timestamp: Date.now(),
    status,
    overall_score: status === 'SAFE' ? 0.95 : status === 'WARNING' ? 0.72 : 0.35,
    max_wind_ms: 15.0,
    max_speed_ms: 15.0,
    max_altitude_m: 120.0,
    max_payload_kg: 2.0,
    min_battery_pct: 20.0,
    max_temperature_c: 65.0,
    wind_margin: +(15.0 - windSpd).toFixed(1),
    speed_margin: +(15.0 - speed).toFixed(1),
    altitude_margin: +(120.0 - alt).toFixed(1),
    battery_margin: +(batPct - 20.0).toFixed(1),
    payload_margin: +(2.0 - s.payloadKg).toFixed(1),
    temperature_margin: +(65.0 - (s.motors[0]?.temperature ?? 25)).toFixed(1),
    violations,
    warnings,
    predicted_risk_score: violations.length > 0 ? 88 : warnings.length > 0 ? 45 : 8,
    predicted_time_to_breach_s: violations.length > 0 ? 0 : warnings.length > 0 ? 12 : null,
  };
}

export function computeLocalPrediction(s: SimulationState): PredictedState {
  const steps = 10;
  const dt = 1.0;
  const traj: Vec3[] = [];
  let curX = s.position.x;
  let curY = s.position.y;
  let curZ = s.position.z;
  let vx = s.velocity.x;
  let vy = s.velocity.y;

  const windAx = s.environment.windVx * 0.015;
  const windAy = s.environment.windVy * 0.015;

  for (let t = 1; t <= steps; t++) {
    vx += windAx * dt;
    vy += windAy * dt;
    curX += vx * dt;
    curY += vy * dt;
    curZ = Math.max(0, curZ + s.velocity.z * dt);
    traj.push({ x: +curX.toFixed(2), y: +curY.toFixed(2), z: +curZ.toFixed(2) });
  }

  const driftX = curX - (s.position.x + s.velocity.x * 10);
  const driftY = curY - (s.position.y + s.velocity.y * 10);
  const driftMag = Math.sqrt(driftX * driftX + driftY * driftY);

  return {
    timestamp: Date.now(),
    horizon_s: 10.0,
    position: traj[traj.length - 1] ?? s.position,
    velocity: { vx: +vx.toFixed(2), vy: +vy.toFixed(2), vz: +s.velocity.z.toFixed(2) },
    attitude: { roll: s.roll, pitch: s.pitch, yaw: s.yaw },
    altitude: +(traj[traj.length - 1]?.z ?? s.position.z).toFixed(1),
    drift_m: { x: +driftX.toFixed(2), y: +driftY.toFixed(2) },
    confidence: +(0.98 - s.environment.turbulence * 0.25).toFixed(2),
    source: '6-DoF Physics Aerodynamic Trajectory Model',
    predicted_drift_magnitude_m: +driftMag.toFixed(2),
    predicted_landing_battery_pct: Math.max(0, +(s.battery.percentage - 4.5).toFixed(1)),
    trajectory: traj,
  };
}

export function computeLocalDecision(
  s: SimulationState,
  envelope: SafeOperatingEnvelope
): AutonomousDecision {
  const emerg = s.emergency;
  const isCrit = emerg?.emergencySeverity === 'CRITICAL' || envelope.status === 'OUTSIDE_ENVELOPE';
  const isWarn = emerg?.emergencySeverity === 'WARNING' || envelope.status === 'WARNING';

  let action: any = 'CONTINUE_MISSION';
  let reason = 'Nominal flight conditions. All physical parameters within safe envelope.';
  let suggestions = ['Maintain current flight trajectory', 'Monitor battery discharge rate'];

  if (isCrit) {
    action = 'RETURN_TO_BASE';
    reason = emerg?.emergencyReason ?? 'Critical flight safety envelope breach detected.';
    suggestions = [
      '1. Autonomous Mission Override: Return to Home commanded.',
      '2. Pitch/Roll Trim Stabilization: Compensate for asymmetric disturbance.',
      '3. Reserve Altitude: Maintain clearance until home waypoint reached.',
    ];
  } else if (isWarn) {
    action = 'REDUCE_SPEED';
    reason = emerg?.emergencyReason ?? 'Elevated environmental hazard. Velocity reduction recommended.';
    suggestions = [
      '1. Reduce cruise airspeed by 25% to minimize lateral aerodynamic drift.',
      '2. Increase attitude damping to counter turbulent gusts.',
    ];
  }

  return {
    timestamp: Date.now(),
    action,
    reason,
    triggering_conditions: envelope.violations.length > 0 ? envelope.violations : envelope.warnings.length > 0 ? envelope.warnings : ['Nominal flight envelope'],
    evidence_breakdown: emerg?.contributingFactors ?? ['Atmosphere calm', 'Motors nominal'],
    confidence: 0.98,
    priority: isCrit ? 5 : isWarn ? 3 : 1,
    overrides_mission: isCrit,
    risk_level: isCrit ? 'CRITICAL' : isWarn ? 'MODERATE' : 'NOMINAL',
    risk_score: isCrit ? 92 : isWarn ? 48 : 6,
    predicted_threat: emerg?.emergencyType !== 'NONE' ? emerg?.emergencyReason : 'None (Nominal corridor)',
    resolution_suggestions: suggestions,
  };
}

