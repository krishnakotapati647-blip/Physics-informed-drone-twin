import type { ScenarioType, SimulationState } from '../simulation/simulationTypes';

interface ScenarioDef {
  type: ScenarioType;
  label: string;
  badge: string;
  badgeClass: string;
  desc: string;
}

const ENV_SCENARIOS: ScenarioDef[] = [
  {
    type: 'NORMAL',
    label: 'NORMAL FLIGHT',
    badge: 'NOMINAL',
    badgeClass: 'badge-green',
    desc: '2 m/s calm wind, clear sky, 100% visibility',
  },
  {
    type: 'HIGH_WIND',
    label: 'HIGH WIND',
    badge: 'WIND 14 m/s',
    badgeClass: 'badge-amber',
    desc: 'Strong gusts, visible streamlines & physical drift',
  },
  {
    type: 'STORM',
    label: 'STORM / PRECIPITATION',
    badge: 'SEVERE',
    badgeClass: 'badge-red',
    desc: '18 m/s gale, rain particles, overcast sky, RTH trigger',
  },
  {
    type: 'FOG',
    label: 'LOW VISIBILITY / FOG',
    badge: 'VIS 20%',
    badgeClass: 'badge-amber',
    desc: 'Heavy atmospheric fog & optical speed caution',
  },
];

const FAULT_SCENARIOS: ScenarioDef[] = [
  {
    type: 'MOTOR_DEGRADATION',
    label: 'MOTOR FAULT',
    badge: 'THRUST -40%',
    badgeClass: 'badge-red',
    desc: 'Motor 3 efficiency drops to 60%',
  },
  {
    type: 'LOW_BATTERY',
    label: 'LOW BATTERY',
    badge: '3.2x DRAIN',
    badgeClass: 'badge-amber',
    desc: 'Accelerated battery discharge rate',
  },
  {
    type: 'PAYLOAD_INCREASE',
    label: 'PAYLOAD +400g',
    badge: '+400g',
    badgeClass: 'badge-cyan',
    desc: 'Increased takeoff mass & rotor RPM load',
  },
  {
    type: 'COMBINED',
    label: 'COMBINED HAZARD',
    badge: 'MULTI-STRESS',
    badgeClass: 'badge-red',
    desc: 'High wind + motor fault + rapid drain',
  },
];

interface ScenarioPanelProps {
  state: SimulationState;
  onSetScenario: (s: ScenarioType) => void;
}

export function ScenarioPanel({ state, onSetScenario }: ScenarioPanelProps) {
  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="dot" style={{ background: 'var(--violet)' }} />
        FLIGHT SCENARIOS
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
        {/* Environmental Scenarios Section */}
        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '4px', paddingLeft: '4px' }}>
          DYNAMIC ATMOSPHERE
        </div>
        {ENV_SCENARIOS.map((sc) => {
          const isSelected = state.scenario === sc.type;
          return (
            <button
              key={sc.type}
              className={`scenario-opt${isSelected ? ' selected' : ''}`}
              onClick={() => onSetScenario(sc.type)}
              style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '11px', color: isSelected ? 'var(--blue)' : 'var(--text-primary)' }}>
                  {sc.label}
                </span>
                <span className={`badge ${sc.badgeClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                  {sc.badge}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {sc.desc}
              </div>
            </button>
          );
        })}

        {/* Hardware & Fault Scenarios Section */}
        <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: '10px', marginBottom: '4px', paddingLeft: '4px' }}>
          SYSTEM & HARDWARE FAULTS
        </div>
        {FAULT_SCENARIOS.map((sc) => {
          const isSelected = state.scenario === sc.type;
          return (
            <button
              key={sc.type}
              className={`scenario-opt${isSelected ? ' selected' : ''}`}
              onClick={() => onSetScenario(sc.type)}
              style={{ width: '100%', textAlign: 'left', marginBottom: '4px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, fontSize: '11px', color: isSelected ? 'var(--blue)' : 'var(--text-primary)' }}>
                  {sc.label}
                </span>
                <span className={`badge ${sc.badgeClass}`} style={{ fontSize: '8px', padding: '1px 5px' }}>
                  {sc.badge}
                </span>
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                {sc.desc}
              </div>
            </button>
          );
        })}

        <div style={{ marginTop: '8px', padding: '6px 8px', background: 'rgba(2,132,199,0.05)', border: '1px solid rgba(2,132,199,0.15)', borderRadius: '4px', fontSize: '9px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          Live scenario switching actively alters physics drag, attitude tilt, particle systems, and envelope boundaries in real time.
        </div>
      </div>
    </div>
  );
}