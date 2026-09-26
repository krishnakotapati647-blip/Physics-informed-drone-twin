"""
Pydantic data models — shared data contract.
These mirror the TypeScript types in frontend/src/types/index.ts
"""
from __future__ import annotations

import time
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


# ---------- Enums ----------

class FlightMode(str, Enum):
    GROUND = "GROUND"
    TAKEOFF = "TAKEOFF"
    CRUISE = "CRUISE"
    HOVER = "HOVER"
    LANDING = "LANDING"
    EMERGENCY = "EMERGENCY"


class MissionPhase(str, Enum):
    IDLE = "IDLE"
    TAKEOFF = "TAKEOFF"
    NAVIGATING = "NAVIGATING"
    HOVERING = "HOVERING"
    RETURNING = "RETURNING"
    LANDING = "LANDING"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"


class HealthStatus(str, Enum):
    NOMINAL = "NOMINAL"
    DEGRADED = "DEGRADED"
    CRITICAL = "CRITICAL"
    FAILED = "FAILED"


class EnvelopeStatus(str, Enum):
    SAFE = "SAFE"
    WARNING = "WARNING"
    OUTSIDE_ENVELOPE = "OUTSIDE_ENVELOPE"


class AnomalySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class DecisionAction(str, Enum):
    CONTINUE_MISSION = "CONTINUE_MISSION"
    REDUCE_SPEED = "REDUCE_SPEED"
    MODIFY_TRAJECTORY = "MODIFY_TRAJECTORY"
    RETURN_TO_BASE = "RETURN_TO_BASE"
    ABORT_MISSION = "ABORT_MISSION"
    HOLD_POSITION = "HOLD_POSITION"


class ScenarioType(str, Enum):
    NORMAL = "NORMAL"
    HIGH_WIND = "HIGH_WIND"
    STORM = "STORM"
    FOG = "FOG"
    MOTOR_DEGRADATION = "MOTOR_DEGRADATION"
    LOW_BATTERY = "LOW_BATTERY"
    SENSOR_NOISE = "SENSOR_NOISE"
    PAYLOAD_INCREASE = "PAYLOAD_INCREASE"
    COMBINED = "COMBINED"


class CommandType(str, Enum):
    START = "START"
    PAUSE = "PAUSE"
    RESUME = "RESUME"
    RESET = "RESET"
    RETURN_TO_BASE = "RETURN_TO_BASE"
    ABORT = "ABORT"
    SCENARIO_CHANGE = "SCENARIO_CHANGE"


class WSMessageType(str, Enum):
    TELEMETRY = "TELEMETRY"
    MISSION_STATE = "MISSION_STATE"
    VEHICLE_HEALTH = "VEHICLE_HEALTH"
    ENERGY_STATE = "ENERGY_STATE"
    PREDICTION = "PREDICTION"
    SAFETY_ENVELOPE = "SAFETY_ENVELOPE"
    EMERGENCY = "EMERGENCY"
    ANOMALY = "ANOMALY"
    DECISION = "DECISION"
    ALERT = "ALERT"
    DT_STATUS = "DT_STATUS"
    COMMAND_ACK = "COMMAND_ACK"
    ERROR = "ERROR"


# ---------- Emergency State ----------

class EmergencySeverity(str, Enum):
    LOW = "LOW"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class EmergencyType(str, Enum):
    NONE = "NONE"
    HIGH_WIND = "HIGH_WIND"
    STORM = "STORM"
    FOG = "FOG"
    MOTOR_FAULT = "MOTOR_FAULT"
    LOW_BATTERY = "LOW_BATTERY"
    PAYLOAD_EXCESS = "PAYLOAD_EXCESS"
    COMBINED_FAILURE = "COMBINED_FAILURE"
    ENVELOPE_BREACH = "ENVELOPE_BREACH"


class EmergencyState(BaseModel):
    emergencyActive: bool = False
    emergencyType: EmergencyType = EmergencyType.NONE
    emergencySeverity: EmergencySeverity = EmergencySeverity.LOW
    emergencyReason: str = "Nominal flight envelope"
    affectedComponent: str = "NONE"
    environmentCondition: Optional[str] = None
    safetyEnvelopeStatus: str = "SAFE"
    recommendedAction: str = "CONTINUE_MISSION"
    contributingFactors: list[str] = Field(default_factory=list)
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    sequence: int = 0


# ---------- Primitives ----------

