import type { EnergyState } from '../../types';
import { useDroneStore } from '../../store/droneStore';
import { Battery, Zap, Clock, Navigation, AlertTriangle, RotateCcw } from 'lucide-react';

interface EnergyAnalysisPanelProps {
  energy: EnergyState | null;
}

export function EnergyAnalysisPanel({ energy }: EnergyAnalysisPanelProps) {
  const emergencyState = useDroneStore((s) => s.emergencyState);
  const batPct = energy?.battery_percent ?? 100;
  const powerW = energy?.power_w ?? 0;
  const remWh = energy?.energy_remaining_wh ?? 76.96;
  const enduranceS = energy?.endurance_s ?? 0;
  const rangeM = energy?.range_m ?? 0;
  const landingBatPct = energy?.landing_battery_pct ?? 100;

  const minutes = Math.floor(enduranceS / 60);
  const seconds = Math.floor(enduranceS % 60);

  const isLowBattery =
    Boolean(emergencyState?.emergencyActive &&
      (emergencyState.emergencyType === 'LOW_BATTERY' || emergencyState.emergencyType === 'COMBINED_FAILURE')) ||
    batPct < 25;

  const batColor =
    batPct < 20 ? '#dc2626' : batPct < 35 ? '#d97706' : '#16a34a';

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <Battery size={13} color="#0284c7" />
        <span>ENERGY & ENDURANCE FORECAST</span>
        <span style={{ marginLeft: 'auto', color: batColor, fontWeight: 800, fontFamily: 'monospace' }}>
          {batPct.toFixed(1)}%
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {/* Low Battery Hazard & RTH Mandated Hero Card */}
        {isLowBattery && (
          <div
            style={{
              background: '#fee2e2',
              border: '1px solid #fca5a5',
              borderLeft: '4px solid #dc2626',
              padding: '6px 10px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={14} color="#dc2626" />
              <div>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#991b1b', letterSpacing: '0.04em' }}>
                  ⚠ LOW BATTERY HAZARD — RETURN TO BASE REQUIRED
                </div>
                <div style={{ fontSize: '9px', color: '#b91c1c' }}>
                  {emergencyState?.emergencyReason || `Battery level at ${batPct.toFixed(1)}%. Reserve endurance critical.`}
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#dc2626',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              <RotateCcw size={10} />
              RTH MANDATED
            </div>
          </div>
        )}

        {/* Main endurance readouts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>
              <Clock size={11} color="#0284c7" />
              <span style={{ fontWeight: 600 }}>EST. ENDURANCE</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {minutes}m {seconds.toString().padStart(2, '0')}s
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>
              <Zap size={11} color="#d97706" />
              <span style={{ fontWeight: 600 }}>POWER DRAW</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {powerW.toFixed(0)} <span style={{ fontSize: '10px', color: '#64748b' }}>W</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 8px', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#64748b', marginBottom: '2px' }}>
              <Navigation size={11} color="#16a34a" />
              <span style={{ fontWeight: 600 }}>EST. RANGE</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {rangeM > 1000 ? `${(rangeM / 1000).toFixed(1)} km` : `${rangeM.toFixed(0)} m`}
            </div>
          </div>
        </div>

        {/* Energy breakdown lines */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>REMAINING STORED ENERGY</span>
          <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{remWh.toFixed(1)} Wh</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>PREDICTED LANDING RESERVE</span>
          <span style={{ color: landingBatPct < 20 ? '#dc2626' : '#16a34a', fontWeight: 700, fontFamily: 'monospace' }}>
            {landingBatPct.toFixed(1)}%
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '3px 0' }}>
          <span style={{ color: '#64748b', fontWeight: 600 }}>CELL TOPOLOGY</span>
          <span style={{ color: '#475569', fontWeight: 600 }}>4S LiPo 5200 mAh (14.8V)</span>
        </div>
      </div>
    </div>
  );
}