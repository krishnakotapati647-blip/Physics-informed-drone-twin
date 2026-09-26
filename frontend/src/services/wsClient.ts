// WebSocket client — connects to backend and dispatches messages to the store
import type {
  WSMessage,
  TelemetryFrame,
  MissionState,
  VehicleHealth,
  EnergyState,
  PredictedState,
  SafeOperatingEnvelope,
  Anomaly,
  AutonomousDecision,
  Alert,
  DigitalTwinStatus,
  Command,
  EmergencyState,
  ScenarioType,
} from '../types';
import { useDroneStore } from '../store/droneStore';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/telemetry';

class DroneWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private lastMessageTime = 0;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    console.log('[WS] Connecting to', WS_URL);
    try {
      this.ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      useDroneStore.getState().setWsConnected(true);
      useDroneStore.getState().setDtStatus({
        ...useDroneStore.getState().dtStatus,
        connected: true,
        backend_status: 'CONNECTED',
      });
      this.reconnectDelay = 2000;
    };

    this.ws.onclose = () => {
      console.warn('[WS] Disconnected');
      useDroneStore.getState().setWsConnected(false);
      useDroneStore.getState().setDtStatus({
        ...useDroneStore.getState().dtStatus,
        connected: false,
        backend_status: 'RECONNECTING',
      });
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    this.ws.onmessage = (event) => {
      try {
        const now = Date.now();
        const latency = now - this.lastMessageTime;
        this.lastMessageTime = now;

        const msg: WSMessage = JSON.parse(event.data as string);
        this.dispatch(msg, latency);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };
  }

  private dispatch(msg: WSMessage, latency: number) {
    const store = useDroneStore.getState();

    switch (msg.type) {
      case 'TELEMETRY': {
        const t = msg.payload as TelemetryFrame;
        store.setTelemetry(t);
        store.appendTelemetryHistory(t);
        if (t.emergency) {
          store.setEmergencyState(t.emergency);
        }
        if (t.scenario) {
          store.setActiveScenario(t.scenario);
        }
        store.setDtStatus({
          ...store.dtStatus,
          last_update_ms: Date.now(),
          latency_ms: Math.min(latency, 9999),
          connected: true,
          backend_status: 'CONNECTED',
        });
        break;
      }
      case 'MISSION_STATE':
        store.setMissionState(msg.payload as MissionState);
        break;
      case 'VEHICLE_HEALTH':
        store.setVehicleHealth(msg.payload as VehicleHealth);
        break;
      case 'ENERGY_STATE':
        store.setEnergyState(msg.payload as EnergyState);
        break;
      case 'PREDICTION':
        store.setPrediction(msg.payload as PredictedState);
        break;
      case 'SAFETY_ENVELOPE':
        store.setSafetyEnvelope(msg.payload as SafeOperatingEnvelope);
        break;
      case 'EMERGENCY':
        store.setEmergencyState(msg.payload as EmergencyState);
        break;
      case 'ANOMALY':
        store.addAnomaly(msg.payload as Anomaly);
        break;
      case 'DECISION':
        store.setLastDecision(msg.payload as AutonomousDecision);
        break;
      case 'ALERT':
        store.addAlert(msg.payload as Alert);
        break;
      case 'DT_STATUS':
        store.setDtStatus(msg.payload as DigitalTwinStatus);
        break;
      case 'COMMAND_ACK': {
        const ack = msg.payload as { command?: string; payload?: { scenario?: ScenarioType } };
        if (ack?.command === 'SCENARIO_CHANGE' && ack.payload?.scenario) {
          store.setActiveScenario(ack.payload.scenario);
        }
        break;
      }
      default:
        break;
    }
  }

  send(command: Command) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(command));
    } else {
      console.warn('[WS] Cannot send, not connected');
    }
  }

  sendTelemetry(frame: TelemetryFrame) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'TELEMETRY',
          payload: frame,
          timestamp: Date.now(),
        })
      );
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 1.5,
        this.maxReconnectDelay
      );
      this.connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}

export const wsClient = new DroneWebSocketClient();

// Helper — send a typed command
export function sendCommand(type: Command['type'], payload?: Record<string, unknown>) {
  wsClient.send({ type, payload, timestamp: Date.now() });
}

// Helper — send telemetry frame from simulator
export function sendTelemetry(frame: TelemetryFrame) {
  wsClient.sendTelemetry(frame);
}
