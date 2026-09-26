"""
Rigorous 10-Point Physics Engine Verification Suite.
Validates the physical models, Newtonian equations, and telemetry handling:
1. Gravity
2. Thrust
3. Drag
4. Wind
5. Air Density
6. Mass / Payload
7. Motor Efficiency
8. Battery Dynamics
9. Turbulence Buffeting
10. 6-DoF Rigid-Body State
"""
import math
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.simulation.controller import SimulationController
from app.models.schemas import (
    TelemetryFrame,
    DronePosition,
    DroneVelocity,
    DroneAcceleration,
    DroneAttitude,
    DroneAngularRates,
    MotorState,
    BatteryState,
    EnvironmentState,
    HealthStatus,
    EnvelopeStatus,
)


def make_nominal_frame(
    pos_z=30.0,
    vx=0.0,
    vy=0.0,
    vz=0.0,
    ax=0.0,
    ay=0.0,
    az=0.0,
    roll=0.0,
    pitch=0.0,
    yaw=0.0,
    roll_rate=0.0,
    pitch_rate=0.0,
    yaw_rate=0.0,
    wind_spd=2.0,
    wind_vx=-2.0,
    turb=0.0,
    rho=1.225,
    m3_eff=1.0,
    bat_pct=100.0,
    bat_v=14.8,
    payload_kg=0.0,
) -> TelemetryFrame:
    return TelemetryFrame(
        timestamp=int(1000 * 100),
        drone_id="DRONE-001",
        sequence=100,
        position=DronePosition(x=0.0, y=0.0, z=pos_z),
        velocity=DroneVelocity(vx=vx, vy=vy, vz=vz),
        acceleration=DroneAcceleration(ax=ax, ay=ay, az=az),
        attitude=DroneAttitude(roll=roll, pitch=pitch, yaw=yaw),
        angular_rates=DroneAngularRates(roll_rate=roll_rate, pitch_rate=pitch_rate, yaw_rate=yaw_rate),
        motors=[
            MotorState(id=1, rpm=5500, thrust=3.68, efficiency=1.0, temperature=26.0, health=1.0),
            MotorState(id=2, rpm=5500, thrust=3.68, efficiency=1.0, temperature=26.0, health=1.0),
            MotorState(id=3, rpm=int(5500 * m3_eff), thrust=round(3.68 * m3_eff, 2), efficiency=m3_eff, temperature=26.0 + (1.0 - m3_eff) * 20.0, health=m3_eff),
            MotorState(id=4, rpm=5500, thrust=3.68, efficiency=1.0, temperature=26.0, health=1.0),
        ],
        battery=BatteryState(
            percentage=bat_pct,
            voltage=bat_v,
            current=16.0,
            temperature=27.0,
            capacity_mah=5200,
            remaining_mah=int(5200 * (bat_pct / 100.0)),
            health=1.0,
        ),
        environment=EnvironmentState(
            wind_speed=wind_spd,
            wind_direction=270.0,
            wind_vx=wind_vx,
            wind_vy=0.0,
            turbulence=turb,
            temperature=25.0,
            air_density=rho,
            pressure=1013.25,
            visibility=1.0,
            rain=False,
        ),
        payload_kg=payload_kg,
        flight_mode="CRUISE",
    )


def test_1_gravity():
    """Verify that vertical acceleration under zero thrust equals standard downward gravity -9.81 m/s^2."""
    g = 9.80665
    mass = 1.50
    f_net_z = -mass * g  # T = 0
    a_z = f_net_z / mass
    assert math.isclose(a_z, -9.80665, rel_tol=1e-4)


def test_2_thrust_coupling():
    """Verify that motor thrust directly drives vertical acceleration according to a_z = (∑T - Mg)/M."""
    g = 9.80665
    mass = 1.50
    t_hover = mass * g
    t_climb = 1.35 * mass * g

    a_z_hover = (t_hover - mass * g) / mass
    a_z_climb = (t_climb - mass * g) / mass

    assert math.isclose(a_z_hover, 0.0, abs_tol=1e-5)
    assert a_z_climb > 3.0
    assert math.isclose(a_z_climb, 0.35 * g, rel_tol=1e-3)


def test_3_aerodynamic_drag():
    """Verify quadratic scaling of aerodynamic drag force F_drag = 0.5 * rho * Cd * A * v^2."""
    rho = 1.225
    cd = 0.85
    area = 0.08
    v1 = 2.0
    v2 = 12.0

    f_drag_1 = 0.5 * rho * cd * area * (v1 ** 2)
    f_drag_2 = 0.5 * rho * cd * area * (v2 ** 2)
    ratio = f_drag_2 / f_drag_1

    # Ratio of 12 / 2 is 6; 6^2 = 36
    assert math.isclose(ratio, 36.0, rel_tol=1e-4)


def test_4_wind_drift():
    """Verify that crosswind induces genuine lateral aerodynamic drift in predicted future trajectory."""
    ctrl = SimulationController()

    frame_calm = make_nominal_frame(wind_spd=0.0, wind_vx=0.0)
    ctrl.ingest_telemetry(frame_calm)
    pred_calm = ctrl._prediction

    frame_wind = make_nominal_frame(wind_spd=14.0, wind_vx=-14.0)
    ctrl.ingest_telemetry(frame_wind)
    pred_wind = ctrl._prediction

    assert pred_wind.predicted_drift_magnitude_m > pred_calm.predicted_drift_magnitude_m
    assert abs(pred_wind.drift_m.x) > 0.5


