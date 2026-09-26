import type { SimulationState } from '../simulation/simulationTypes';

interface MissionPanelProps { state: SimulationState; }

const PHASE_BADGE: Record<string, string> = {
  IDLE: 'badge-dim', TAKEOFF: 'badge-cyan', NAVIGATING: 'badge-blue',
  HOVERING: 'badge-cyan', RETURNING: 'badge-amber', LANDING: 'badge-amber',
  COMPLETED: 'badge-green', PAUSED: 'badge-dim', ABORTED: 'badge-red',
};

export function MissionPanel({ state }: MissionPanelProps) {
  const { phase, waypoints, missionProgress, missionElapsed, distanceToNext, etaToNext, loiterRemaining } = state;
  const completedCount = waypoints.filter((w) => w.status === 'COMPLETED' && w.id !== 0).length;
  const totalNav = waypoints.length - 1;
  const elapsedStr = formatTime(missionElapsed);

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="dot" style={{ background: 'var(--indigo)' }} />
        MISSION STATUS
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.1em' }}>PHASE</span>
          <span className={`badge ${PHASE_BADGE[phase] ?? 'badge-dim'}`}>{phase}</span>
        </div>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>PROGRESS</span>
            <span style={{ color: 'var(--cyan)', fontSize: '10px' }}>{Math.round(missionProgress * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${missionProgress * 100}%` }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '8px' }}>
          {[
            { label: 'WAYPOINT', value: `${completedCount}/${totalNav}` },
            { label: 'ELAPSED', value: elapsedStr },
            { label: 'DIST TO NEXT', value: distanceToNext > 0 ? `${distanceToNext.toFixed(0)}m` : '—' },
            { label: 'ETA', value: etaToNext > 0 ? `${etaToNext.toFixed(0)}s` : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(10,17,30,0.8)', border: '1px solid var(--border-dim)', padding: '5px 8px', borderRadius: '2px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.08em', marginBottom: '2px' }}>{label}</div>
              <div style={{ color: 'var(--cyan)', fontSize: '11px', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
        {phase === 'HOVERING' && (
          <div style={{ marginBottom: '6px', padding: '5px 8px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: '2px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', marginBottom: '2px' }}>LOITER REMAINING</div>
            <div style={{ color: 'var(--cyan)', fontSize: '13px', fontWeight: 700 }}>{loiterRemaining.toFixed(1)}s</div>
          </div>
        )}
        <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: '6px' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.1em', marginBottom: '4px' }}>WAYPOINTS</div>
          {waypoints.filter(w => w.id !== 0).map((wp) => (
            <div key={wp.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 6px', marginBottom: '2px', borderRadius: '2px',
              background: wp.status === 'CURRENT' ? 'rgba(245,158,11,0.06)' : 'transparent',
              border: `1px solid ${wp.status === 'CURRENT' ? 'rgba(245,158,11,0.2)' : 'transparent'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: wp.status === 'COMPLETED' ? 'var(--green)' : wp.status === 'CURRENT' ? 'var(--amber)' : 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ color: wp.status === 'CURRENT' ? 'var(--amber)' : wp.status === 'COMPLETED' ? 'var(--text-muted)' : 'var(--text-secondary)', fontSize: '10px' }}>{wp.name}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>ALT {wp.position.z}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}