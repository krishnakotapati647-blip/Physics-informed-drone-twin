import type { SimulationState } from '../simulation/simulationTypes';

interface MissionControlsProps {
  state: SimulationState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onRTH: () => void;
  onAbort: () => void;
}

export function MissionControls({ state, onStart, onPause, onResume, onReset, onRTH, onAbort }: MissionControlsProps) {
  const { running, paused, phase } = state;
  const isActive = running && !paused;
  const isDone = phase === 'COMPLETED' || phase === 'ABORTED';

  const statusColor =
    isDone && phase === 'COMPLETED' ? 'var(--green)' :
    isDone ? 'var(--red)' :
    paused ? 'var(--amber)' :
    running ? 'var(--cyan)' : 'var(--text-muted)';

  const statusLabel =
    phase === 'IDLE'       ? 'READY' :
    phase === 'TAKEOFF'    ? 'TAKING OFF' :
    phase === 'NAVIGATING' ? 'EN ROUTE' :
    phase === 'HOVERING'   ? 'HOLDING' :
    phase === 'RETURNING'  ? 'RTH' :
    phase === 'LANDING'    ? 'LANDING' :
    phase === 'COMPLETED'  ? 'COMPLETED' :
    phase === 'PAUSED'     ? 'PAUSED' :
    phase === 'ABORTED'    ? 'ABORTED' : phase;

  return (
    <div className="aero-panel">
      <div className="panel-header">
        <div className="dot" style={{ background: statusColor }} />
        MISSION CONTROL
        <span style={{ marginLeft: 'auto', color: statusColor, fontSize: '10px', letterSpacing: '0.06em' }}>
          {paused ? 'PAUSED' : statusLabel}
        </span>
      </div>
      <div style={{ padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {/* START */}
        {(!running || isDone) && (
          <button className={`ctrl-btn${!running ? ' active' : ''}`} onClick={onStart}>
            ▶ START
          </button>
        )}
        {/* PAUSE */}
        {running && !paused && !isDone && (
          <button className="ctrl-btn" onClick={onPause}>⏸ PAUSE</button>
        )}
        {/* RESUME */}
        {paused && (
          <button className="ctrl-btn active" onClick={onResume}>▶ RESUME</button>
        )}
        {/* RESET */}
        <button className="ctrl-btn" onClick={onReset}>↺ RESET</button>
        {/* RTH */}
        <button
          className="ctrl-btn warn"
          onClick={onRTH}
          disabled={!isActive || phase === 'RETURNING' || phase === 'LANDING'}
        >
          ⬏ RTH
        </button>
        {/* ABORT */}
        <button
          className="ctrl-btn danger"
          onClick={onAbort}
          disabled={isDone}
        >
          ✕ ABORT
        </button>

        {/* Status info */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span>T+{Math.floor(state.missionElapsed)}s</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>BAT <span style={{ color: state.battery.percentage < 20 ? 'var(--red)' : 'var(--cyan)' }}>{state.battery.percentage.toFixed(0)}%</span></span>
          <span>|</span>
          <span>ALT <span style={{ color: 'var(--cyan)' }}>{state.position.z.toFixed(1)}m</span></span>
        </div>
      </div>
    </div>
  );
}