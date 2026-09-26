import { create } from 'zustand';
import type {
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
  ScenarioType,
  EmergencyState,
  EmergencyEvent,
} from '../types';

interface DroneStore {
  // Connection state
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;

  // Latest telemetry
  telemetry: TelemetryFrame | null;
  setTelemetry: (t: TelemetryFrame) => void;

  // Mission
  missionState: MissionState | null;
  setMissionState: (m: MissionState) => void;

  // Vehicle health
  vehicleHealth: VehicleHealth | null;
  setVehicleHealth: (h: VehicleHealth) => void;

  // Energy
  energyState: EnergyState | null;
  setEnergyState: (e: EnergyState) => void;

  // Prediction
  prediction: PredictedState | null;
  setPrediction: (p: PredictedState) => void;

  // Safety envelope
  safetyEnvelope: SafeOperatingEnvelope | null;
  setSafetyEnvelope: (s: SafeOperatingEnvelope) => void;

  // Anomalies
  anomalies: Anomaly[];
  addAnomaly: (a: Anomaly) => void;
  clearAnomalies: () => void;

  // Decisions
  lastDecision: AutonomousDecision | null;
  setLastDecision: (d: AutonomousDecision) => void;
  decisionHistory: AutonomousDecision[];

  // Alerts
  alerts: Alert[];
  addAlert: (a: Alert) => void;
  acknowledgeAlert: (id: string) => void;

  // DT status
  dtStatus: DigitalTwinStatus;
  setDtStatus: (s: DigitalTwinStatus) => void;

  // Emergency state
  emergencyState: EmergencyState | null;
  setEmergencyState: (e: EmergencyState | null) => void;
  emergencyEvents: EmergencyEvent[];
  addEmergencyEvent: (evt: EmergencyEvent) => void;
  clearEmergencyEvents: () => void;

  // Scenario
  activeScenario: ScenarioType;
  setActiveScenario: (s: ScenarioType) => void;

  // Telemetry history (circular buffer, last 300 frames)
  telemetryHistory: TelemetryFrame[];
  appendTelemetryHistory: (t: TelemetryFrame) => void;
}

export const useDroneStore = create<DroneStore>((set) => ({
  wsConnected: false,
  setWsConnected: (v) => set({ wsConnected: v }),

  telemetry: null,
  setTelemetry: (t) => set({ telemetry: t }),

  missionState: null,
  setMissionState: (m) => set({ missionState: m }),

  vehicleHealth: null,
  setVehicleHealth: (h) => set({ vehicleHealth: h }),

  energyState: null,
  setEnergyState: (e) => set({ energyState: e }),

  prediction: null,
  setPrediction: (p) => set({ prediction: p }),

  safetyEnvelope: null,
  setSafetyEnvelope: (s) => set({ safetyEnvelope: s }),

  anomalies: [],
  addAnomaly: (a) =>
    set((state) => ({
      anomalies: [a, ...state.anomalies].slice(0, 50),
    })),
  clearAnomalies: () => set({ anomalies: [] }),

  lastDecision: null,
  decisionHistory: [],
  setLastDecision: (d) =>
    set((state) => ({
      lastDecision: d,
      decisionHistory: [d, ...state.decisionHistory].slice(0, 20),
    })),

  alerts: [],
  addAlert: (a) =>
    set((state) => ({ alerts: [a, ...state.alerts].slice(0, 100) })),
  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    })),

  dtStatus: {
    connected: false,
    last_update_ms: 0,
    telemetry_hz: 0,
    latency_ms: 0,
    physics_engine_status: 'STOPPED',
    ai_model_status: 'OFFLINE',
    backend_status: 'OFFLINE',
  },
  setDtStatus: (s) => set({ dtStatus: s }),

  activeScenario: 'NORMAL',
  setActiveScenario: (s) => set({ activeScenario: s }),

  emergencyState: null,
  emergencyEvents: [
    {
      id: 'init-0',
      timestamp: Date.now(),
      timeStr: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'SYSTEM_ONLINE',
      message: 'Autonomous Digital Twin initialized. Telemetry sync active.',
      severity: 'LOW',
    },
  ],
  addEmergencyEvent: (evt) =>
    set((state) => ({
      emergencyEvents: [evt, ...state.emergencyEvents].slice(0, 40),
    })),
  clearEmergencyEvents: () => set({ emergencyEvents: [] }),
  setEmergencyState: (e) =>
    set((state) => {
      const prev = state.emergencyState;
      const newEvents: EmergencyEvent[] = [];
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      const now = Date.now();

      if (e && e.emergencyActive) {
        // If transitioning from inactive to active, or if emergencyType changed
        if (!prev?.emergencyActive || prev.emergencyType !== e.emergencyType) {
          newEvents.push({
            id: `evt-${now}-1`,
            timestamp: now,
            timeStr,
            type: `${e.emergencyType}_DETECTED`,
            message: `${e.emergencyType.replace(/_/g, ' ')} DETECTED: ${e.emergencyReason}`,
            severity: e.emergencySeverity,
          });

          if (e.safetyEnvelopeStatus === 'BREACH') {
            newEvents.push({
              id: `evt-${now}-2`,
              timestamp: now + 50,
              timeStr,
              type: 'SAFETY_ENVELOPE_BREACH',
              message: 'SAFETY ENVELOPE BREACH: Safe flight corridor exceeded',
              severity: 'CRITICAL',
            });
          }

          if (e.recommendedAction === 'RETURN_TO_BASE') {
            newEvents.push({
              id: `evt-${now}-3`,
              timestamp: now + 100,
              timeStr,
              type: 'RTH_RECOMMENDED',
              message: 'RTH RECOMMENDED: Autonomous Return-to-Base commanded',
              severity: 'CRITICAL',
            });
          } else if (e.recommendedAction === 'REDUCE_SPEED') {
            newEvents.push({
              id: `evt-${now}-3`,
              timestamp: now + 100,
              timeStr,
              type: 'SPEED_REDUCTION_RECOMMENDED',
              message: 'SPEED REDUCTION RECOMMENDED: Cruise speed limited to 4.0 m/s',
              severity: 'WARNING',
            });
          }
        }
      } else if (prev?.emergencyActive && e && !e.emergencyActive) {
        // Recovered back to nominal
        newEvents.push({
          id: `evt-${now}-rec`,
          timestamp: now,
          timeStr,
          type: 'RECOVERY_NORMAL',
          message: 'NOMINAL FLIGHT RESTORED: All physical margins recovered',
          severity: 'LOW',
        });
      }

      return {
        emergencyState: e,
        emergencyEvents: newEvents.length > 0
          ? [...newEvents, ...state.emergencyEvents].slice(0, 40)
          : state.emergencyEvents,
      };
    }),

  telemetryHistory: [],
  appendTelemetryHistory: (t) =>
    set((state) => ({
      telemetryHistory: [...state.telemetryHistory, t].slice(-300),
    })),
}));

