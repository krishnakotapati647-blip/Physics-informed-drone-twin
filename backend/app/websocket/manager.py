"""
WebSocket connection manager.
Handles multiple frontend clients, broadcasts telemetry and other messages.
"""
import asyncio
import json
import logging
from typing import Any
from fastapi import WebSocket, WebSocketDisconnect
from app.models.schemas import WSMessage, WSMessageType

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._connections: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self._connections.append(ws)
        logger.info(f"[WS] Client connected. Total: {len(self._connections)}")

    def disconnect(self, ws: WebSocket):
        if ws in self._connections:
            self._connections.remove(ws)
        logger.info(f"[WS] Client disconnected. Total: {len(self._connections)}")

    async def send_personal(self, ws: WebSocket, msg_type: WSMessageType, payload: Any):
        msg = WSMessage(type=msg_type, payload=payload)
        await ws.send_text(msg.model_dump_json())

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    async def broadcast(self, msg_type: WSMessageType, payload: Any):
        if not self._connections:
            return
        msg = WSMessage(type=msg_type, payload=payload)
        data = msg.model_dump_json()
        dead: list[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    async def broadcast_raw(self, data: str):
        dead: list[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


# Singleton
manager = ConnectionManager()
