"""
REST API endpoints — Phase 1 skeleton (returns placeholder data).
Will be connected to real simulation state in Phase 3+.
"""
import time
from fastapi import APIRouter
from app.models.schemas import (
    TelemetryFrame, MissionState, EnvironmentState, VehicleHealth,
    EnergyState, PredictedState, SafeOperatingEnvelope, AutonomousDecision,
    ScenarioConfig, ScenarioType, DronePosition, DroneVelocity,
    DroneAttitude, MissionPhase, DecisionAction, EnvelopeStatus
)

router = APIRouter()

# We import simulation_state lazily to avoid circular imports
def _get_sim():
    from app.simulation.controller import simulation_controller
    return simulation_controller


# ---- Health ----

@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time() * 1000, "service": "drone-digital-twin-backend"}


# ---- Drone State ----

@router.get("/drone/state")
async def drone_state():
    sim = _get_sim()
    return sim.get_telemetry()


# ---- Mission ----

@router.get("/mission")
async def get_mission():
    sim = _get_sim()
    return sim.get_mission_state()


@router.post("/mission/start")
async def mission_start():
    sim = _get_sim()
    sim.command("START")
    return {"status": "ok", "action": "start"}


@router.post("/mission/pause")
async def mission_pause():
    sim = _get_sim()
    sim.command("PAUSE")
    return {"status": "ok", "action": "pause"}


@router.post("/mission/resume")
async def mission_resume():
    sim = _get_sim()
    sim.command("RESUME")
    return {"status": "ok", "action": "resume"}


@router.post("/mission/reset")
async def mission_reset():
    sim = _get_sim()
    sim.command("RESET")
    return {"status": "ok", "action": "reset"}


@router.post("/mission/return-to-base")
async def mission_return():
    sim = _get_sim()
    sim.command("RETURN_TO_BASE")
    return {"status": "ok", "action": "return_to_base"}


@router.post("/mission/abort")
async def mission_abort():
    sim = _get_sim()
    sim.command("ABORT")
    return {"status": "ok", "action": "abort"}


# ---- Environment ----

@router.get("/environment")
async def get_environment():
    sim = _get_sim()
    t = sim.get_telemetry()
    return t.environment if t else EnvironmentState()


# ---- Vehicle Health ----

@router.get("/vehicle/health")
async def get_vehicle_health():
    sim = _get_sim()
    return sim.get_vehicle_health()


# ---- Energy ----

@router.get("/energy")
async def get_energy():
    sim = _get_sim()
    return sim.get_energy_state()


# ---- Prediction ----

@router.get("/prediction")
async def get_prediction():
    sim = _get_sim()
    return sim.get_prediction()


# ---- Safety Envelope ----

@router.get("/safety/envelope")
async def get_safety_envelope():
    sim = _get_sim()
    return sim.get_safety_envelope()


# ---- Decision ----

@router.get("/decision")
async def get_decision():
    sim = _get_sim()
    return sim.get_last_decision()


# ---- Scenario ----

@router.post("/scenario")
async def set_scenario(config: ScenarioConfig):
    sim = _get_sim()
    sim.set_scenario(config)
    return {"status": "ok", "scenario": config.type}
