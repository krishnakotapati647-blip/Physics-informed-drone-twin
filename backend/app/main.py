"""
FastAPI application entry point.
"""
import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.api.routes import router
from app.websocket.manager import manager
from app.models.schemas import (
    WSMessageType,
    Command,
    TelemetryFrame,
    DigitalTwinStatus,
)
from app.simulation.controller import simulation_controller

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("=== Drone Digital Twin Backend starting ===")
    yield
    logger.info("=== Drone Digital Twin Backend shutting down ===")


app = FastAPI(
    title="Drone Digital Twin Backend",
    version="1.0.0",
    description="Physics-Informed Drone Digital Twin — Backend API",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(router)


# ---- WebSocket endpoint ----

@app.websocket("/ws/telemetry")
async def ws_telemetry(ws: WebSocket):
    await manager.connect(ws)

    # Send current authoritative snapshot to newly connected client
    try:
        current_telemetry = simulation_controller.get_telemetry()
        await manager.send_personal(ws, WSMessageType.TELEMETRY, current_telemetry)
        await manager.send_personal(
            ws, WSMessageType.VEHICLE_HEALTH, simulation_controller.get_vehicle_health()
        )
        await manager.send_personal(
            ws, WSMessageType.ENERGY_STATE, simulation_controller.get_energy_state()
        )
        await manager.send_personal(
            ws,
            WSMessageType.SAFETY_ENVELOPE,
            simulation_controller.get_safety_envelope(),
        )
        await manager.send_personal(
            ws, WSMessageType.PREDICTION, simulation_controller.get_prediction()
        )
        await manager.send_personal(
            ws, WSMessageType.MISSION_STATE, simulation_controller.get_mission_state()
        )
        emerg_snap = simulation_controller.get_emergency_state()
        if emerg_snap:
            await manager.send_personal(ws, WSMessageType.EMERGENCY, emerg_snap)
        await manager.send_personal(
            ws,
            WSMessageType.DT_STATUS,
            DigitalTwinStatus(
                connected=True,
                last_update_ms=time.time() * 1000,
                telemetry_hz=settings.telemetry_hz,
                latency_ms=0,
                physics_engine_status="RUNNING"
                if simulation_controller._running
                else "STANDBY",
                ai_model_status="READY",
                backend_status="CONNECTED",
            ),
        )
    except Exception as e:
        logger.warning(f"[WS] Snapshot send error: {e}")

    try:
        while True:
            try:
                raw = await asyncio.wait_for(ws.receive_text(), timeout=1.0)
                data = json.loads(raw)
                msg_type = data.get("type")

                # 1. Authoritative Telemetry Ingest from Virtual Drone Simulator
                if msg_type in ("TELEMETRY", "TELEMETRY_INGEST"):
                    payload = data.get("payload")
                    if payload:
                        frame = TelemetryFrame(**payload)
                        simulation_controller.ingest_telemetry(frame)

                        # Broadcast to all clients (including Digital Twin)
                        await manager.broadcast(WSMessageType.TELEMETRY, frame)
                        if frame.emergency:
                            await manager.broadcast(WSMessageType.EMERGENCY, frame.emergency)
                        await manager.broadcast(
                            WSMessageType.VEHICLE_HEALTH,
                            simulation_controller.get_vehicle_health(),
                        )
                        await manager.broadcast(
                            WSMessageType.ENERGY_STATE,
                            simulation_controller.get_energy_state(),
                        )
                        await manager.broadcast(
                            WSMessageType.SAFETY_ENVELOPE,
                            simulation_controller.get_safety_envelope(),
                        )
                        await manager.broadcast(
                            WSMessageType.PREDICTION,
                            simulation_controller.get_prediction(),
                        )

                        decision = simulation_controller.get_last_decision()
                        if decision:
                            await manager.broadcast(WSMessageType.DECISION, decision)

                # 2. Direct Emergency Message
                elif msg_type == "EMERGENCY":
                    payload = data.get("payload")
                    if payload:
                        await manager.broadcast(WSMessageType.EMERGENCY, payload)

                # 3. Commands (START, PAUSE, RESET, etc.)
                elif msg_type in (
                    "START",
                    "PAUSE",
                    "RESUME",
                    "RESET",
                    "RETURN_TO_BASE",
                    "ABORT",
                    "SCENARIO_CHANGE",
                    "COMMAND",
                ):
                    cmd_type = data.get("payload", {}).get("type") if msg_type == "COMMAND" else msg_type
                    cmd_payload = data.get("payload") if msg_type != "COMMAND" else data.get("payload", {}).get("payload")
                    simulation_controller.command(cmd_type, cmd_payload)

                    await manager.broadcast(
                        WSMessageType.COMMAND_ACK,
                        {"status": "ok", "command": cmd_type},
                    )

            except asyncio.TimeoutError:
                # No incoming message during window — keep connection alive
                pass
            except Exception as e:
                logger.warning(f"[WS] Message handle error: {e}")

    except WebSocketDisconnect:
        manager.disconnect(ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)