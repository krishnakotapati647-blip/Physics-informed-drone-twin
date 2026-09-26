import { useState } from 'react';
import type { VehicleHealth } from '../../types';
import { AlertOctagon, Cpu, X } from 'lucide-react';

interface VehicleHealthPanelProps {
  health: VehicleHealth | null;
}

export function VehicleHealthPanel({ health }: VehicleHealthPanelProps) {
  const [selectedComp, setSelectedComp] = useState<string | null>(null);

  const overall = health ? Math.round(health.overall * 100) : 100;
  const status = health?.status ?? 'NOMINAL';

  const components = health
    ? [
        health.motor1,
        health.motor2,
        health.motor3,
        health.motor4,
        health.battery,
        health.structure,
      ]
    : [
        { component: 'Motor 1', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Nominal operation' },
        { component: 'Motor 2', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Nominal operation' },
        { component: 'Motor 3', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Nominal operation' },
        { component: 'Motor 4', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Nominal operation' },
        { component: 'Battery', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Voltage nominal' },
        { component: 'Structure', health: 1.0, status: 'NOMINAL', temperature: 25, notes: 'Airframe stress within limits' },
      ];

  const activeComp = components.find((c) => c.component === selectedComp);

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <Cpu size={13} color="#0284c7" />
        <span>VEHICLE HEALTH MATRIX</span>
        <span
          style={{ marginLeft: 'auto' }}
          className={`badge ${
            status === 'CRITICAL' ? 'badge-red' : status === 'DEGRADED' ? 'badge-amber' : 'badge-green'
          }`}
        >
          {status} ({overall}%)
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        {/* Active Component Fault Banner */}
        {components.some((c) => c.status === 'CRITICAL' || c.status === 'DEGRADED') && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              padding: '6px 10px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertOctagon size={14} color="#dc2626" />
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#dc2626' }}>
              ACTUATOR / SUBSYSTEM FAULT: {components.find((c) => c.status === 'CRITICAL')?.component ?? 'Component'} Degraded
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#991b1b' }}>
                {components.find((c) => c.status === 'CRITICAL')?.notes ?? 'Thrust asymmetry induced'}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
          {components.map((comp) => {
            const isDegraded = comp.status === 'DEGRADED';
            const isCritical = comp.status === 'CRITICAL';
            const isSelected = selectedComp === comp.component;

            const borderColor = isCritical ? '#dc2626' : isDegraded ? '#d97706' : isSelected ? '#0284c7' : '#e2e8f0';
            const bgColor = isCritical ? '#fee2e2' : isDegraded ? '#fef3c7' : isSelected ? '#f0f9ff' : '#f8fafc';
            const statusLabel = isCritical ? 'FAULT' : isDegraded ? 'DEGRADED' : 'NORMAL';

            return (
              <div
                key={comp.component}
                onClick={() => setSelectedComp(isSelected ? null : comp.component)}
                style={{
                  background: bgColor,
                  border: `${isCritical ? '2px' : '1px'} solid ${borderColor}`,
                  padding: '6px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isCritical ? '0 0 10px rgba(220, 38, 38, 0.25)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: isCritical ? '#dc2626' : isDegraded ? '#d97706' : '#0f172a' }}>
                    {comp.component.toUpperCase()}
                  </span>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '2px',
                      background: isCritical ? '#dc2626' : isDegraded ? '#d97706' : '#16a34a',
                      color: '#ffffff',
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: isCritical ? '#dc2626' : isDegraded ? '#d97706' : '#0f172a' }}>
                    {Math.round(comp.health * 100)}%
                  </span>
                  <span style={{ fontFamily: 'monospace' }}>{comp.temperature.toFixed(0)}°C</span>
                </div>

                <div className="progress-bar">
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.round(comp.health * 100)}%`,
                      background: isCritical ? '#dc2626' : isDegraded ? '#d97706' : '#16a34a',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Progressive Disclosure Diagnostic Drawer */}
        {activeComp && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              fontSize: '10px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{activeComp.component.toUpperCase()} DIAGNOSTICS</span>
              <button
                onClick={() => setSelectedComp(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={12} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginBottom: '4px' }}>
              <div>
                <span style={{ color: '#64748b' }}>EFFICIENCY: </span>
                <span style={{ fontWeight: 700, color: activeComp.health < 0.75 ? '#dc2626' : '#16a34a' }}>
                  {Math.round(activeComp.health * 100)}%
                </span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>TEMP: </span>
                <span style={{ fontWeight: 700 }}>{activeComp.temperature.toFixed(1)}°C</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>STATUS: </span>
                <span style={{ fontWeight: 700 }}>{activeComp.status}</span>
              </div>
            </div>
            <div style={{ color: '#475569', fontSize: '9px' }}>
              <span style={{ fontWeight: 600 }}>EFFECT: </span>
              {activeComp.notes || 'Operating within standard tolerances.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}