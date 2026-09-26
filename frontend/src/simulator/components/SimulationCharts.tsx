import { useMemo } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import type { SimulationState } from '../simulation/simulationTypes';

interface SimulationChartsProps {
  history: SimulationState[];
}

const chartStyle = { fontSize: '9px', fontFamily: 'inherit' };

function MiniChart({ data, dataKey, color, label, unit, height = 72 }: {
  data: Record<string, number>[];
  dataKey: string;
  color: string;
  label: string;
  unit: string;
  height?: number;
}) {
  const lastVal = data.length > 0 ? (data[data.length - 1][dataKey] ?? 0) : 0;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px', padding: '0 4px' }}>
        <span style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '12px', color, fontWeight: 700 }}>
          {lastVal.toFixed(1)}<span style={{ fontSize: '9px', color: 'var(--text-muted)', marginLeft: '2px' }}>{unit}</span>
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 2, right: 2, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" />
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
          <YAxis tick={{ ...chartStyle, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-active)', fontSize: '10px', fontFamily: 'inherit', borderRadius: '2px' }}
            labelStyle={{ display: 'none' }}
            formatter={(v: any) => [`${Number(v ?? 0).toFixed(2)} ${unit}`, label]}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} fill={`url(#grad-${dataKey})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimulationCharts({ history }: SimulationChartsProps) {
  const WINDOW = 120;
  const data = useMemo(() => {
    const slice = history.slice(-WINDOW);
    return slice.map((s, i) => ({
      t: i,
      altitude: +s.position.z.toFixed(2),
      speed: +(Math.sqrt(s.velocity.x ** 2 + s.velocity.y ** 2 + s.velocity.z ** 2)).toFixed(2),
      battery: +s.battery.percentage.toFixed(1),
      rpm: +Math.round(s.motors.reduce((a, m) => a + m.rpm, 0) / 4),
    }));
  }, [history]);

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="dot pulse-dot" style={{ background: 'var(--cyan)' }} />
        LIVE TELEMETRY CHARTS
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '9px' }}>
          WINDOW: {Math.min(history.length, WINDOW)} SAMPLES
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', gap: '8px', padding: '8px', overflow: 'hidden' }}>
        <MiniChart data={data} dataKey="altitude" color="var(--cyan)" label="ALTITUDE" unit="m" />
        <MiniChart data={data} dataKey="speed" color="var(--blue)" label="SPEED" unit="m/s" />
        <MiniChart data={data} dataKey="battery" color="var(--green)" label="BATTERY" unit="%" />
        <MiniChart data={data} dataKey="rpm" color="var(--violet)" label="AVG RPM" unit="" />
      </div>
    </div>
  );
}