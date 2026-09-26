import asyncio
import json
import websockets

async def test_sync():
    uri = "ws://localhost:8000/ws/telemetry"
    print("Connecting Digital Twin listener client...")
    async with websockets.connect(uri) as twin_ws:
        # Drain all initial connect snapshot messages until buffer settles
        print("Draining initial connection snapshots...")
        while True:
            try:
                snap_raw = await asyncio.wait_for(twin_ws.recv(), timeout=0.6)
                snap = json.loads(snap_raw)
                print(f"  Drained snapshot: {snap.get('type')}")
            except asyncio.TimeoutError:
                break

        # Connect Simulator publisher
        print("Connecting Simulator publisher client...")
        async with websockets.connect(uri) as sim_ws:
            test_telemetry = {
                "timestamp": 1234567890,
                "drone_id": "DRONE-001",
                "sequence": 42,
                "position": {"x": 25.5, "y": 14.2, "z": 35.8},
                "velocity": {"vx": 8.1, "vy": 4.2, "vz": 0.5},
                "acceleration": {"ax": 0.1, "ay": 0.0, "az": 0.0},
                "attitude": {"roll": 4.5, "pitch": -2.1, "yaw": 62.0},
                "angular_rates": {"roll_rate": 0, "pitch_rate": 0, "yaw_rate": 0},
                "motors": [
                    {"id": 1, "rpm": 5700, "thrust": 8.1, "efficiency": 1.0, "temperature": 28.0, "health": 1.0},
                    {"id": 2, "rpm": 5700, "thrust": 8.1, "efficiency": 1.0, "temperature": 28.0, "health": 1.0},
                    {"id": 3, "rpm": 3420, "thrust": 4.8, "efficiency": 0.60, "temperature": 38.0, "health": 0.60},
                    {"id": 4, "rpm": 5700, "thrust": 8.1, "efficiency": 1.0, "temperature": 28.0, "health": 1.0},
                ],
                "battery": {
                    "percentage": 82.5, "voltage": 14.4, "current": 18.2, "temperature": 31.0,
                    "capacity_mah": 5200, "remaining_mah": 4290, "health": 1.0
                },
                "environment": {
                    "wind_speed": 11.5, "wind_direction": 270.0, "wind_vx": -11.5, "wind_vy": 0.0,
                    "turbulence": 0.35, "temperature": 26.0, "air_density": 1.225, "pressure": 1013.25
                },
                "payload_kg": 0.0,
                "flight_mode": "CRUISE",
                "mission_state": {
                    "mission_id": "MISSION-001",
                    "mission_name": "Autonomous Survey",
                    "phase": "NAVIGATING",
                    "current_waypoint_index": 2,
                    "total_waypoints": 6,
                    "waypoints": [],
                    "progress": 0.4,
                    "distance_to_next_m": 28.0,
                    "eta_s": 3.5,
                    "elapsed_s": 24.0,
                    "start_time": 1234500000
                }
            }

            print("Simulator publishing TELEMETRY frame...")
            await sim_ws.send(json.dumps({"type": "TELEMETRY", "payload": test_telemetry}))

            # Twin receives broadcast
            received_telemetry = False
            received_health = False
            received_envelope = False

            for _ in range(8):
                msg_raw = await asyncio.wait_for(twin_ws.recv(), timeout=2.0)
                msg = json.loads(msg_raw)
                mtype = msg.get("type")
                print(f"Twin received live broadcast: {mtype}")

                if mtype == "TELEMETRY":
                    p = msg["payload"]["position"]
                    att = msg["payload"]["attitude"]
                    env = msg["payload"].get("environment", {})
                    assert p["z"] >= 0, f"Invalid altitude: {p['z']}"
                    assert "yaw" in att, "Missing yaw in attitude"
                    assert "visibility" in env, "Missing visibility in environment"
                    received_telemetry = True
                elif mtype == "VEHICLE_HEALTH":
                    m3 = msg["payload"]["motor3"]
                    assert m3["health"] <= 1.0, f"Invalid motor health: {m3['health']}"
                    assert m3["status"] in ("NOMINAL", "DEGRADED", "CRITICAL"), f"Motor 3 status mismatch: {m3['status']}"
                    received_health = True
                elif mtype == "SAFETY_ENVELOPE":
                    env_status = msg["payload"]["status"]
                    print(f"  Safety Envelope computed status: {env_status}")
                    received_envelope = True
                elif mtype == "PREDICTION":
                    print("  Twin received PREDICTION broadcast")

                if received_telemetry and received_health and received_envelope:
                    break

            assert received_telemetry, "Did not receive TELEMETRY"
            assert received_health, "Did not receive VEHICLE_HEALTH"
            assert received_envelope, "Did not receive SAFETY_ENVELOPE"
            print("=== VERIFICATION PASSED: Full Simulator -> Backend -> Digital Twin Pipeline OK! ===")
if __name__ == "__main__":
    asyncio.run(test_sync())