class Vec3(BaseModel):
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class Vec2(BaseModel):
    x: float = 0.0
    y: float = 0.0


# ---------- Drone State Components ----------

class DronePosition(BaseModel):
    x: float = 0.0   # metres, East
    y: float = 0.0   # metres, North
    z: float = 0.0   # metres, altitude AGL


class DroneVelocity(BaseModel):
    vx: float = 0.0
    vy: float = 0.0
    vz: float = 0.0


class DroneAcceleration(BaseModel):
    ax: float = 0.0
    ay: float = 0.0
    az: float = 0.0


class DroneAttitude(BaseModel):
    roll: float = 0.0    # degrees
    pitch: float = 0.0
    yaw: float = 0.0


class DroneAngularRates(BaseModel):
    roll_rate: float = 0.0
    pitch_rate: float = 0.0
    yaw_rate: float = 0.0


class MotorState(BaseModel):
    id: int
    rpm: float = 0.0
    thrust: float = 0.0       # Newtons
    efficiency: float = 1.0   # 0-1
    temperature: float = 25.0 # °C
    health: float = 1.0       # 0-1


class BatteryState(BaseModel):
    percentage: float = 100.0
    voltage: float = 14.8
    current: float = 0.0
    temperature: float = 25.0
    capacity_mah: float = 5200.0
    remaining_mah: float = 5200.0
    health: float = 1.0


class EnvironmentState(BaseModel):
    wind_speed: float = 0.0
    wind_direction: float = 0.0    # degrees
    wind_vx: float = 0.0
    wind_vy: float = 0.0
    turbulence: float = 0.0
    temperature: float = 25.0
    air_density: float = 1.225
    pressure: float = 1013.25
    visibility: float = 1.0        # 0.0 to 1.0 (1.0 = clear, 0.2 = dense fog)
    rain: bool = False


# ---------- Telemetry Frame ----------

