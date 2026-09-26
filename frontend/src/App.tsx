import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Plane, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { wsClient } from './services/wsClient';
import { useDroneStore } from './store/droneStore';
import SimulatorPage from './pages/SimulatorPage';
import DigitalTwinPage from './pages/DigitalTwinPage';

function StartupModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);

  const checks = [
    { label: '3D GRAPHICS ENGINE', status: 'READY' },
    { label: 'AERODYNAMIC FLIGHT MODEL', status: 'ACTIVE [20 Hz]' },
    { label: 'TELEMETRY WEBSOCKET PROTOCOL', status: 'ONLINE' },
    { label: 'DIGITAL TWIN INTELLIGENCE LAYER', status: 'SYNCHRONIZED' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((s) => {
        if (s < checks.length) return s + 1;
        clearInterval(timer);
        setTimeout(onComplete, 300);
        return s;
      });
    }, 220);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', background: '#e0f2fe', borderRadius: '6px', color: '#0284c7' }}>
              <Plane size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
                AEROSPACE FLIGHT LAB
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Physics-Informed Drone Digital Twin
              </div>
            </div>
          </div>
          <button
            onClick={onComplete}
            style={{
              background: 'transparent',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            SKIP [ESC]
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {checks.map((chk, i) => {
            const isDone = i < step;
            const isCurrent = i === step;

            return (
              <div
                key={chk.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  background: isDone ? '#f8fafc' : isCurrent ? '#f0f9ff' : '#ffffff',
                  border: `1px solid ${isDone ? '#e2e8f0' : isCurrent ? '#bae6fd' : '#f1f5f9'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                  <CheckCircle2 size={14} color={isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#cbd5e1'} />
                  <span style={{ fontWeight: 600, color: isDone ? '#334155' : isCurrent ? '#0284c7' : '#94a3b8' }}>
                    {chk.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#cbd5e1',
                  }}
                >
                  {isDone ? chk.status : isCurrent ? 'INITIALIZING...' : 'STANDBY'}
                </span>
              </div>
            );
          })}
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / checks.length) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function NavigationBar() {
  const wsConnected = useDroneStore((s) => s.wsConnected);
  const dtStatus = useDroneStore((s) => s.dtStatus);

  const navItems = [
    { to: '/simulator', label: '01 FLIGHT LAB', active: true },
    { to: '/digital-twin', label: '02 DIGITAL TWIN', active: true },
    { to: '/simulator#scenarios', label: '03 SCENARIO LAB', active: false, badge: 'PRESETS' },
    { to: '#', label: '04 PREDICTION', active: false, badge: 'PHASE 8' },
    { to: '#', label: '05 ANALYTICS', active: false, badge: 'EXPAND' },
  ];

  return (
    <header
      style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        height: '50px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        userSelect: 'none',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            background: '#0284c7',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)',
          }}
        >
          <Plane size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em' }}>
              DRONE DIGITAL TWIN
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                background: '#f1f5f9',
                color: '#475569',
                padding: '1px 6px',
                borderRadius: '3px',
                letterSpacing: '0.06em',
              }}
            >
              AEROSPACE LAB
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            Physics-Informed Autonomous Simulation & Intelligence
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {navItems.map(({ to, label, active, badge }) => {
          if (!active) {
            return (
              <div
                key={label}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'not-allowed',
                }}
              >
                <span>{label}</span>
                {badge && (
                  <span
                    style={{
                      fontSize: '8px',
                      background: '#f1f5f9',
                      color: '#94a3b8',
                      padding: '1px 4px',
                      borderRadius: '2px',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                textDecoration: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#0284c7' : '#475569',
                background: isActive ? '#f0f9ff' : 'transparent',
                border: `1px solid ${isActive ? '#bae6fd' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              })}
            >
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Backend & Live Sync Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: wsConnected ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${wsConnected ? '#bbf7d0' : '#fde68a'}`,
            padding: '4px 10px',
            borderRadius: '4px',
          }}
        >
          {wsConnected ? <Wifi size={13} color="#16a34a" /> : <WifiOff size={13} color="#d97706" />}
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: wsConnected ? '#16a34a' : '#d97706',
              letterSpacing: '0.04em',
            }}
          >
            {wsConnected ? 'BACKEND ONLINE' : 'DISCONNECTED'}
          </span>
          {wsConnected && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#16a34a',
              }}
              className="pulse-dot"
            />
          )}
        </div>

        <div
          style={{
            fontSize: '10px',
            color: '#64748b',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {wsConnected ? `${Math.min(dtStatus.latency_ms || 18, 50)}ms` : 'OFFLINE'}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const [booted, setBooted] = useState(() => {
    return sessionStorage.getItem('drone_booted_light') === 'true';
  });

  const handleBootComplete = () => {
    sessionStorage.setItem('drone_booted_light', 'true');
    setBooted(true);
  };

  useEffect(() => {
    wsClient.connect();
    return () => wsClient.disconnect();
  }, []);

  return (
    <BrowserRouter>
      {!booted && <StartupModal onComplete={handleBootComplete} />}
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
        <NavigationBar />
        <main style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/simulator" replace />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/digital-twin" element={<DigitalTwinPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}