"""
Unit test for SimulationController logic:
- Physics-based 10-second prediction integration
- Envelope monitoring with predictive drift constraints
- Autonomous decision engine with explainable physical evidence breakdown
"""
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.models.schemas import (
    TelemetryFrame,
    DronePosition,
    DroneVelocity,
    DroneAttitude,
    DroneAngularRates,
    MotorState,
    BatteryState,
    EnvironmentState,
    MissionState,
    MissionPhase,
    EnvelopeStatus,
    DecisionAction,
    EmergencyState,
    EmergencySeverity,
    EmergencyType,
)
from app.simulation.controller import SimulationController


def create_frame(wind_speed: float, rain: bool = False, bat_pct: float = 85.0):
    return TelemetryFrame(
        timestamp=1000.0,
        drone_id="TEST-DRONE",
        sequence=1,
        position=DronePosition(x=10.0, y=20.0, z=25.0),
        velocity=DroneVelocity(vx=4.0, vy=2.0, vz=0.0),
        attitude=DroneAttitude(roll=2.0, pitch=1.0, yaw=45.0),
        angular_rates=DroneAngularRates(roll_rate=0, pitch_rate=0, yaw_rate=0),
        motors=[
            MotorState(id=1, rpm=5600, thrust=8.0, efficiency=1.0, temperature=28.0),
            MotorState(id=2, rpm=5600, thrust=8.0, efficiency=1.0, temperature=28.0),
            MotorState(id=3, rpm=5600, thrust=8.0, efficiency=1.0, temperature=28.0),
            MotorState(id=4, rpm=5600, thrust=8.0, efficiency=1.0, temperature=28.0),
        ],
        battery=BatteryState(
            percentage=bat_pct,
            voltage=14.8,
            current=16.0,
            temperature=30.0,
            capacity_mah=5200,
            remaining_mah=4400,
            health=1.0,
        ),
        environment=EnvironmentState(
            wind_speed=wind_speed,
            wind_direction=270.0,
            wind_vx=-wind_speed,
            wind_vy=0.0,
            turbulence=0.2 if wind_speed > 10 else 0.0,
            temperature=24.0,
            air_density=1.225,
            visibility=0.35 if rain else 1.0,
            rain=rain,
        ),
        payload_kg=0.0,
        mission_state=MissionState(
            mission_id="TEST-01",
            phase=MissionPhase.NAVIGATING,
            current_waypoint_index=1,
            progress=0.3,
            distance_to_next_m=35.0,
            eta_s=5.0,
        ),
    )


