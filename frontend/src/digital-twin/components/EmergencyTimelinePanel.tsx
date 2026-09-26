import { useDroneStore } from '../../store/droneStore';
import { History, AlertOctagon, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export function EmergencyTimelinePanel() {
  const events = useDroneStore((s) => s.emergencyEvents);
  const emergency = useDroneStore((s) => s.emergencyState);

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <History size={13} color="#0284c7" />
        <span>EMERGENCY EVENT TIMELINE</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '9px',
            fontWeight: 700,
            background: emergency?.emergencyActive ? '#fee2e2' : '#f1f5f9',
            color: emergency?.emergencyActive ? '#dc2626' : '#64748b',
            border: `1px solid ${emergency?.emergencyActive ? '#fca5a5' : '#e2e8f0'}`,
            padding: '1px 6px',
            borderRadius: '3px',
          }}
        >
          {events.length} EVENTS
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {events.length === 0 ? (
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 6px' }}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>Nominal mission execution. No active hazards or emergency events.</span>
          </div>
        ) : (
          events.map((evt) => {
            const isCrit = evt.severity === 'CRITICAL';
            const isWarn = evt.severity === 'WARNING';

            const dotColor = isCrit ? '#dc2626' : isWarn ? '#d97706' : '#16a34a';
            const bgColor = isCrit ? '#fef2f2' : isWarn ? '#fffbeb' : '#f8fafc';
            const borderColor = isCrit ? '#fecaca' : isWarn ? '#fde68a' : '#e2e8f0';

            return (
              <div
                key={evt.id}
                style={{
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  padding: '5px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, color: dotColor }}>
                    {isCrit ? (
                      <AlertOctagon size={11} color="#dc2626" />
                    ) : isWarn ? (
                      <AlertTriangle size={11} color="#d97706" />
                    ) : (
                      <CheckCircle2 size={11} color="#16a34a" />
                    )}
                    <span style={{ letterSpacing: '0.04em' }}>{evt.type.replace(/_/g, ' ')}</span>
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#64748b', fontWeight: 600 }}>
                    {evt.timeStr}
                  </span>
                </div>

                <div style={{ fontSize: '10px', color: '#334155', lineHeight: 1.3, paddingLeft: '16px' }}>
                  {evt.message}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
