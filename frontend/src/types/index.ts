// ============================================================
// SHARED DATA TYPES — Physics-Informed Drone Digital Twin
// These types are the data contract between frontend and backend.
// ============================================================

// ---------- Primitives ----------

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// ---------- Drone State ----------

export interface DronePosition {
  x: number;   // metres, East
  y: number;   // metres, North
  z: number;   // metres, altitude AGL
}

export interface DroneVelocity {
  vx: number;  // m/s East
  vy: number;  // m/s North
  vz: number;  // m/s Up
}

export interface DroneAcceleration {
  ax: number;
  ay: number;
  az: number;
}

export interface DroneAttitude {
  roll: number;    // degrees
  pitch: number;   // degrees
  yaw: number;     // degrees
}

export interface DroneAngularRates {
  roll_rate: number;   // deg/s
  pitch_rate: number;
  yaw_rate: number;
}

// ---------- Motor State ----------

export interface MotorState {
  id: number;             // 1-4
  rpm: number;
  thrust: number;         // Newtons
  efficiency: number;     // 0-1
  temperature: number;    // °C
  health: number;         // 0-1
}

// ---------- Battery State ----------

export interface BatteryState {
  percentage: number;       // 0-100
  voltage: number;          // V
  current: number;          // A
  temperature: number;      // °C
  capacity_mah: number;
  remaining_mah: number;
  health: number;           // 0-1
}

// ---------- Environment State ----------

export interface EnvironmentState {
  wind_speed: number;       // m/s
  wind_direction: number;   // degrees (0=North, 90=East)
  wind_vx: number;          // wind x-component m/s
  wind_vy: number;          // wind y-component m/s
  turbulence: number;       // 0-1 intensity
  temperature: number;      // °C
  air_density: number;      // kg/m³
  pressure: number;         // hPa
  visibility: number;       // 0-1 (1.0 = clear, 0.2 = dense fog)
  rain?: boolean;
}

// ---------- Telemetry ----------

export interface TelemetryFrame {
  timestamp: number;          // Unix ms
  drone_id: string;
  sequence: number;

  // State
  position: DronePosition;
  velocity: DroneVelocity;
  acceleration: DroneAcceleration;
  attitude: DroneAttitude;
  angular_rates: DroneAngularRates;

  // Actuators
  motors: MotorState[];
  battery: BatteryState;

  // Environment (as observed by drone)
  environment: EnvironmentState;

  // Payload
  payload_kg: number;

  // Flight state
  flight_mode: FlightMode;
  mission_state: MissionState;

  // Authoritative Emergency & Scenario State
  emergency?: EmergencyState;
  scenario?: ScenarioType;
}

// ---------- Emergency State & Timeline ----------

export type EmergencySeverity = 'LOW' | 'WARNING' | 'CRITICAL';

export type EmergencyType =
  | 'NONE'
  | 'HIGH_WIND'
  | 'STORM'
  | 'FOG'
  | 'MOTOR_FAULT'
  | 'LOW_BATTERY'
  | 'PAYLOAD_EXCESS'
  | 'COMBINED_FAILURE'
  | 'ENVELOPE_BREACH';

export interface EmergencyState {
  emergencyActive: boolean;
  emergencyType: EmergencyType;
  emergencySeverity: EmergencySeverity;
  emergencyReason: string;
  affectedComponent: string;
  environmentCondition?: string;
  safetyEnvelopeStatus: 'SAFE' | 'WARNING' | 'BREACH';
  recommendedAction: string;
  contributingFactors: string[];
  timestamp: number;
  sequence?: number;
}

export interface EmergencyEvent {
  id: string;
  timestamp: number;
  timeStr: string;
  type: string;
  message: string;
  severity: EmergencySeverity;
}

// ---------- Mission ----------

export type FlightMode =
  | 'GROUND'
  | 'TAKEOFF'
  | 'CRUISE'
  | 'HOVER'
  | 'LANDING'
  | 'EMERGENCY';

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

export interface Waypoint {
  id: number;
  name: string;
  position: DronePosition;
  speed_ms: number;
  loiter_s: number;         // seconds to hover at waypoint
}

export interface MissionState {
  mission_id: string;
  mission_name: string;
  phase: MissionPhase;
  current_waypoint_index: number;
  total_waypoints: number;
  waypoints: Waypoint[];
  progress: number;         // 0-1
  distance_to_next_m: number;
  eta_s: number;            // seconds to next waypoint
  elapsed_s: number;
  start_time: number | null;
}

// ---------- Vehicle Health ----------

export interface ComponentHealth {
  component: string;
  health: number;           // 0-1
  status: HealthStatus;
  temperature: number;
  notes: string;
}

export type HealthStatus = 'NOMINAL' | 'DEGRADED' | 'CRITICAL' | 'FAILED';

export interface VehicleHealth {
  timestamp: number;
  overall: number;          // 0-1
  status: HealthStatus;
  motor1: ComponentHealth;
  motor2: ComponentHealth;
  motor3: ComponentHealth;
  motor4: ComponentHealth;
  battery: ComponentHealth;
  structure: ComponentHealth;
  sensors: ComponentHealth;
}

// ---------- Energy / Endurance ----------

