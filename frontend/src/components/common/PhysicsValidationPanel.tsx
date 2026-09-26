import { useState, useEffect } from 'react';
import { simulationEngine } from '../../simulator/simulation/simulationEngine';
import type { PhysicsValidationReport } from '../../simulator/simulation/simulationTypes';
import { useDroneStore } from '../../store/droneStore';
import {
  X,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface PhysicsValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PhysicsValidationPanel({ isOpen, onClose }: PhysicsValidationPanelProps) {
  const [report, setReport] = useState<PhysicsValidationReport | null>(null);
  const [running, setRunning] = useState(false);
  const telemetry = useDroneStore((s) => s.telemetry);

  const runAudit = async () => {
    setRunning(true);
    try {
      const rep = await simulationEngine.runPhysicsValidationSuite();
      setReport(rep);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                boxShadow: '0 0 12px rgba(2, 132, 199, 0.5)',
              }}
            >
              <Cpu size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '0.04em' }}>
                  PHYSICS ENGINE BENCHMARK &amp; AUDIT
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: report?.overallStatus === 'PASS' ? '#059669' : '#d97706',
                    color: '#ffffff',
                  }}
                >
                  {report ? `${report.passedCount} / ${report.totalCount} PASS` : 'AUDITING...'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Rigorous mathematical verification of 6-DoF Newtonian dynamics, drag, wind, density &amp; battery
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={runAudit}
              disabled={running}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: running ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <RefreshCw size={13} className={running ? 'spin' : ''} />
              {running ? 'BENCHMARKING...' : 'RE-RUN AUDIT'}
            </button>
            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Live 6-DoF Dynamics Status Strip */}
        <div
          style={{
            padding: '10px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            fontSize: '11px',
          }}
        >
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Position [X, Y, Z]:</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
              [{telemetry?.position.x.toFixed(2) ?? '0.00'}, {telemetry?.position.y.toFixed(2) ?? '0.00'}, {telemetry?.position.z.toFixed(2) ?? '0.00'}] m
            </div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Velocity [Vx, Vy, Vz]:</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
              [{telemetry?.velocity.vx.toFixed(2) ?? '0.00'}, {telemetry?.velocity.vy.toFixed(2) ?? '0.00'}, {telemetry?.velocity.vz.toFixed(2) ?? '0.00'}] m/s
            </div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Attitude [Roll, Pitch, Yaw]:</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
              [{telemetry?.attitude.roll.toFixed(1) ?? '0.0'}°, {telemetry?.attitude.pitch.toFixed(1) ?? '0.0'}°, {telemetry?.attitude.yaw.toFixed(1) ?? '0.0'}°]
            </div>
          </div>
          <div>
            <span style={{ color: '#64748b', fontWeight: 600 }}>Angular Rates [p, q, r]:</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
              [{telemetry?.angular_rates?.roll_rate.toFixed(1) ?? '0.0'}, {telemetry?.angular_rates?.pitch_rate.toFixed(1) ?? '0.0'}, {telemetry?.angular_rates?.yaw_rate.toFixed(1) ?? '0.0'}] °/s
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {report?.items.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px 16px',
                backgroundColor: item.status === 'PASS' ? '#fafafa' : '#fff1f2',
                borderLeft: `4px solid ${item.status === 'PASS' ? '#10b981' : '#f43f5e'}`,
              }}
            >
              {/* Item Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      backgroundColor: item.status === 'PASS' ? '#ecfdf5' : '#fee2e2',
                      color: item.status === 'PASS' ? '#047857' : '#b91c1c',
                      border: `1px solid ${item.status === 'PASS' ? '#a7f3d0' : '#fca5a5'}`,
                      borderRadius: '3px',
                      padding: '1px 6px',
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#0284c7',
                    backgroundColor: '#f0f9ff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid #bae6fd',
                  }}
                >
                  {item.equation}
                </div>
              </div>

              {/* Monitored Metric */}
              <div style={{ fontSize: '11px', color: '#475569', marginBottom: '6px' }}>
                <strong style={{ color: '#0f172a' }}>Monitored Metric: </strong>
                {item.metric}
              </div>

              {/* Before vs After Measured Values */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #f1f5f9',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  marginBottom: '6px',
                }}
              >
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Reference State: </span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{item.beforeValue}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Physical Response: </span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{item.afterValue}</span>
                </div>
              </div>

              {/* Physical Detail explanation */}
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                {item.details}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Discrete Integration: <strong>Euler (20 Hz, dt = 50ms)</strong> | Frame: <strong>{telemetry?.sequence ?? 0}</strong>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            DISMISS AUDIT
          </button>
        </div>
      </div>
    </div>
  );
}
