import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { TelemetryFrame, EmergencyState, AutonomousDecision, ScenarioType } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Fallback or environment configuration
const envConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCqJNu9sL3063f2Kl5I5hcLwD_Yz7cBH40',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'physics-informed.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'physics-informed',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'physics-informed.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '808524138742',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:808524138742:web:ce3054ba1d85abf39484d7',
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isConfigured = false;
  private lastTelemetryLogTs = 0;
  private lastLoggedScenario: ScenarioType | null = null;
  private lastLoggedFlightMode: string | null = null;
  private lastLoggedEmergencyState = false;
  private lastHistoryLogTs = 0;

  constructor() {
    this.init();
  }

  private init() {
    // Check saved config in localStorage or envConfig
    let activeConfig: FirebaseConfig = envConfig;
    const saved = localStorage.getItem('drone_firebase_config');
    if (saved) {
      try {
        activeConfig = { ...envConfig, ...JSON.parse(saved) };
      } catch {
        // use envConfig
      }
    }

    if (activeConfig.apiKey && activeConfig.projectId) {
      try {
        const apps = getApps();
        this.app = apps.length > 0 ? apps[0] : initializeApp(activeConfig);
        this.db = getFirestore(this.app);
        this.isConfigured = true;
        console.log(`[Firebase] Initialized with project ID: ${activeConfig.projectId}`);
      } catch (err) {
        console.warn('[Firebase] Initialization error:', err);
        this.isConfigured = false;
      }
    } else {
      console.log('[Firebase] Waiting for complete Firebase Web Configuration (API key & Project ID).');
      this.isConfigured = false;
    }
  }

  public setConfig(config: Partial<FirebaseConfig>) {
    const updated = { ...envConfig, ...config };
    localStorage.setItem('drone_firebase_config', JSON.stringify(updated));
    this.init();
    return this.isConfigured;
  }

  public getConfig(): FirebaseConfig {
    const saved = localStorage.getItem('drone_firebase_config');
    if (saved) {
      try {
        return { ...envConfig, ...JSON.parse(saved) };
      } catch {
        // fallback
      }
    }
    return envConfig;
  }

  public isReady(): boolean {
    return this.isConfigured && this.db !== null;
  }

  /**
   * Log periodic telemetry snapshots with intelligent throttling and event bypass
   */
  public async logTelemetry(frame: TelemetryFrame, forceImmediate = false) {
    if (!this.db || !this.isConfigured) return;

    const now = Date.now();
    const isScenarioChanged = frame.scenario !== this.lastLoggedScenario;
    const isFlightModeChanged = frame.flight_mode !== this.lastLoggedFlightMode;
    const isEmergencyChanged = Boolean(frame.emergency?.emergencyActive) !== this.lastLoggedEmergencyState;
    const isTimeElapsed = now - this.lastTelemetryLogTs >= 800; // ~1.25 Hz for smooth multi-device sync

    const shouldWriteLive = forceImmediate || isScenarioChanged || isFlightModeChanged || isEmergencyChanged || isTimeElapsed;
    if (!shouldWriteLive) return;

    this.lastTelemetryLogTs = now;
    this.lastLoggedScenario = frame.scenario || null;
    this.lastLoggedFlightMode = frame.flight_mode;
    this.lastLoggedEmergencyState = Boolean(frame.emergency?.emergencyActive);

    try {
      // 1. Update live document for the active drone (always up-to-date for subscribers)
      const liveDocRef = doc(this.db, 'live_drones', frame.drone_id);
      await setDoc(
        liveDocRef,
        {
          ...frame,
          testTimestamp: now,
          testDevice: 'Simulator',
          testDroneX: frame.position.x,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );

      // 2. Append to telemetry history collection at maximum 1 Hz to prevent spamming
      if (now - this.lastHistoryLogTs >= 1200) {
        this.lastHistoryLogTs = now;
        const historyColRef = collection(this.db, 'telemetry_history');
        await addDoc(historyColRef, {
          drone_id: frame.drone_id,
          timestamp: frame.timestamp,
          sequence: frame.sequence,
          position: frame.position,
          velocity: frame.velocity,
          attitude: frame.attitude,
          angular_rates: frame.angular_rates,
          battery: {
            percentage: frame.battery.percentage,
            voltage: frame.battery.voltage,
            current: frame.battery.current,
          },
          environment: {
            wind_speed: frame.environment.wind_speed,
            turbulence: frame.environment.turbulence,
            air_density: frame.environment.air_density,
          },
          flight_mode: frame.flight_mode,
          created_at: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn('[Firebase] Failed to write telemetry:', err);
    }
  }

  /**
   * Realtime Firestore listener for multi-device lockstep synchronization
   */
  public subscribeToLiveDrone(
    droneId = 'DRONE-001',
    callback: (frame: TelemetryFrame) => void
  ): Unsubscribe {
    if (!this.db || !this.isConfigured) return () => {};

    const liveDocRef = doc(this.db, 'live_drones', droneId);
    return onSnapshot(
      liveDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        if (!data || !data.position) return;
        callback(data as TelemetryFrame);
      },
      (err) => {
        console.warn('[Firebase] Live drone sync subscription error:', err);
      }
    );
  }

  /**
   * Remote scenario trigger across devices
   */
  public async setRemoteScenario(scenario: ScenarioType, droneId = 'DRONE-001') {
    if (!this.db || !this.isConfigured) return;
    try {
      const liveDocRef = doc(this.db, 'live_drones', droneId);
      await setDoc(liveDocRef, { scenario, updated_at: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn('[Firebase] Failed to set remote scenario:', err);
    }
  }

  /**
   * Log critical emergency events immediately (no throttling)
   */
  public async logEmergency(emergency: EmergencyState, droneId = 'DRONE-001') {
    if (!this.db || !this.isConfigured || !emergency.emergencyActive) return;

    try {
      const colRef = collection(this.db, 'emergency_events');
      await addDoc(colRef, {
        drone_id: droneId,
        emergency_type: emergency.emergencyType,
        severity: emergency.emergencySeverity,
        reason: emergency.emergencyReason,
        affected_component: emergency.affectedComponent,
        environment_condition: emergency.environmentCondition,
        safety_envelope_status: emergency.safetyEnvelopeStatus,
        recommended_action: emergency.recommendedAction,
        contributing_factors: emergency.contributingFactors,
        timestamp: emergency.timestamp,
        created_at: serverTimestamp(),
      });
      console.log(`[Firebase] Logged emergency event: ${emergency.emergencyType}`);
    } catch (err) {
      console.warn('[Firebase] Failed to write emergency event:', err);
    }
  }

  /**
   * Log autonomous decisions made by the digital twin
   */
  public async logDecision(decision: AutonomousDecision, droneId = 'DRONE-001') {
    if (!this.db || !this.isConfigured) return;

    try {
      const colRef = collection(this.db, 'autonomous_decisions');
      await addDoc(colRef, {
        drone_id: droneId,
        action: decision.action,
        reason: decision.reason,
        triggering_conditions: decision.triggering_conditions,
        evidence_breakdown: decision.evidence_breakdown ?? [],
        confidence: decision.confidence,
        risk_level: decision.risk_level ?? 'NOMINAL',
        risk_score: decision.risk_score ?? 0,
        predicted_threat: decision.predicted_threat ?? '',
        resolution_suggestions: decision.resolution_suggestions ?? [],
        timestamp: decision.timestamp,
        created_at: serverTimestamp(),
      });
      console.log(`[Firebase] Logged autonomous decision: ${decision.action}`);
    } catch (err) {
      console.warn('[Firebase] Failed to write autonomous decision:', err);
    }
  }
}

export const firebaseService = new FirebaseService();
