import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Plane, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { wsClient } from './services/wsClient';
import { useDroneStore } from './store/droneStore';
import { firebaseService } from './services/firebase';
import { simulationEngine } from './simulator/simulation/simulationEngine';
import {
  telemetryToSimState,
  computeLocalVehicleHealth,
  computeLocalEnergyState,
  computeLocalSafetyEnvelope,
  computeLocalPrediction,
  computeLocalDecision,
} from './simulator/simulation/simulationTypes';
import SimulatorPage from './pages/SimulatorPage';
import DigitalTwinPage from './pages/DigitalTwinPage';

function StartupModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const checks = [
    { label: '3D GRAPHICS ENGINE', status: 'READY' },
    { label: 'AERODYNAMIC FLIGHT MODEL', status: 'ACTIVE [20 Hz]' },
    { label: 'TELEMETRY WEBSOCKET PROTOCOL', status: 'ONLINE' },
    { label: 'DIGITAL TWIN INTELLIGENCE LAYER', status: 'SYNCHRONIZED' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s < checks.length) return s + 1;
        clearInterval(timer);
        setTimeout(onComplete, 300);
        return s;
      });
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', background: '#e0f2fe', borderRadius: '6px', color: '#0284c7' }}>
              <Plane size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
                AEROSPACE FLIGHT LAB
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Physics-Informed Drone Digital Twin
              </div>
            </div>
          </div>
          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            SKIP [ESC]
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {checks.map((chk, i) => {
            const isDone = i < step;
            const isCurrent = i === step;

            return (
              <div
                key={chk.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: isDone ? '#f8fafc' : isCurrent ? '#f0f9ff' : '#ffffff',
                  border: `1px solid ${isDone ? '#e2e8f0' : isCurrent ? '#bae6fd' : '#f1f5f9'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <CheckCircle2 size={14} color={isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#cbd5e1'} />
                  <span style={{ fontWeight: 600, color: isDone ? '#334155' : isCurrent ? '#0284c7' : '#94a3b8' }}>
                    {chk.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#cbd5e1',
                  }}
                >
                  {isDone ? chk.status : isCurrent ? 'INITIALIZING...' : 'STANDBY'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / checks.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function NavigationBar() {
  const wsConnected = useDroneStore((s) => s.wsConnected);
  const dtStatus = useDroneStore((s) => s.dtStatus);

  // Firebase is the primary sync path when WebSocket backend is not running
  const firebaseReady = firebaseService.isReady();
  const recentUpdate = dtStatus.last_update_ms > 0 && Date.now() - dtStatus.last_update_ms < 5000;
  const isCloudSync = !wsConnected && firebaseReady;
  const isOnline = wsConnected || isCloudSync;
  const statusLabel = wsConnected ? 'BACKEND ONLINE' : isCloudSync ? 'CLOUD SYNC' : 'STANDBY';
  const statusColor = wsConnected ? '#16a34a' : isCloudSync ? '#0284c7' : '#94a3b8';
  const statusBg = wsConnected ? '#f0fdf4' : isCloudSync ? '#f0f9ff' : '#f8fafc';
  const statusBorder = wsConnected ? '#bbf7d0' : isCloudSync ? '#bae6fd' : '#e2e8f0';
  const latencyLabel = wsConnected
    ? `${Math.min(dtStatus.latency_ms || 18, 50)}ms`
    : recentUpdate
    ? `~${Math.max(dtStatus.latency_ms || 80, 60)}ms`
    : 'READY';

  const navItems = [
    { to: '/simulator', label: '01 FLIGHT LAB', active: true },
    { to: '/digital-twin', label: '02 DIGITAL TWIN', active: true },
    { to: '/simulator#scenarios', label: '03 SCENARIO LAB', active: false, badge: 'PRESETS' },
    { to: '#', label: '04 PREDICTION', active: false, badge: 'PHASE 8' },
    { to: '#', label: '05 ANALYTICS', active: false, badge: 'EXPAND' },
  ];

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: '50px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            background: '#0284c7',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Plane size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
              DRONE DIGITAL TWIN
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                background: '#f1f5f9',
                color: '#475569',
                padding: '1px 6px',
                borderRadius: '3px',
                letterSpacing: '0.06em',
              }}
            >
              AEROSPACE LAB
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Physics-Informed Autonomous Simulation & Intelligence
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {navItems.map(({ to, label, active, badge }) => {
          if (!active) {
            return (
              <div
                key={label}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'not-allowed',
                }}
              >
                <span>{label}</span>
                {badge && (
                  <span
                    style={{
                      fontSize: '8px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#0284c7' : '#475569',
                background: isActive ? '#f0f9ff' : 'transparent',
                border: `1px solid ${isActive ? '#bae6fd' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              })}
            >
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Backend & Live Sync Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: statusBg,
            border: `1px solid ${statusBorder}`,
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          {isOnline ? <Wifi size={13} color={statusColor} /> : <WifiOff size={13} color={statusColor} />}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: statusColor,
              letterSpacing: '0.04em',
            }}
          >
            {statusLabel}
          </span>
          {isOnline && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: statusColor,
              }}
              className="pulse-dot"
            />
          )}
        </div>

        <div
          style={{
            fontSize: '10px',
            color: '#64748b',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {latencyLabel}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [booted, setBooted] = useState(() => {
    return sessionStorage.getItem('drone_booted_light') === 'true';
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('drone_booted_light', 'true');
    setBooted(true);
  };

  useEffect(() => {
    wsClient.connect();

    // Multi-device real-time lockstep synchronization via Firebase Firestore
    const unsubFirebase = firebaseService.subscribeToLiveDrone('DRONE-001', (frame) => {
      // If this device is actively simulating locally, don't overwrite local high-freq physics
      if (simulationEngine.isLocalRunning()) return;

      const now = Date.now();
      const isFresh = Boolean(frame.timestamp && (now - frame.timestamp < 15000));
      const store = useDroneStore.getState();

      if (isFresh) {
        store.setTelemetry(frame);
        store.appendTelemetryHistory(frame);
        if (frame.scenario) {
          store.setActiveScenario(frame.scenario);
        }

        // Mark DT status as synchronized via Firebase Cloud Sync
        store.setDtStatus({
          connected: true,
          last_update_ms: now,
          telemetry_hz: 20,
          latency_ms: Math.max(15, Math.round(now - frame.timestamp)),
          physics_engine_status: frame.flight_mode === 'GROUND' ? 'STOPPED' : 'RUNNING',
          ai_model_status: 'READY',
          backend_status: 'CONNECTED',
        });

        if (frame.mission_state) {
          store.setMissionState(frame.mission_state);
        }

        if (frame.emergency) {
          store.setEmergencyState(frame.emergency);
          if (frame.emergency.emergencyActive) {
            store.addEmergencyEvent({
              id: `${frame.emergency.timestamp}`,
              timestamp: frame.emergency.timestamp,
              timeStr: new Date(frame.emergency.timestamp).toLocaleTimeString(),
              type: frame.emergency.emergencyType,
              message: frame.emergency.emergencyReason,
              severity: frame.emergency.emergencySeverity,
            });
          }
        }

        // Synchronize local simulation engine and compute digital twin models on remote device
        simulationEngine.applyRemoteTelemetry(frame);
        const sim = telemetryToSimState(frame);
        store.setVehicleHealth(computeLocalVehicleHealth(sim));
        store.setEnergyState(computeLocalEnergyState(sim));
        const envelope = computeLocalSafetyEnvelope(sim);
        store.setSafetyEnvelope(envelope);
        store.setPrediction(computeLocalPrediction(sim));
        store.setLastDecision(computeLocalDecision(sim, envelope));
      } else {
        // Frame is stale (>15s old). Mark backend as standby and keep local simulator ready at HOME base
        store.setDtStatus({
          connected: true,
          last_update_ms: now,
          telemetry_hz: 0,
          latency_ms: 0,
          physics_engine_status: 'STOPPED',
          ai_model_status: 'READY',
          backend_status: 'OFFLINE',
        });
      }
    });

    return () => {
      wsClient.disconnect();
      unsubFirebase();
    };
  }, []);

  return (
    <BrowserRouter>
      {!booted && <StartupModal onComplete={handleBootComplete} />}
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <NavigationBar />
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/simulator" replace />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}