def test_simulation_pipeline():
    ctrl = SimulationController()

    # 1. Normal conditions test
    print("Testing Nominal Conditions...")
    norm_frame = create_frame(wind_speed=2.0, rain=False, bat_pct=90.0)
    ctrl.ingest_telemetry(norm_frame)

    pred = ctrl.get_prediction()
    assert pred is not None, "Missing prediction"
    assert len(pred.trajectory) == 10, f"Expected 10 trajectory steps, got {len(pred.trajectory)}"
    assert pred.predicted_drift_magnitude_m < 3.0, f"Drift too high for calm wind: {pred.predicted_drift_magnitude_m}"
    print(f"  Nominal 10s predicted drift: {pred.predicted_drift_magnitude_m:.2f}m OK")

    envelope = ctrl.get_safety_envelope()
    assert envelope.status == EnvelopeStatus.SAFE, f"Expected SAFE, got {envelope.status}"
    print(f"  Envelope status: {envelope.status} OK")

    decision = ctrl.get_last_decision()
    assert decision.action == DecisionAction.CONTINUE_MISSION, f"Expected CONTINUE_MISSION, got {decision.action}"
    assert len(decision.evidence_breakdown) > 0, "Missing evidence breakdown"
    print(f"  Decision action: {decision.action}, Evidence: {decision.evidence_breakdown}")

    # 2. High Wind Event test
    print("\nTesting High Wind Event (14 m/s)...")
    wind_frame = create_frame(wind_speed=14.0, rain=False, bat_pct=75.0)
    ctrl.ingest_telemetry(wind_frame)

    wind_pred = ctrl.get_prediction()
    assert wind_pred.predicted_drift_magnitude_m > 3.0, f"Expected drift > 3.0m in high wind, got {wind_pred.predicted_drift_magnitude_m}"
    print(f"  High wind 10s predicted drift: {wind_pred.predicted_drift_magnitude_m:.2f}m OK")

    wind_decision = ctrl.get_last_decision()
    assert wind_decision.action in (DecisionAction.REDUCE_SPEED, DecisionAction.MODIFY_TRAJECTORY), f"Expected REDUCE_SPEED, got {wind_decision.action}"
    print(f"  High wind commanded action: {wind_decision.action}, Reason: {wind_decision.reason}")
    print(f"  High wind evidence: {wind_decision.evidence_breakdown}")

    # 3. Storm / Severe Safety Event test
    print("\nTesting Storm / Safety Event (18 m/s + Rain)...")
    storm_frame = create_frame(wind_speed=18.0, rain=True, bat_pct=40.0)
    ctrl.ingest_telemetry(storm_frame)

    storm_envelope = ctrl.get_safety_envelope()
    assert storm_envelope.status == EnvelopeStatus.OUTSIDE_ENVELOPE, f"Expected OUTSIDE_ENVELOPE, got {storm_envelope.status}"
    print(f"  Storm Envelope status: {storm_envelope.status} (violations: {storm_envelope.violations}) OK")

    storm_decision = ctrl.get_last_decision()
    assert storm_decision.action == DecisionAction.RETURN_TO_BASE, f"Expected RETURN_TO_BASE, got {storm_decision.action}"
    assert storm_decision.overrides_mission is True, "Expected overrides_mission=True for storm"
    print(f"  Storm commanded action: {storm_decision.action} [OVERRIDE={storm_decision.overrides_mission}] OK")
    print(f"  Storm evidence: {storm_decision.evidence_breakdown}")

    print("\n=== ALL SIMULATION CONTROLLER & REASONING PIPELINE TESTS PASSED! ===")


def test_emergency_synchronization():
    print("\nTesting Emergency State Synchronization...")
    ctrl = SimulationController()

    # 1. Nominal
    assert ctrl.get_emergency_state() is None

    # 2. Ingest frame with emergency
    emerg = EmergencyState(
        emergencyActive=True,
        emergencyType=EmergencyType.COMBINED_FAILURE,
        emergencySeverity=EmergencySeverity.CRITICAL,
        emergencyReason="Multi-system cascade: Motor 3 thrust fault combined with 10.0 m/s wind and accelerated battery drain.",
        affectedComponent="Motor 3, Propulsion Subsystem, Aerodynamics",
        safetyEnvelopeStatus="BREACH",
        recommendedAction="RETURN TO BASE IMMEDIATELY / CONTROLLED DESCENT",
        contributingFactors=[
            "Motor 3 thrust efficiency reduced to 65%",
            "Turbulence 0.3 with crosswind",
            "Battery drain multiplier 2.0x",
        ],
        timestamp=1000.0,
    )
    frame = create_frame(wind_speed=10.0, bat_pct=24.0)
    frame.emergency = emerg
    frame.scenario = "COMBINED_FAILURE"

    ctrl.ingest_telemetry(frame)
    stored_emerg = ctrl.get_emergency_state()
    assert stored_emerg is not None
    assert stored_emerg.emergencyActive is True
    assert stored_emerg.emergencyType == EmergencyType.COMBINED_FAILURE
    print(f"  Emergency successfully stored and synchronized: {stored_emerg.emergencyType.value} (Severity: {stored_emerg.emergencySeverity.value}) OK")

    # 3. Test Reset cleans emergency
    ctrl.command("RESET")
    assert ctrl.get_emergency_state() is None
    print("  Reset cleans emergency state OK")


if __name__ == "__main__":
    test_simulation_pipeline()
    test_emergency_synchronization()