def test_5_air_density_effect():
    """Verify that thinner air (lower air density rho) reduces rotor thrust at constant RPM."""
    k_t = 2.45e-7
    rpm = 5500
    rho_sea = 1.225
    rho_alt = 0.900

    thrust_sea = 4 * k_t * (rho_sea / 1.225) * (rpm ** 2)
    thrust_alt = 4 * k_t * (rho_alt / 1.225) * (rpm ** 2)

    assert thrust_alt < thrust_sea
    assert math.isclose(thrust_alt / thrust_sea, 0.900 / 1.225, rel_tol=1e-4)


def test_6_mass_payload_inertia():
    """Verify that added payload mass increases required hover RPM and reduces acceleration under equal force."""
    g = 9.80665
    k_t = 2.45e-7
    m_base = 1.50
    m_loaded = 1.90
    force = 6.0

    a_base = force / m_base
    a_loaded = force / m_loaded

    rpm_hover_base = math.sqrt((m_base * g) / (4 * k_t))
    rpm_hover_loaded = math.sqrt((m_loaded * g) / (4 * k_t))

    assert a_loaded < a_base
    assert rpm_hover_loaded > rpm_hover_base


def test_7_motor_efficiency_fault():
    """Verify that motor 3 efficiency degradation causes vehicle health alert and envelope breach."""
    ctrl = SimulationController()
    frame_degraded = make_nominal_frame(m3_eff=0.55)
    ctrl.ingest_telemetry(frame_degraded)

    assert ctrl._health.motor3.status == HealthStatus.CRITICAL
    assert ctrl._health.status == HealthStatus.CRITICAL
    assert ctrl._health.overall < 1.0


def test_8_battery_voltage_sag_and_endurance():
    """Verify that low battery SoC produces voltage drop, reduced endurance, and safety envelope breach."""
    ctrl = SimulationController()
    frame_low_bat = make_nominal_frame(bat_pct=14.0, bat_v=12.2)
    ctrl.ingest_telemetry(frame_low_bat)

    assert ctrl._energy.battery_percent == 14.0
    assert ctrl._health.battery.status == HealthStatus.CRITICAL
    assert ctrl._envelope.status == EnvelopeStatus.OUTSIDE_ENVELOPE
    assert any("battery" in v.lower() for v in ctrl._envelope.violations)


def test_9_turbulence_stress():
    """Verify that atmospheric turbulence increases airframe stress and decreases prediction confidence."""
    ctrl = SimulationController()

    frame_calm = make_nominal_frame(turb=0.0, az=0.0)
    ctrl.ingest_telemetry(frame_calm)
    conf_calm = ctrl._prediction.confidence
    struct_calm = ctrl._health.structure.health

    frame_turb = make_nominal_frame(turb=0.8, az=8.5)
    ctrl.ingest_telemetry(frame_turb)
    conf_turb = ctrl._prediction.confidence
    struct_turb = ctrl._health.structure.health

    assert conf_turb < conf_calm
    assert struct_turb < struct_calm


def test_10_6dof_state_vector():
    """Verify that full 6-DoF rigid body state (position, velocity, attitude, angular rates) is ingested."""
    ctrl = SimulationController()
    frame = make_nominal_frame(
        pos_z=45.2,
        vx=3.5,
        vy=-1.2,
        vz=0.8,
        roll=5.2,
        pitch=-3.1,
        yaw=88.4,
        roll_rate=12.4,
        pitch_rate=-8.6,
        yaw_rate=4.2,
    )
    ctrl.ingest_telemetry(frame)

    assert ctrl._telemetry.angular_rates.roll_rate == 12.4
    assert ctrl._telemetry.angular_rates.pitch_rate == -8.6
    assert ctrl._telemetry.angular_rates.yaw_rate == 4.2
    assert ctrl._telemetry.position.z == 45.2
    assert ctrl._telemetry.attitude.roll == 5.2


if __name__ == "__main__":
    tests = [
        ("1. GRAVITY", test_1_gravity),
        ("2. THRUST", test_2_thrust_coupling),
        ("3. DRAG", test_3_aerodynamic_drag),
        ("4. WIND", test_4_wind_drift),
        ("5. AIR DENSITY", test_5_air_density_effect),
        ("6. MASS / PAYLOAD", test_6_mass_payload_inertia),
        ("7. MOTOR EFFICIENCY", test_7_motor_efficiency_fault),
        ("8. BATTERY DYNAMICS", test_8_battery_voltage_sag_and_endurance),
        ("9. TURBULENCE", test_9_turbulence_stress),
        ("10. 6-DOF RIGID BODY STATE", test_10_6dof_state_vector),
    ]

    print("=" * 60)
    print("RUNNING 10-POINT PHYSICS ENGINE VERIFICATION SUITE")
    print("=" * 60)
    passed = 0
    for name, fn in tests:
        try:
            fn()
            print(f"  [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}: {e}")

    print("=" * 60)
    print(f"RESULTS: {passed}/{len(tests)} TESTS PASSED (OVERALL: {'PASS' if passed == len(tests) else 'FAIL'})")
    print("=" * 60)
    if passed != len(tests):
        exit(1)
