import type { SimulationState } from '../simulation/simulationTypes';

interface TelemetryPanelProps { state: SimulationState; }

function TRow({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
  return (
    <div className="telem-row">
      <span className="telem-label">{label}</span>
      <span>
        <span className="telem-value" style={color ? { color } : {}}>{value}</span>
        {unit && <span className="telem-unit">{unit}</span>}
      </span>
    </div>
  );
}

export function TelemetryPanel({ state }: TelemetryPanelProps) {
  const { position, velocity, motors, battery } = state;
  const horizSpeed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);
  const groundSpeed = horizSpeed;
  const airSpeed = Math.max(0, horizSpeed + state.environment.windSpeed * 0.1);

  const batColor =
    battery.percentage < 20 ? 'var(--red)' :
    battery.percentage < 40 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="dot pulse-dot" style={{ background: 'var(--cyan)' }} />
        LIVE TELEMETRY
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border-dim)', marginBottom: '2px' }}>
          <div style={{ padding: '2px 10px 1px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>POSITION</div>
          <TRow label="ALTITUDE" value={position.z.toFixed(1)} unit="m" />
          <TRow label="X (EAST)" value={position.x.toFixed(1)} unit="m" />
          <TRow label="Y (NORTH)" value={position.y.toFixed(1)} unit="m" />
        </div>
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border-dim)', marginBottom: '2px' }}>
          <div style={{ padding: '2px 10px 1px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>VELOCITY</div>
          <TRow label="AIRSPEED" value={airSpeed.toFixed(1)} unit="m/s" />
          <TRow label="GND SPEED" value={groundSpeed.toFixed(1)} unit="m/s" />
          <TRow label="VERT SPD" value={velocity.z.toFixed(2)} unit="m/s" />
        </div>
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border-dim)', marginBottom: '2px' }}>
          <div style={{ padding: '2px 10px 1px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>ATTITUDE</div>
          <TRow label="ROLL" value={state.roll.toFixed(1)} unit="°" />
          <TRow label="PITCH" value={state.pitch.toFixed(1)} unit="°" />
          <TRow label="YAW" value={state.yaw.toFixed(1)} unit="°" />
        </div>
        <div style={{ padding: '4px 0', borderBottom: '1px solid var(--border-dim)', marginBottom: '2px' }}>
          <div style={{ padding: '2px 10px 1px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>POWER</div>
          <TRow label="BATTERY" value={battery.percentage.toFixed(1)} unit="%" color={batColor} />
          <TRow label="VOLTAGE" value={battery.voltage.toFixed(2)} unit="V" />
          <TRow label="CURRENT" value={battery.current.toFixed(1)} unit="A" />
          <TRow label="TEMP" value={battery.temperature.toFixed(1)} unit="°C" />
        </div>
        <div style={{ padding: '4px 0' }}>
          <div style={{ padding: '2px 10px 1px', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>MOTORS (AVG RPM)</div>
          {motors.map((m) => (
            <TRow
              key={m.id}
              label={`M${m.id}`}
              value={Math.round(m.rpm).toString()}
              unit="rpm"
              color={m.efficiency < 0.7 ? 'var(--red)' : m.efficiency < 0.9 ? 'var(--amber)' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}