export interface EnergyState {
  timestamp: number;
  battery_percent: number;
  power_w: number;          // Current total power draw
  energy_remaining_wh: number;
  energy_consumed_wh: number;
  endurance_s: number;      // Estimated remaining flight time (seconds)
  range_m: number;          // Estimated range at current speed
  landing_battery_pct: number; // Predicted battery at landing
  consumption_rate_wh_per_s: number;
}

// ---------- Prediction ----------

export interface PredictedState {
  timestamp: number;
  horizon_s: number;        // prediction look-ahead (seconds)
  position: DronePosition;
  velocity: DroneVelocity;
  attitude: DroneAttitude;
  altitude: number;
  drift_m: Vec2;            // lateral drift from intended path
  confidence: number;       // 0-1
  source: string;
  model_type?: string;
  predicted_drift_magnitude_m?: number;
  predicted_landing_battery_pct?: number;
  trajectory?: DronePosition[];
}

// ---------- Safe Operating Envelope ----------

export type EnvelopeStatus = 'SAFE' | 'WARNING' | 'OUTSIDE_ENVELOPE';

export interface SafeOperatingEnvelope {
  timestamp: number;
  status: EnvelopeStatus;
  overall_score: number;     // 0-1

  // Limits
  max_wind_ms: number;
  max_speed_ms: number;
  max_altitude_m: number;
  max_payload_kg: number;
  min_battery_pct: number;
  max_temperature_c: number;

  // Current vs limit
  wind_margin: number;       // positive = within limit
  speed_margin: number;
  altitude_margin: number;
  battery_margin: number;
  payload_margin: number;
  temperature_margin: number;

  // Violated constraints
  violations: string[];
  warnings: string[];

  // Predictive Risk & Breach Forecast
  predicted_risk_score?: number;            // 0 - 100%
  predicted_time_to_breach_s?: number | null; // estimated seconds to breach
}

// ---------- Anomaly ----------

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Anomaly {
  id: string;
  timestamp: number;
  type: string;
  severity: AnomalySeverity;
  component: string;
  description: string;
  evidence: string;
  predicted_effect: string;
  acknowledged: boolean;
}

// ---------- Autonomous Decision ----------

export type DecisionAction =
  | 'CONTINUE_MISSION'
  | 'REDUCE_SPEED'
  | 'MODIFY_TRAJECTORY'
  | 'RETURN_TO_BASE'
  | 'ABORT_MISSION'
  | 'HOLD_POSITION';

export type RiskLevel = 'NOMINAL' | 'LOW' | 'MODERATE' | 'ELEVATED' | 'SEVERE' | 'CRITICAL';

export interface AutonomousDecision {
  timestamp: number;
  action: DecisionAction;
  reason: string;
  triggering_conditions: string[];
  evidence_breakdown?: string[];
  confidence: number;       // 0-1
  priority: number;         // 1 (low) - 5 (critical)
  overrides_mission: boolean;
  model_source?: string;
  recommended_speed_mps?: number;

  // Predictive Risk Assessment & Resolution Suggestions
  risk_level?: RiskLevel;
  risk_score?: number;                   // 0 - 100%
  time_to_breach_s?: number | null;      // Estimated seconds until corridor/safety breach
  predicted_threat?: string;             // Primary forecast hazard description
  resolution_suggestions?: string[];     // Actionable engineering resolvement steps
  mitigation_strategy?: string;          // Strategic classification
}

// ---------- Scenario ----------

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

export interface ScenarioConfig {
  type: ScenarioType;
  name: string;
  description: string;
  parameters: Record<string, number>;
}

// ---------- Alert ----------

export interface Alert {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  title: string;
  message: string;
  component: string;
  acknowledged: boolean;
}

// ---------- Digital Twin Sync ----------

export interface DigitalTwinStatus {
  connected: boolean;
  last_update_ms: number;
  telemetry_hz: number;
  latency_ms: number;
  physics_engine_status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  ai_model_status: 'READY' | 'PREDICTING' | 'TRAINING' | 'OFFLINE';
  backend_status: 'CONNECTED' | 'RECONNECTING' | 'OFFLINE';
}

// ---------- WebSocket Messages ----------

export type WSMessageType =
  | 'TELEMETRY'
  | 'MISSION_STATE'
  | 'VEHICLE_HEALTH'
  | 'ENERGY_STATE'
  | 'PREDICTION'
  | 'SAFETY_ENVELOPE'
  | 'EMERGENCY'
  | 'ANOMALY'
  | 'DECISION'
  | 'ALERT'
  | 'DT_STATUS'
  | 'COMMAND_ACK'
  | 'ERROR';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  timestamp: number;
  payload: T;
}

// ---------- Commands ----------

export type CommandType =
  | 'START'
  | 'PAUSE'
  | 'RESUME'
  | 'RESET'
  | 'RETURN_TO_BASE'
  | 'ABORT'
  | 'SCENARIO_CHANGE';

export interface Command {
  type: CommandType;
  payload?: Record<string, unknown>;
  timestamp: number;
}

// ---------- Flight History ----------

export interface FlightHistoryEntry {
  id: string;
  mission_id: string;
  start_time: number;
  end_time: number | null;
  duration_s: number;
  total_distance_m: number;
  max_altitude_m: number;
  avg_speed_ms: number;
  battery_consumed_pct: number;
  anomalies_detected: number;
  decisions_made: number;
  scenario: ScenarioType;
  outcome: 'COMPLETED' | 'RETURNED' | 'ABORTED' | 'IN_PROGRESS';
}
