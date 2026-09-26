import { useState, useEffect, useRef } from 'react';
import { useDroneStore } from '../store/droneStore';
import { DigitalTwinScene } from '../digital-twin/components/DigitalTwinScene';
import { CurrentStatePanel } from '../digital-twin/components/CurrentStatePanel';
import { VehicleHealthPanel } from '../digital-twin/components/VehicleHealthPanel';
import { EnergyAnalysisPanel } from '../digital-twin/components/EnergyAnalysisPanel';
import { SafetyEnvelopePanel } from '../digital-twin/components/SafetyEnvelopePanel';
import { AutonomousDecisionPanel } from '../digital-twin/components/AutonomousDecisionPanel';
import { EmergencyTimelinePanel } from '../digital-twin/components/EmergencyTimelinePanel';
import { SystemStatusHeader } from '../components/common/SystemStatusHeader';
import type { Vec3, TelemetryFrame } from '../types';
import { Cpu, Radio, Activity, Shield, AlertCircle } from 'lucide-react';

export default function DigitalTwinPage() {
  const telemetry = useDroneStore((s) => s.telemetry);
  const vehicleHealth = useDroneStore((s) => s.vehicleHealth);
  const energyState = useDroneStore((s) => s.energyState);
  const safetyEnvelope = useDroneStore((s) => s.safetyEnvelope);
  const lastDecision = useDroneStore((s) => s.lastDecision);
  const wsConnected = useDroneStore((s) => s.wsConnected);
  const dtStatus = useDroneStore((s) => s.dtStatus);
  const emergencyState = useDroneStore((s) => s.emergencyState);
  const emergencyEvents = useDroneStore((s) => s.emergencyEvents);

  const [flownPath, setFlownPath] = useState<Vec3[]>(() => {
    const hist = useDroneStore.getState().telemetryHistory;
    return hist.length > 0 ? hist.map((t: TelemetryFrame) => t.position) : [];
  });
  const [bottomRightTab, setBottomRightTab] = useState<'decision' | 'timeline'>('decision');
  const lastPos = useRef<Vec3>(
    telemetry ? { ...telemetry.position } : { x: 0, y: 0, z: 0 }
  );

  useEffect(() => {
    if (emergencyState?.emergencyActive) {
      setBottomRightTab('timeline');
    }
  }, [emergencyState?.emergencyActive]);

  // Stream is active if telemetry exists or arrived recently
  const isStreaming = Boolean(
    telemetry && ((dtStatus.last_update_ms > 0 && Date.now() - dtStatus.last_update_ms < 3000) || wsConnected)
  );

  // Accumulate flown path from incoming authoritative telemetry
  useEffect(() => {
    if (!telemetry) return;
    const p = telemetry.position;
    const lp = lastPos.current;
    const distSq = (p.x - lp.x) ** 2 + (p.y - lp.y) ** 2 + (p.z - lp.z) ** 2;

    if (distSq > 0.04 || flownPath.length === 0) {
      lastPos.current = { ...p };
      setFlownPath((prev) => [...prev, { ...p }].slice(-500));
    }

    if (telemetry.flight_mode === 'GROUND' && p.z === 0 && flownPath.length > 10) {
      setFlownPath([]);
    }
  }, [telemetry?.sequence]);

  const speed = telemetry
    ? Math.sqrt(
        telemetry.velocity.vx ** 2 +
          telemetry.velocity.vy ** 2 +
          telemetry.velocity.vz ** 2
      )
    : 0;

  return (
    <div
      style={{
        height: 'calc(100vh - 50px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        color: '#0f172a',
        overflow: 'hidden',
      }}
    >
      {/* Live Subsystem Status Bar & Hackathon Demo Controls */}
      <SystemStatusHeader />

      {/* Top Aerospace Intelligence Sub-Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                background: '#e0e7ff',
                color: '#4f46e5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cpu size={14} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
              DIGITAL TWIN INTELLIGENCE LAB
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />

          {/* Dynamic Sync Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <span style={{ color: '#64748b' }}>SYNC STATE:</span>
            {emergencyState?.emergencyActive ? (
              <span
                className="badge badge-red"
                style={{
                  background: '#fee2e2',
                  border: '1px solid #f87171',
                  color: '#b91c1c',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#dc2626',
                  }}
                  className="pulse-dot"
                />
                🔴 EMERGENCY ACTIVE: {emergencyState.emergencyType.replace(/_/g, ' ')}
              </span>
            ) : isStreaming || telemetry ? (
              <span className="badge badge-green">
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} className="pulse-dot" />
                LIVE SYNCHRONIZED (20 Hz)
              </span>
            ) : wsConnected ? (
              <span className="badge badge-amber">
                ○ AWAITING SIMULATOR TELEMETRY
              </span>
            ) : (
              <span className="badge badge-red">
                ✕ DISCONNECTED
              </span>
            )}
          </div>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
            <span style={{ color: '#64748b' }}>TWIN ID:</span>
            <span style={{ fontWeight: 700, color: '#0284c7' }}>{telemetry?.drone_id ?? 'DRONE-001'}</span>
          </div>
        </div>

        {/* Right Status Readouts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Radio size={13} color="#0284c7" />
            <span style={{ color: '#64748b' }}>LATENCY:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
              {isStreaming ? `${Math.min(dtStatus.latency_ms || 18, 60)} ms` : '—'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Activity size={13} color="#0d9488" />
            <span style={{ color: '#64748b' }}>SPEED:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{speed.toFixed(1)} m/s</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Shield size={13} color="#16a34a" />
            <span style={{ color: '#64748b' }}>ENVELOPE:</span>
            <span
              style={{
                fontWeight: 700,
                color:
                  safetyEnvelope?.status === 'OUTSIDE_ENVELOPE'
                    ? '#dc2626'
                    : safetyEnvelope?.status === 'WARNING'
                    ? '#d97706'
                    : '#16a34a',
              }}
            >
              {safetyEnvelope?.status ?? 'SAFE'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Digital Twin Grid */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 350px',
          gridTemplateRows: '1fr 190px',
          gap: '10px',
          padding: '10px',
          overflow: 'hidden',
        }}
      >
        {/* Upper Left: Large 3D Digital Twin Viewer */}
        <div
          style={{
            gridColumn: '1',
            gridRow: '1',
            minHeight: 0,
            position: 'relative',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {isStreaming || telemetry ? (
            <DigitalTwinScene telemetry={telemetry} flownPath={flownPath} />
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8fafc',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  color: '#0284c7',
                }}
              >
                <Cpu size={28} />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
                DIGITAL TWIN STANDBY
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '420px', lineHeight: 1.6, marginBottom: '16px' }}>
                Waiting for real-time telemetry stream from Virtual Flight Lab (Tab 1). Start the mission in the simulator to synchronize the 3D twin.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                <AlertCircle size={14} color="#0284c7" />
                <span>{wsConnected ? 'WebSocket bound to backend — awaiting packets' : 'Connecting to backend...'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upper Right: Synced State & Vehicle Health */}
        <div
          style={{
            gridColumn: '2',
            gridRow: '1',
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ flex: '1 1 50%', minHeight: 0 }}>
            <CurrentStatePanel telemetry={telemetry} />
          </div>
          <div style={{ flex: '1 1 50%', minHeight: 0 }}>
            <VehicleHealthPanel health={vehicleHealth} />
          </div>
        </div>

        {/* Bottom Left: Energy & Safety Envelope */}
        <div
          style={{
            gridColumn: '1',
            gridRow: '2',
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}
        >
          <div style={{ minHeight: 0 }}>
            <EnergyAnalysisPanel energy={energyState} />
          </div>
          <div style={{ minHeight: 0 }}>
            <SafetyEnvelopePanel envelope={safetyEnvelope} />
          </div>
        </div>

        {/* Bottom Right: Explainable Autonomous Decision Engine & Emergency Timeline */}
        <div style={{ gridColumn: '2', gridRow: '2', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              gap: '4px',
              marginBottom: '4px',
              background: '#f1f5f9',
              padding: '2px',
              borderRadius: '5px',
            }}
          >
            <button
              onClick={() => setBottomRightTab('decision')}
              style={{
                flex: 1,
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '3px',
                border: 'none',
                background: bottomRightTab === 'decision' ? '#ffffff' : 'transparent',
                color: bottomRightTab === 'decision' ? '#0f172a' : '#64748b',
                boxShadow: bottomRightTab === 'decision' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              DECISION ENGINE
            </button>
            <button
              onClick={() => setBottomRightTab('timeline')}
              style={{
                flex: 1,
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '3px',
                border: 'none',
                background: bottomRightTab === 'timeline' ? '#ffffff' : 'transparent',
                color:
                  bottomRightTab === 'timeline'
                    ? emergencyState?.emergencyActive
                      ? '#dc2626'
                      : '#0f172a'
                    : emergencyState?.emergencyActive
                    ? '#dc2626'
                    : '#64748b',
                boxShadow: bottomRightTab === 'timeline' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {emergencyState?.emergencyActive && (
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626' }} className="pulse-dot" />
              )}
              EVENT LOG {emergencyEvents.length > 0 && `(${emergencyEvents.length})`}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {bottomRightTab === 'decision' ? (
              <AutonomousDecisionPanel decision={lastDecision} />
            ) : (
              <EmergencyTimelinePanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}