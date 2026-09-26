import type { TelemetryFrame } from '../../types';
import { useDroneStore } from '../../store/droneStore';
import { Gauge, Wind, AlertTriangle } from 'lucide-react';

interface CurrentStatePanelProps {
  telemetry: TelemetryFrame | null;
}

function SRow({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) {
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

export function CurrentStatePanel({ telemetry }: CurrentStatePanelProps) {
  const emergencyState = useDroneStore((s) => s.emergencyState);
  const prediction = useDroneStore((s) => s.prediction);

  const pos = telemetry?.position ?? { x: 0, y: 0, z: 0 };
  const vel = telemetry?.velocity ?? { vx: 0, vy: 0, vz: 0 };
  const att = telemetry?.attitude ?? { roll: 0, pitch: 0, yaw: 0 };
  const env = telemetry?.environment;

  const horizSpd = Math.sqrt(vel.vx ** 2 + vel.vy ** 2);
  const totalSpd = Math.sqrt(vel.vx ** 2 + vel.vy ** 2 + vel.vz ** 2);

  const isWindDisturbance =
    Boolean(emergencyState?.emergencyActive &&
      (emergencyState.emergencyType === 'HIGH_WIND' ||
        emergencyState.emergencyType === 'STORM' ||
        emergencyState.emergencyType === 'COMBINED_FAILURE')) ||
    Boolean(env && env.wind_speed > 10);

  const driftMag =
    prediction?.predicted_drift_magnitude_m ??
    (prediction?.drift_m ? Math.sqrt(prediction.drift_m.x ** 2 + prediction.drift_m.y ** 2) : 0);

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <Gauge size={13} color="#0284c7" />
        <span>SYNCHRONIZED STATE</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
          SEQ #{telemetry?.sequence ?? 0}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Prominent Environmental Disturbance Card */}
        {isWindDisturbance && (
          <div
            style={{
              margin: '6px 8px 4px 8px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderLeft: '4px solid #f59e0b',
              borderRadius: '4px',
              padding: '6px 8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9.5px', fontWeight: 800, color: '#b45309' }}>
                <Wind size={12} color="#d97706" />
                <span>
                  {emergencyState?.emergencyType === 'STORM'
                    ? 'ENVIRONMENTAL DISTURBANCE: SEVERE STORM'
                    : 'ENVIRONMENTAL DISTURBANCE: HIGH WIND'}
                </span>
              </div>
              <span style={{ fontSize: '8.5px', fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 5px', borderRadius: '2px', border: '1px solid #fde68a' }}>
                ACTIVE
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginBottom: '5px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #fef3c7', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: '#78350f', fontWeight: 700 }}>WIND SPD</div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309' }}>{(env?.wind_speed ?? 0).toFixed(1)} m/s</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #fef3c7', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: '#78350f', fontWeight: 700 }}>HEADING</div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309' }}>{(env?.wind_direction ?? 0).toFixed(0)}°</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #fef3c7', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: '#78350f', fontWeight: 700 }}>TURBULENCE</div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#b45309' }}>{Math.round((env?.turbulence ?? 0) * 100)}%</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #fef3c7', padding: '2px 4px', borderRadius: '3px', textAlign: 'center' }}>
                <div style={{ fontSize: '8px', color: '#78350f', fontWeight: 700 }}>PRED. DRIFT</div>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: driftMag > 3 ? '#dc2626' : '#b45309' }}>
                  {driftMag.toFixed(1)} m
                </div>
              </div>
            </div>

            <div style={{ fontSize: '9px', color: '#92400e', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={11} color="#d97706" style={{ flexShrink: 0 }} />
              <span>
                {emergencyState?.recommendedAction ||
                  'Aerodynamic drag elevated. Autonomous speed reduction recommended.'}
              </span>
            </div>
          </div>
        )}
        <div style={{ padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '2px 12px', fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>COORDINATES</div>
          <SRow label="ALTITUDE" value={pos.z.toFixed(2)} unit="m" />
          <SRow label="X (EAST)" value={pos.x.toFixed(2)} unit="m" />
          <SRow label="Y (NORTH)" value={pos.y.toFixed(2)} unit="m" />
        </div>

        <div style={{ padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '2px 12px', fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>VELOCITY</div>
          <SRow label="TOTAL SPEED" value={totalSpd.toFixed(2)} unit="m/s" />
          <SRow label="HORIZ SPEED" value={horizSpd.toFixed(2)} unit="m/s" />
          <SRow label="CLIMB RATE" value={vel.vz.toFixed(2)} unit="m/s" />
        </div>

        <div style={{ padding: '2px 0', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '2px 12px', fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>ATTITUDE</div>
          <SRow label="ROLL" value={att.roll.toFixed(1)} unit="°" />
          <SRow label="PITCH" value={att.pitch.toFixed(1)} unit="°" />
          <SRow label="YAW" value={att.yaw.toFixed(1)} unit="°" />
        </div>

        <div style={{ padding: '2px 0' }}>
          <div style={{ padding: '2px 12px', fontSize: '9px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em' }}>ENVIRONMENT</div>
          <SRow label="WIND SPEED" value={env ? env.wind_speed.toFixed(1) : '0.0'} unit="m/s" />
          <SRow label="WIND HEADING" value={env ? `${env.wind_direction.toFixed(0)}°` : '0°'} />
          <SRow label="TURBULENCE" value={env ? `${Math.round(env.turbulence * 100)}%` : '0%'} />
          <SRow
            label="VISIBILITY"
            value={env && env.visibility !== undefined ? `${Math.round(env.visibility * 100)}%` : '100%'}
            color={env && env.visibility < 0.35 ? '#dc2626' : env && env.visibility < 0.8 ? '#d97706' : '#16a34a'}
          />
          <SRow
            label="WEATHER"
            value={env?.rain ? 'RAIN STORM' : env && env.visibility < 0.35 ? 'DENSE FOG' : env && env.wind_speed > 12 ? 'HIGH WIND' : 'CLEAR'}
            color={env?.rain || (env && env.wind_speed > 16) ? '#dc2626' : env && env.visibility < 0.35 ? '#d97706' : '#16a34a'}
          />
        </div>
      </div>
    </div>
  );
}