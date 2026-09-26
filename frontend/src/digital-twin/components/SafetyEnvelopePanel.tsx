import type { SafeOperatingEnvelope } from '../../types';
import { ShieldCheck, AlertTriangle, AlertOctagon, TrendingUp } from 'lucide-react';

interface SafetyEnvelopePanelProps {
  envelope: SafeOperatingEnvelope | null;
}

export function SafetyEnvelopePanel({ envelope }: SafetyEnvelopePanelProps) {
  const status = envelope?.status ?? 'SAFE';
  const score = envelope ? Math.round(envelope.overall_score * 100) : 100;
  const violations = envelope?.violations ?? [];
  const warnings = envelope?.warnings ?? [];
  const riskScore = envelope?.predicted_risk_score ?? 5;
  const timeToBreach = envelope?.predicted_time_to_breach_s;

  const statusBadge =
    status === 'OUTSIDE_ENVELOPE'
      ? 'badge-red'
      : status === 'WARNING'
      ? 'badge-amber'
      : 'badge-green';

  const margins = [
    { label: 'WIND MARGIN', value: envelope ? `${envelope.wind_margin.toFixed(1)} m/s` : '12.0 m/s', safe: (envelope?.wind_margin ?? 12) > 2 },
    { label: 'BATTERY MARGIN', value: envelope ? `${envelope.battery_margin.toFixed(0)}%` : '80%', safe: (envelope?.battery_margin ?? 80) > 10 },
    { label: 'SPEED MARGIN', value: envelope ? `${envelope.speed_margin.toFixed(1)} m/s` : '15.0 m/s', safe: (envelope?.speed_margin ?? 15) > 2 },
    { label: 'THERMAL MARGIN', value: envelope ? `${envelope.temperature_margin.toFixed(0)}°C` : '30°C', safe: (envelope?.temperature_margin ?? 30) > 8 },
  ];

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <ShieldCheck size={13} color="#16a34a" />
        <span>SAFE OPERATING ENVELOPE</span>
        <span style={{ marginLeft: 'auto' }} className={`badge ${statusBadge}`}>
          {status} ({score}%)
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {/* Forward Risk Horizon & Breach Forecast Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: riskScore > 65 ? '#fee2e2' : riskScore > 35 ? '#fef3c7' : '#f0fdf4',
            border: `1px solid ${riskScore > 65 ? '#fca5a5' : riskScore > 35 ? '#fde68a' : '#bbf7d0'}`,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '9.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TrendingUp size={12} color={riskScore > 65 ? '#dc2626' : riskScore > 35 ? '#d97706' : '#16a34a'} />
            <span style={{ fontWeight: 700, color: '#0f172a' }}>FORWARD RISK (10s):</span>
            <span style={{ fontWeight: 800, color: riskScore > 65 ? '#dc2626' : riskScore > 35 ? '#d97706' : '#16a34a' }}>
              {riskScore}% RISK INDEX
            </span>
          </div>
          <div style={{ color: '#475569' }}>
            BREACH TIMELINE:{' '}
            <span style={{ fontWeight: 800, color: timeToBreach ? '#dc2626' : '#16a34a', fontFamily: 'monospace' }}>
              {timeToBreach ? `T + ${timeToBreach}s` : 'NOMINAL (SAFE)'}
            </span>
          </div>
        </div>

        {/* Margin Meters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {margins.map((m) => (
            <div
              key={m.label}
              style={{
                background: m.safe ? '#f8fafc' : '#fee2e2',
                border: `1px solid ${m.safe ? '#e2e8f0' : '#fca5a5'}`,
                padding: '6px 8px',
                borderRadius: '4px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>{m.label}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: m.safe ? '#0f172a' : '#dc2626', fontFamily: 'monospace' }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Violations / Warnings Feed */}
        {violations.length > 0 && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', padding: '6px 10px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: '#dc2626', marginBottom: '3px' }}>
              <AlertOctagon size={13} />
              <span>ACTIVE ENVELOPE BREACHES:</span>
            </div>
            {violations.map((v, i) => (
              <div key={i} style={{ fontSize: '10px', color: '#991b1b', paddingLeft: '18px' }}>
                • {v}
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && violations.length === 0 && (
          <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: '#d97706', marginBottom: '3px' }}>
              <AlertTriangle size={13} />
              <span>MARGIN WARNINGS:</span>
            </div>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: '10px', color: '#92400e', paddingLeft: '18px' }}>
                • {w}
              </div>
            ))}
          </div>
        )}

        {violations.length === 0 && warnings.length === 0 && (
          <div style={{ fontSize: '11px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
            <ShieldCheck size={14} />
            <span style={{ fontWeight: 600 }}>All aerodynamic, thermal, and electrical limits nominal.</span>
          </div>
        )}

        <div style={{ fontSize: '9px', color: '#94a3b8', fontStyle: 'italic', marginTop: 'auto' }}>
          *Simulation estimate based on real flight margins. Not aviation certified.
        </div>
      </div>
    </div>
  );
}