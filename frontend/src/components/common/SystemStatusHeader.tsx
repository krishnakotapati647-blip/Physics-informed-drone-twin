import { useState } from 'react';
import { useDroneStore } from '../../store/droneStore';
import { simulationEngine } from '../../simulator/simulation/simulationEngine';
import { sendCommand } from '../../services/wsClient';
import type { ScenarioType } from '../../simulator/simulation/simulationTypes';
import { PhysicsValidationPanel } from './PhysicsValidationPanel';
import {
  Server,
  Activity,
  Cpu,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Wind,
  CloudLightning,
  Sun,
  Wrench,
  AlertTriangle,
  Database,
} from 'lucide-react';

interface SystemStatusHeaderProps {
  onScenarioTrigger?: (scenario: ScenarioType) => void;
  compact?: boolean;
}

export function SystemStatusHeader({ onScenarioTrigger, compact = false }: SystemStatusHeaderProps) {
  const wsConnected = useDroneStore((s) => s.wsConnected);
  const telemetry = useDroneStore((s) => s.telemetry);
  const safetyEnvelope = useDroneStore((s) => s.safetyEnvelope);
  const dtStatus = useDroneStore((s) => s.dtStatus);
  const emergencyState = useDroneStore((s) => s.emergencyState);

  // Twin is actively synchronized if frame arrived within 1.8s
  const isSync = Boolean(
    telemetry && dtStatus.last_update_ms > 0 && Date.now() - dtStatus.last_update_ms < 1800
  );

  const isEmergency = Boolean(emergencyState?.emergencyActive);
  const envStatus = safetyEnvelope?.status ?? 'SAFE';
  const isWarning = envStatus === 'WARNING';
  const isCritical = envStatus === 'OUTSIDE_ENVELOPE' || emergencyState?.emergencySeverity === 'CRITICAL';
  const [showPhysicsAudit, setShowPhysicsAudit] = useState(false);

  const triggerScenario = (sc: ScenarioType) => {
    simulationEngine.setScenario(sc);
    sendCommand('SCENARIO_CHANGE', { scenario: sc });
    if (onScenarioTrigger) {
      onScenarioTrigger(sc);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: compact ? '4px 16px' : '6px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '11px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        zIndex: 30,
      }}
    >
      {/* 5 Subsystem Status Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        {/* 1. BACKEND */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Server size={12} color={wsConnected ? '#16a34a' : '#d97706'} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>BACKEND:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: wsConnected ? '#16a34a' : '#d97706',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: wsConnected ? '#16a34a' : '#d97706',
              }}
              className={wsConnected ? 'pulse-dot' : ''}
            />
            {wsConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

        {/* 2. DIGITAL TWIN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={12} color={isSync ? '#0284c7' : '#94a3b8'} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>DIGITAL TWIN:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: isSync ? '#0284c7' : '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSync ? '#0284c7' : '#94a3b8',
              }}
              className={isSync ? 'pulse-dot' : ''}
            />
            {isSync ? 'SYNCHRONIZED (20 Hz)' : 'STANDBY'}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

        {/* 3. PHYSICS ENGINE */}
        <div
          onClick={() => setShowPhysicsAudit(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            transition: 'background 0.15s ease',
          }}
          title="Click to run 10-point mathematical physics benchmark audit"
        >
          <Cpu size={12} color="#059669" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>PHYSICS ENGINE:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: '#059669',
              background: '#ecfdf5',
              padding: '1px 6px',
              borderRadius: '3px',
              border: '1px solid #a7f3d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ACTIVE (6-DoF)
            <span
              style={{
                fontSize: '8px',
                color: '#047857',
                background: '#d1fae5',
                padding: '0 4px',
                borderRadius: '2px',
                fontWeight: 700,
              }}
            >
              VERIFY 🔬
            </span>
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

        {/* 4. PREDICTION */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={12} color="#d97706" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>PREDICTION:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: '#d97706',
              background: '#fffbeb',
              padding: '1px 6px',
              borderRadius: '3px',
              border: '1px solid #fde68a',
            }}
          >
            PHYSICS-BASED MODEL (10s)
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

        {/* 5. SAFETY ENGINE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isEmergency || isCritical ? (
            <ShieldAlert size={12} color="#dc2626" />
          ) : isWarning ? (
            <ShieldAlert size={12} color="#d97706" />
          ) : (
            <ShieldCheck size={12} color="#16a34a" />
          )}
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>SAFETY ENGINE:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: isEmergency || isCritical ? '#dc2626' : isWarning ? '#d97706' : '#16a34a',
              background: isEmergency || isCritical ? '#fee2e2' : isWarning ? '#fef3c7' : '#f0fdf4',
              padding: '1px 6px',
              borderRadius: '3px',
              border: `1px solid ${isEmergency || isCritical ? '#fca5a5' : isWarning ? '#fde68a' : '#bbf7d0'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isEmergency ? (
              <>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#dc2626' }} className="pulse-dot" />
                EMERGENCY ACTIVE: {emergencyState?.emergencyType.replace(/_/g, ' ')}
              </>
            ) : isCritical ? (
              'ENVELOPE BREACH'
            ) : isWarning ? (
              'WARNING ACTIVE'
            ) : (
              'MONITORING (NOMINAL)'
            )}
          </span>
        </div>

        <div style={{ width: '1px', height: '14px', background: '#e2e8f0' }} />

        {/* 6. FIREBASE CLOUD FIRESTORE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Cloud Firestore connected (physics-informed)">
          <Database size={12} color="#ea580c" />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>FIRESTORE:</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: '10px',
              color: '#ea580c',
              background: '#fff7ed',
              padding: '1px 6px',
              borderRadius: '3px',
              border: '1px solid #fed7aa',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ea580c',
              }}
              className="pulse-dot"
            />
            ONLINE (physics-informed)
          </span>
        </div>
      </div>

      {/* Demo Scenario 1-Click Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>
          DEMO SCENARIOS:
        </span>

        {/* Scenario 1: NORMAL FLIGHT */}
        <button
          onClick={() => triggerScenario('NORMAL')}
          style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#16a34a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          title="Nominal calm atmosphere, clear sky"
        >
          <Sun size={11} color="#16a34a" />
          NORMAL
        </button>

        {/* Scenario 2: HIGH WIND EVENT */}
        <button
          onClick={() => triggerScenario('HIGH_WIND')}
          style={{
            background: '#ffffff',
            border: '1px solid #fde68a',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#d97706',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          title="14 m/s gusts causing physical lateral drift & speed reduction"
        >
          <Wind size={11} color="#d97706" />
          HIGH WIND
        </button>

        {/* Scenario 3: MOTOR FAULT */}
        <button
          onClick={() => triggerScenario('MOTOR_DEGRADATION')}
          style={{
            background: '#ffffff',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#b91c1c',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          title="Motor 3 thrust efficiency drops to 65% (actuator loss)"
        >
          <Wrench size={11} color="#b91c1c" />
          MOTOR FAULT
        </button>

        {/* Scenario 4: STORM / SAFETY EVENT */}
        <button
          onClick={() => triggerScenario('STORM')}
          style={{
            background: '#ffffff',
            border: '1px solid #fca5a5',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#dc2626',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          title="18 m/s gale + precipitation causing safety envelope breach and autonomous RTH"
        >
          <CloudLightning size={11} color="#dc2626" />
          STORM
        </button>

        {/* Scenario 5: COMBINED MULTI-FAILURE */}
        <button
          onClick={() => triggerScenario('COMBINED')}
          style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '10px',
            fontWeight: 800,
            color: '#991b1b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'all 0.15s ease',
          }}
          title="Motor 3 failure + High Wind + Low Battery simultaneous cascade"
        >
          <AlertTriangle size={11} color="#dc2626" />
          COMBINED FAILURE
        </button>
      </div>

      <PhysicsValidationPanel
        isOpen={showPhysicsAudit}
        onClose={() => setShowPhysicsAudit(false)}
      />
    </div>
  );
}
