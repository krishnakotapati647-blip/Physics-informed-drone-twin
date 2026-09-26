import type { SimulationState } from '../simulation/simulationTypes';

interface EnvironmentPanelProps { state: SimulationState; }

function EnvRow({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
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

function WindRose({ direction, speed }: { direction: number; speed: number }) {
  const rad = ((direction - 90) * Math.PI) / 180;
  const cx = 28, cy = 28, r = 20;
  const arrowX = cx + r * Math.cos(rad);
  const arrowY = cy + r * Math.sin(rad);
  const intensity = Math.min(1, speed / 15);
  const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#06b6d4';
  return (
    <svg width={56} height={56} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#0f1f30" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke="#0f1f30" strokeWidth={1} />
      {['N','E','S','W'].map((d, i) => {
        const a = (i * 90 * Math.PI) / 180;
        return <text key={d} x={cx + (r+6) * Math.cos(a - Math.PI/2)} y={cy + (r+6) * Math.sin(a - Math.PI/2)} textAnchor="middle" dominantBaseline="middle" fill="#3a5470" fontSize={7}>{d}</text>;
      })}
      <line x1={cx} y1={cy} x2={arrowX} y2={arrowY} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <circle cx={arrowX} cy={arrowY} r={2} fill={color} />
      <circle cx={cx} cy={cy} r={2.5} fill="#06b6d4" />
    </svg>
  );
}

export function EnvironmentPanel({ state }: EnvironmentPanelProps) {
  const { environment, payloadKg } = state;
  const turbStr = environment.turbulence < 0.1 ? 'CALM' : environment.turbulence < 0.3 ? 'LIGHT' : environment.turbulence < 0.6 ? 'MODERATE' : 'SEVERE';
  const turbColor = environment.turbulence < 0.1 ? 'var(--green)' : environment.turbulence < 0.3 ? 'var(--cyan)' : environment.turbulence < 0.6 ? 'var(--amber)' : 'var(--red)';
  const windColor = environment.windSpeed < 5 ? 'var(--green)' : environment.windSpeed < 10 ? 'var(--cyan)' : environment.windSpeed < 15 ? 'var(--amber)' : 'var(--red)';
  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="dot" style={{ background: 'var(--blue)' }} />
        ENVIRONMENT
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderBottom: '1px solid var(--border-dim)' }}>
          <WindRose direction={environment.windDirection} speed={environment.windSpeed} />
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '9px', letterSpacing: '0.1em', marginBottom: '3px' }}>WIND</div>
            <div style={{ color: windColor, fontSize: '15px', fontWeight: 700 }}>{environment.windSpeed.toFixed(1)}<span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '3px' }}>m/s</span></div>
            <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{environment.windDirection.toFixed(0)}° {getCardinal(environment.windDirection)}</div>
          </div>
        </div>
        <EnvRow label="TEMPERATURE" value={environment.temperature.toFixed(1)} unit="°C" />
        <EnvRow label="AIR DENSITY" value={environment.airDensity.toFixed(3)} unit="kg/m³" />
        <EnvRow label="TURBULENCE" value={turbStr} color={turbColor} />
        <EnvRow
          label="VISIBILITY"
          value={`${Math.round((environment.visibility ?? 1.0) * 100)}%`}
          unit={environment.visibility < 0.35 ? 'FOG' : environment.visibility < 0.8 ? 'HAZE' : 'CLEAR'}
          color={environment.visibility < 0.35 ? 'var(--red)' : environment.visibility < 0.8 ? 'var(--amber)' : 'var(--green)'}
        />
        <EnvRow
          label="PRECIPITATION"
          value={environment.rain ? 'RAIN' : 'NONE'}
          color={environment.rain ? 'var(--red)' : 'var(--green)'}
        />
        <EnvRow label="PAYLOAD" value={payloadKg.toFixed(2)} unit="kg" color={payloadKg > 0.3 ? 'var(--amber)' : undefined} />
        <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border-dim)', marginTop: '4px' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '5px' }}>SCENARIO</div>
          <span className={`badge ${state.scenario === 'NORMAL' ? 'badge-green' : 'badge-amber'}`}>
            {state.scenario.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}

function getCardinal(deg: number): string {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}