class TelemetryFrame(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    drone_id: str = "DRONE-001"
    sequence: int = 0

    position: DronePosition = Field(default_factory=DronePosition)
    velocity: DroneVelocity = Field(default_factory=DroneVelocity)
    acceleration: DroneAcceleration = Field(default_factory=DroneAcceleration)
    attitude: DroneAttitude = Field(default_factory=DroneAttitude)
    angular_rates: DroneAngularRates = Field(default_factory=DroneAngularRates)

    motors: list[MotorState] = Field(default_factory=list)
    battery: BatteryState = Field(default_factory=BatteryState)
    environment: EnvironmentState = Field(default_factory=EnvironmentState)

    payload_kg: float = 0.0
    flight_mode: FlightMode = FlightMode.GROUND
    mission_state: Optional["MissionState"] = None
    emergency: Optional[EmergencyState] = None
    scenario: Optional[str] = None


# ---------- Mission ----------

class Waypoint(BaseModel):
    id: int
    name: str
    position: DronePosition
    speed_ms: float = 5.0
    loiter_s: float = 3.0


class MissionState(BaseModel):
    mission_id: str = "MISSION-001"
    mission_name: str = "Autonomous Survey"
    phase: MissionPhase = MissionPhase.IDLE
    current_waypoint_index: int = 0
    total_waypoints: int = 0
    waypoints: list[Waypoint] = Field(default_factory=list)
    progress: float = 0.0
    distance_to_next_m: float = 0.0
    eta_s: float = 0.0
    elapsed_s: float = 0.0
    start_time: Optional[float] = None


# ---------- Vehicle Health ----------

class ComponentHealth(BaseModel):
    component: str
    health: float = 1.0
    status: HealthStatus = HealthStatus.NOMINAL
    temperature: float = 25.0
    notes: str = ""


class VehicleHealth(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    overall: float = 1.0
    status: HealthStatus = HealthStatus.NOMINAL
    motor1: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Motor 1"))
    motor2: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Motor 2"))
    motor3: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Motor 3"))
    motor4: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Motor 4"))
    battery: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Battery"))
    structure: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Structure"))
    sensors: ComponentHealth = Field(default_factory=lambda: ComponentHealth(component="Sensors"))


# ---------- Energy ----------

class EnergyState(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    battery_percent: float = 100.0
    power_w: float = 0.0
    energy_remaining_wh: float = 0.0
    energy_consumed_wh: float = 0.0
    endurance_s: float = 0.0
    range_m: float = 0.0
    landing_battery_pct: float = 0.0
    consumption_rate_wh_per_s: float = 0.0


# ---------- Prediction ----------

class PredictedState(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    horizon_s: float = 10.0
    position: DronePosition = Field(default_factory=DronePosition)
    velocity: DroneVelocity = Field(default_factory=DroneVelocity)
    attitude: DroneAttitude = Field(default_factory=DroneAttitude)
    altitude: float = 0.0
    drift_m: Vec2 = Field(default_factory=Vec2)
    confidence: float = 1.0
    source: str = "PHYSICS-BASED PREDICTION (6-DoF EOM)"
    model_type: str = "PHYSICS_BASED_AERODYNAMIC_MODEL"
    predicted_drift_magnitude_m: float = 0.0
    predicted_landing_battery_pct: float = 0.0
    trajectory: list[DronePosition] = Field(default_factory=list)


# ---------- Safe Operating Envelope ----------

class SafeOperatingEnvelope(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    status: EnvelopeStatus = EnvelopeStatus.SAFE
    overall_score: float = 1.0
    max_wind_ms: float = 12.0
    max_speed_ms: float = 15.0
    max_altitude_m: float = 120.0
    max_payload_kg: float = 0.5
    min_battery_pct: float = 20.0
    max_temperature_c: float = 50.0
    wind_margin: float = 12.0
    speed_margin: float = 15.0
    altitude_margin: float = 120.0
    battery_margin: float = 80.0
    payload_margin: float = 0.5
    temperature_margin: float = 25.0
    violations: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    predicted_risk_score: int = 5
    predicted_time_to_breach_s: Optional[float] = None


# ---------- Anomaly ----------

class Anomaly(BaseModel):
    id: str
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    type: str
    severity: AnomalySeverity = AnomalySeverity.LOW
    component: str = ""
    description: str = ""
    evidence: str = ""
    predicted_effect: str = ""
    acknowledged: bool = False


# ---------- Decision ----------

class AutonomousDecision(BaseModel):
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    action: DecisionAction = DecisionAction.CONTINUE_MISSION
    reason: str = ""
    triggering_conditions: list[str] = Field(default_factory=list)
    evidence_breakdown: list[str] = Field(default_factory=list)
    confidence: float = 1.0
    priority: int = 1
    overrides_mission: bool = False
    model_source: str = "PHYSICS_BASED_REASONING_ENGINE"
    recommended_speed_mps: Optional[float] = None

    # Predictive Risk & Resolution Fields
    risk_level: str = "NOMINAL"
    risk_score: int = 5
    time_to_breach_s: Optional[float] = None
    predicted_threat: str = "None (Nominal Flight Corridor)"
    resolution_suggestions: list[str] = Field(default_factory=list)
    mitigation_strategy: str = "NOMINAL_MONITORING"


# ---------- Alert ----------

class Alert(BaseModel):
    id: str
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    level: str = "INFO"
    title: str = ""
    message: str = ""
    component: str = ""
    acknowledged: bool = False


# ---------- Scenario ----------

class ScenarioConfig(BaseModel):
    type: ScenarioType = ScenarioType.NORMAL
    name: str = "Normal Flight"
    description: str = ""
    parameters: dict[str, float] = Field(default_factory=dict)


# ---------- WebSocket Message ----------

class WSMessage(BaseModel):
    type: WSMessageType
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)
    payload: Any


# ---------- Command ----------

class Command(BaseModel):
    type: CommandType
    payload: Optional[dict[str, Any]] = None
    timestamp: float = Field(default_factory=lambda: time.time() * 1000)


# ---------- Digital Twin Status ----------

class DigitalTwinStatus(BaseModel):
    connected: bool = False
    last_update_ms: float = 0.0
    telemetry_hz: float = 0.0
    latency_ms: float = 0.0
    physics_engine_status: str = "STOPPED"
    ai_model_status: str = "OFFLINE"
    backend_status: str = "OFFLINE"


# ---------- Flight History ----------

class FlightHistoryEntry(BaseModel):
    id: str
    mission_id: str
    start_time: float
    end_time: Optional[float] = None
    duration_s: float = 0.0
    total_distance_m: float = 0.0
    max_altitude_m: float = 0.0
    avg_speed_ms: float = 0.0
    battery_consumed_pct: float = 0.0
    anomalies_detected: int = 0
    decisions_made: int = 0
    scenario: ScenarioType = ScenarioType.NORMAL
    outcome: str = "IN_PROGRESS"
