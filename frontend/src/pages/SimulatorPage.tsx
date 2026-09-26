import { useState, useEffect, useRef } from 'react';
import { useSimulation } from '../simulator/simulation/useSimulation';
import { DroneScene } from '../simulator/components/DroneScene';
import type { CameraMode } from '../simulator/components/DroneScene';
import type { Vec3, ScenarioType } from '../simulator/simulation/simulationTypes';
import type { TelemetryFrame } from '../types';
import { useDroneStore } from '../store/droneStore';
import { SystemStatusHeader } from '../components/common/SystemStatusHeader';
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Home,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function SimulatorPage() {
  const {
    state,
    start,
    pause,
    resume,
    reset,
    returnToBase,
    abort,
    setScenario,
  } = useSimulation();

  const [pathHistory, setPathHistory] = useState<Vec3[]>(() => {
    const hist = useDroneStore.getState().telemetryHistory;
    return hist.length > 0 ? hist.map((t: TelemetryFrame) => t.position) : [];
  });
  const [cameraMode, setCameraMode] = useState<CameraMode>('CHASE');
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [chartsOpen, setChartsOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [chartHistory, setChartHistory] = useState<
    { t: number; altitude: number; speed: number; battery: number; rpm: number }[]
  >([]);

  const lastRecordedPos = useRef<Vec3>({ x: 0, y: 0, z: 0 });

  // Clear feedback notice after 4 seconds
  useEffect(() => {
    if (!feedbackNotice) return;
    const t = setTimeout(() => setFeedbackNotice(null), 4000);
    return () => clearTimeout(t);
  }, [feedbackNotice]);

  // Track path history and rolling chart history
  useEffect(() => {
    const p = state.position;
    const lp = lastRecordedPos.current;
    const distSq = (p.x - lp.x) ** 2 + (p.y - lp.y) ** 2 + (p.z - lp.z) ** 2;

    if (distSq > 0.04 || pathHistory.length === 0) {
      lastRecordedPos.current = { ...p };
      setPathHistory((prev) => [...prev, { ...p }].slice(-600));
    }

    const horizSpd = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
    const avgRpm = Math.round(state.motors.reduce((a, m) => a + m.rpm, 0) / 4);

    setChartHistory((prev) => [
      ...prev.slice(-100),
      {
        t: Math.round(state.simulationTime),
        altitude: +state.position.z.toFixed(1),
        speed: +horizSpd.toFixed(1),
        battery: +state.battery.percentage.toFixed(1),
        rpm: avgRpm,
      },
    ]);

    if (state.phase === 'IDLE' && state.position.z === 0 && pathHistory.length > 5) {
      setPathHistory([]);
      setChartHistory([]);
    }
  }, [state.frameCount]);

  const handleStart = () => {
    start();
    setFeedbackNotice('MISSION STARTED: Quadcopter takeoff initiated.');
  };

  const handlePause = () => {
    pause();
    setFeedbackNotice('MISSION PAUSED: Hover hold active.');
  };

  const handleResume = () => {
    resume();
    setFeedbackNotice('MISSION RESUMED: Navigating along flight path.');
  };

  const handleReset = () => {
    reset();
    setPathHistory([]);
    setChartHistory([]);
    setFeedbackNotice('SIMULATION RESET: Unit returned to base pad.');
  };

  const handleRTH = () => {
    returnToBase();
    setFeedbackNotice('RETURN-TO-BASE INITIATED: Aborting current route and flying to Home pad.');
  };

  const handleAbort = () => {
    abort();
    setFeedbackNotice('EMERGENCY ABORT: Throttle cut, holding current position.');
  };

  const handleScenarioSelect = (sc: ScenarioType) => {
    setScenario(sc);
    setScenarioOpen(false);
    if (sc === 'HIGH_WIND') {
      setFeedbackNotice('SCENARIO APPLIED: High Wind active (12.0 m/s) — visible aerodynamic drift enabled.');
    } else if (sc === 'MOTOR_DEGRADATION') {
      setFeedbackNotice('SCENARIO APPLIED: Motor 3 degradation active (60% efficiency) — thrust asymmetry induced.');
    } else if (sc === 'LOW_BATTERY') {
      setFeedbackNotice('SCENARIO APPLIED: Low Battery active — 3x accelerated discharge rate.');
    } else if (sc === 'PAYLOAD_INCREASE') {
      setFeedbackNotice('SCENARIO APPLIED: Heavy Payload active (+400g load) — elevated thrust required.');
    } else if (sc === 'COMBINED') {
      setFeedbackNotice('SCENARIO APPLIED: Combined Disturbance active (Wind + Motor Fault + Battery).');
    } else {
      setFeedbackNotice('SCENARIO APPLIED: Normal Flight conditions restored.');
    }
  };

  const horizSpeed = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);
  const airSpeed = Math.max(0, horizSpeed + state.environment.windSpeed * 0.08);

  const scenarios: { type: ScenarioType; label: string; desc: string; severity: 'NORMAL' | 'WARNING' | 'CRITICAL' }[] = [
    { type: 'NORMAL', label: 'NORMAL FLIGHT', desc: 'Standard atmospheric conditions (2 m/s wind)', severity: 'NORMAL' },
    { type: 'HIGH_WIND', label: 'HIGH WIND', desc: '12 m/s crosswind + turbulence drift', severity: 'WARNING' },
    { type: 'MOTOR_DEGRADATION', label: 'MOTOR 3 FAULT', desc: 'Motor 3 efficiency drops to 60%', severity: 'CRITICAL' },
    { type: 'LOW_BATTERY', label: 'LOW BATTERY', desc: 'Accelerated battery discharge rate', severity: 'WARNING' },
    { type: 'PAYLOAD_INCREASE', label: 'HEAVY PAYLOAD', desc: '+400g extra payload increasing load', severity: 'NORMAL' },
    { type: 'COMBINED', label: 'COMBINED FAILURE', desc: 'High wind + Motor 3 fault + battery sag', severity: 'CRITICAL' },
  ];

  return (
    <div style={{ height: 'calc(100vh - 50px)', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Live Subsystem Status Bar & Hackathon Demo Controls */}
      <SystemStatusHeader onScenarioTrigger={handleScenarioSelect} />

      {/* Top Aerospace Sub-Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '6px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
              VIRTUAL FLIGHT LAB
            </span>
          </div>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#475569' }}>
            <span style={{ color: '#64748b' }}>MISSION:</span>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>ALPHA-SURVEY // 001</span>
          </div>

          <div style={{ width: '1px', height: '14px', background: '#cbd5e1' }} />

          <span
            className={`badge ${
              state.phase === 'COMPLETED'
                ? 'badge-green'
                : state.phase === 'ABORTED'
                ? 'badge-red'
                : state.running
                ? 'badge-blue'
                : 'badge-slate'
            }`}
          >
            {state.phase}
          </span>
        </div>

        {/* Center/Right: Camera UX Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>CAMERA:</span>
          {(['FREE', 'FOLLOW', 'CHASE', 'TOP'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              style={{
                background: cameraMode === mode ? '#0284c7' : '#ffffff',
                color: cameraMode === mode ? '#ffffff' : '#475569',
                border: `1px solid ${cameraMode === mode ? '#0284c7' : '#cbd5e1'}`,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Flight Canvas — The HERO of the Interface (occupies 72% screen) */}
      <div style={{ flex: '1 1 72%', position: 'relative', minHeight: 0, background: '#e0f2fe' }}>
        <DroneScene state={state} pathHistory={pathHistory} cameraMode={cameraMode} />

        {/* Floating Feedback Notice Banner */}
        {feedbackNotice && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#ffffff',
              border: '1px solid #bae6fd',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '8px 18px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 600,
              color: '#0369a1',
              zIndex: 30,
            }}
          >
            <CheckCircle2 size={16} color="#0284c7" />
            <span>{feedbackNotice}</span>
          </div>
        )}

        {/* Floating Telemetry HUD — Top Left */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            borderRadius: '6px',
            padding: '12px 16px',
            zIndex: 20,
            display: 'flex',
            gap: '18px',
          }}
        >
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>ALTITUDE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                {state.position.z.toFixed(1)}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>m</span>
            </div>
            <div style={{ fontSize: '10px', color: state.velocity.z >= 0 ? '#16a34a' : '#d97706', fontFamily: 'monospace' }}>
              {state.velocity.z >= 0 ? '+' : ''}{state.velocity.z.toFixed(1)} m/s
            </div>
          </div>

          <div style={{ width: '1px', background: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>SPEED</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: "'JetBrains Mono', monospace" }}>
                {horizSpeed.toFixed(1)}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>m/s</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
              AIR {airSpeed.toFixed(1)} m/s
            </div>
          </div>

          <div style={{ width: '1px', background: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>BATTERY</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: state.battery.percentage < 25 ? '#dc2626' : '#16a34a',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {state.battery.percentage.toFixed(0)}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>%</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
              {state.battery.voltage.toFixed(1)} V
            </div>
          </div>

          <div style={{ width: '1px', background: '#e2e8f0' }} />

          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em' }}>WIND</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: state.environment.windSpeed > 10 ? '#d97706' : '#0f172a',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {(state.environment.windSpeed * 3.6).toFixed(0)}
              </span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>km/h</span>
            </div>
            <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
              {state.environment.windDirection.toFixed(0)}° W
            </div>
          </div>
        </div>

        {/* Floating Scenario & Diagnostics Toggle — Bottom Right */}
        <div style={{ position: 'absolute', bottom: '16px', right: '16px', zIndex: 20, display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setChartsOpen(!chartsOpen)}
            style={{
              background: chartsOpen ? '#0284c7' : 'rgba(255, 255, 255, 0.92)',
              color: chartsOpen ? '#ffffff' : '#334155',
              border: `1px solid ${chartsOpen ? '#0284c7' : '#cbd5e1'}`,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={14} />
            <span>{chartsOpen ? 'HIDE CHARTS' : 'LIVE CHARTS'}</span>
          </button>

          <button
            onClick={() => setScenarioOpen(!scenarioOpen)}
            style={{
              background: state.scenario !== 'NORMAL' ? '#fef3c7' : 'rgba(255, 255, 255, 0.92)',
              color: state.scenario !== 'NORMAL' ? '#b45309' : '#334155',
              border: `1px solid ${state.scenario !== 'NORMAL' ? '#fde68a' : '#cbd5e1'}`,
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
              padding: '8px 14px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sliders size={14} />
            <span>SCENARIO: {state.scenario.replace(/_/g, ' ')}</span>
            {scenarioOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Scenario Drawer Popover */}
        {scenarioOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '56px',
              right: '16px',
              width: '320px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              borderRadius: '6px',
              padding: '14px',
              zIndex: 30,
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', letterSpacing: '0.04em' }}>
              SCENARIO & DISTURBANCE LAB
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {scenarios.map((sc) => {
                const isSelected = state.scenario === sc.type;
                return (
                  <button
                    key={sc.type}
                    onClick={() => handleScenarioSelect(sc.type)}
                    style={{
                      background: isSelected ? '#f0f9ff' : '#f8fafc',
                      border: `1px solid ${isSelected ? '#0284c7' : '#e2e8f0'}`,
                      borderRadius: '4px',
                      padding: '8px 10px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#0284c7' : '#1e293b' }}>
                        {sc.label}
                      </div>
                      <div style={{ fontSize: '9px', color: '#64748b' }}>{sc.desc}</div>
                    </div>
                    {isSelected && <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700 }}>ACTIVE</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Live Charts Drawer */}
      {chartsOpen && (
        <div
          style={{
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            padding: '10px 20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            height: '130px',
          }}
        >
          {[
            { key: 'altitude', label: 'ALTITUDE (m)', color: '#0284c7' },
            { key: 'speed', label: 'SPEED (m/s)', color: '#0d9488' },
            { key: 'battery', label: 'BATTERY (%)', color: '#16a34a' },
            { key: 'rpm', label: 'MOTOR RPM', color: '#4f46e5' },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '2px' }}>{label}</div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={chartHistory} margin={{ top: 2, right: 2, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="t" tick={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '10px', borderRadius: '4px' }}
                  />
                  <Area type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.1} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Contextual Mission Control Bar */}
      <div
        style={{
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
        }}
      >
        {/* Contextual Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(!state.running || state.phase === 'COMPLETED' || state.phase === 'ABORTED') ? (
            <button className="btn btn-primary" onClick={handleStart} style={{ padding: '8px 18px', fontSize: '12px' }}>
              <Play size={14} />
              <span>{state.phase === 'COMPLETED' ? 'REPLAY MISSION' : 'TAKE OFF & START MISSION'}</span>
            </button>
          ) : state.paused ? (
            <button className="btn btn-primary" onClick={handleResume} style={{ padding: '8px 18px', fontSize: '12px' }}>
              <Play size={14} />
              <span>RESUME FLIGHT</span>
            </button>
          ) : (
            <button className="btn btn-secondary" onClick={handlePause}>
              <Pause size={14} />
              <span>PAUSE</span>
            </button>
          )}

          {state.running && !state.paused && (
            <button
              className="btn btn-warning"
              onClick={handleRTH}
              disabled={state.phase === 'RETURNING' || state.phase === 'LANDING'}
            >
              <Home size={14} />
              <span>RETURN TO BASE</span>
            </button>
          )}

          {state.running && (
            <button className="btn btn-danger" onClick={handleAbort}>
              <AlertTriangle size={14} />
              <span>ABORT</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>
        </div>

        {/* Mission Progress Readout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <span>PROGRESS ({Math.round(state.missionProgress * 100)}%)</span>
              <span>WAYPOINT {state.currentWaypointIndex} / {state.waypoints.length - 1}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${state.missionProgress * 100}%` }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: '#475569' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>ELAPSED: </span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                {Math.floor(state.missionElapsed / 60)}:{(Math.floor(state.missionElapsed % 60)).toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>DIST TO NEXT: </span>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>
                {state.distanceToNext > 0 ? `${state.distanceToNext.toFixed(0)}m` : '0m'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}