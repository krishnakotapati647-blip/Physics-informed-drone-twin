import type { AutonomousDecision } from '../../types';
import { useDroneStore } from '../../store/droneStore';
import {
  Compass,
  AlertOctagon,
  CheckCircle2,
  RotateCcw,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

interface AutonomousDecisionPanelProps {
  decision: AutonomousDecision | null;
}

export function AutonomousDecisionPanel({ decision }: AutonomousDecisionPanelProps) {
  const emergencyState = useDroneStore((s) => s.emergencyState);
  const action = decision?.action ?? 'CONTINUE_MISSION';
  const reason = decision?.reason ?? 'Nominal flight conditions. Continuing mission execution.';
  const conditions = decision?.triggering_conditions ?? ['Nominal flight envelope'];
  const confidence = decision ? Math.round(decision.confidence * 100) : 99;
  const evidence = decision?.evidence_breakdown ?? [];

  const isCombinedFailure = Boolean(
    emergencyState?.emergencyActive &&
      (emergencyState.emergencyType === 'COMBINED_FAILURE' || emergencyState.emergencySeverity === 'CRITICAL')
  );

  const riskScore = decision?.risk_score ?? (isCombinedFailure ? 95 : 5);
  const riskLevel = decision?.risk_level ?? (isCombinedFailure ? 'CRITICAL' : 'NOMINAL');
  const timeToBreach = decision?.time_to_breach_s;
  const predictedThreat =
    decision?.predicted_threat ??
    (isCombinedFailure
      ? 'Multi-System Cascade: Motor 3 thrust fault combined with high crosswinds'
      : 'None (Nominal Flight Corridor)');
  const suggestions =
    decision?.resolution_suggestions && decision.resolution_suggestions.length > 0
      ? decision.resolution_suggestions
      : isCombinedFailure
      ? [
          '1. Mandatory Mission Override: Immediate mission abort commanded.',
          '2. Controlled Low-Rate Cruise: Limit speed to 3.2 m/s to reduce stator heating.',
          '3. Backup Safe Zone: Divert to nearest emergency recovery pad Bravo.',
        ]
      : [
          '1. Nominal Trajectory Tracking: Maintain steady waypoint cruise at 5.0–6.0 m/s.',
          '2. Continuous Predictive Scanning: 10s forward 6-DoF numerical simulation running at 20 Hz.',
          '3. Aerodynamic Energy Optimization: Fly optimal trim to maximize battery reserve.',
        ];
  const mitigationStrategy = decision?.mitigation_strategy;

  const isRTH = action === 'RETURN_TO_BASE' || action === 'ABORT_MISSION' || isCombinedFailure;
  const isSpeedReduction = action === 'REDUCE_SPEED';

  const actionBg = isRTH ? '#fee2e2' : isSpeedReduction ? '#fef3c7' : '#f0fdf4';
  const actionBorder = isRTH ? '#fca5a5' : isSpeedReduction ? '#fde68a' : '#bbf7d0';
  const actionColor = isRTH ? '#dc2626' : isSpeedReduction ? '#d97706' : '#16a34a';

  return (
    <div className="aero-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <Compass size={13} color="#0284c7" />
        <span>AUTONOMOUS DECISION ENGINE</span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
          CONFIDENCE: {confidence}%
        </span>
      </div>

      <div style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
        {/* Model Tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0284c7' }}>
            <Cpu size={11} />
            {decision?.model_source ?? '6-DoF Physics & Envelope Constraints'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 600 }}>
            <ShieldCheck size={11} />
            DETERMINISTIC & EXPLAINABLE
          </span>
        </div>

        {/* Critical Emergency / Combined Failure Hero */}
        {isCombinedFailure && (
          <div
            style={{
              background: '#fef2f2',
              border: '2px solid #ef4444',
              borderRadius: '5px',
              padding: '8px 10px',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#991b1b' }}>
                <AlertTriangle size={15} color="#dc2626" />
                <span>🔴 CRITICAL EMERGENCY: MULTI-SYSTEM CASCADE</span>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  background: '#dc2626',
                  color: '#ffffff',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  letterSpacing: '0.04em',
                }}
              >
                CRITICAL SEVERITY
              </span>
            </div>

            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#7f1d1d', marginBottom: '4px' }}>
              CONTRIBUTING CASCADE CONDITIONS:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '6px' }}>
              {(emergencyState?.contributingFactors && emergencyState.contributingFactors.length > 0
                ? emergencyState.contributingFactors
                : [
                    'Actuator fault: Motor 3 thrust output degraded by 35%',
                    'Crosswind gusts exceeding 10.0 m/s with 0.3 turbulence',
                    'Accelerated battery drain rate (2.0x normal cruise)',
                  ]
              ).map((factor, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '9.5px',
                    color: '#991b1b',
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    padding: '3px 6px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <span style={{ color: '#dc2626', fontWeight: 800 }}>•</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '9.5px', color: '#b91c1c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <RotateCcw size={12} color="#dc2626" />
              <span>OVERRIDE MANDATE: {emergencyState?.recommendedAction ?? 'IMMEDIATE RETURN TO BASE / EMERGENCY LANDING'}</span>
            </div>
          </div>
        )}

        {/* Action Hero Box */}
        <div
          style={{
            background: actionBg,
            border: `1px solid ${actionBorder}`,
            padding: '8px 12px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isRTH ? (
              <RotateCcw size={18} color="#dc2626" />
            ) : isSpeedReduction ? (
              <AlertOctagon size={18} color="#d97706" />
            ) : (
              <CheckCircle2 size={18} color="#16a34a" />
            )}
            <div>
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em' }}>COMMANDED ACTION</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: actionColor, letterSpacing: '0.04em' }}>
                {action.replace(/_/g, ' ')}
                {isSpeedReduction && decision?.recommended_speed_mps && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', marginLeft: '6px' }}>
                    ({decision.recommended_speed_mps} m/s)
                  </span>
                )}
              </div>
            </div>
          </div>

          {decision?.overrides_mission && (
            <span
              style={{
                fontSize: '9px',
                background: '#dc2626',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              MISSION OVERRIDE
            </span>
          )}
        </div>

        {/* Explainable Rationale */}
        <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.5', background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>WHY? </span>
          {reason}
        </div>

        {/* Predictive Risk & Actionable Resolvement Advisory */}
        <div
          style={{
            background: '#ffffff',
            border: `1.5px solid ${riskScore > 75 ? '#fca5a5' : riskScore > 40 ? '#fde68a' : '#e2e8f0'}`,
            borderRadius: '5px',
            padding: '8px 10px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 800, color: '#0f172a' }}>
              <TrendingUp size={13} color={riskScore > 75 ? '#dc2626' : riskScore > 40 ? '#d97706' : '#0284c7'} />
              <span>PREDICTIVE RISK ASSESSMENT</span>
            </div>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '3px',
                background:
                  riskLevel === 'CRITICAL' ? '#fee2e2' : riskLevel === 'ELEVATED' || riskLevel === 'MODERATE' ? '#fef3c7' : '#f0fdf4',
                color:
                  riskLevel === 'CRITICAL' ? '#dc2626' : riskLevel === 'ELEVATED' || riskLevel === 'MODERATE' ? '#d97706' : '#16a34a',
                border: `1px solid ${
                  riskLevel === 'CRITICAL' ? '#fca5a5' : riskLevel === 'ELEVATED' || riskLevel === 'MODERATE' ? '#fde68a' : '#bbf7d0'
                }`,
              }}
            >
              RISK INDEX: {riskScore}% [{riskLevel}]
            </span>
          </div>

          {/* Risk Score Progress Meter */}
          <div style={{ height: '5px', width: '100%', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
            <div
              style={{
                height: '100%',
                width: `${riskScore}%`,
                background: riskScore > 75 ? '#dc2626' : riskScore > 40 ? '#f59e0b' : '#16a34a',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          {/* Forecast Hazard & Time-to-Breach Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', background: '#f8fafc', padding: '5px 8px', borderRadius: '3px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#64748b' }}>PRIMARY PREDICTED THREAT</div>
              <div style={{ fontWeight: 700, color: riskScore > 50 ? '#dc2626' : '#0f172a' }}>
                {predictedThreat}
              </div>
            </div>
            <div style={{ fontSize: '10px', background: '#f8fafc', padding: '5px 8px', borderRadius: '3px', border: '1px solid #e2e8f0', textAlign: 'center', minWidth: '95px' }}>
              <div style={{ fontSize: '8px', fontWeight: 700, color: '#64748b' }}>TIME TO BREACH</div>
              <div style={{ fontWeight: 800, color: timeToBreach ? '#dc2626' : '#16a34a', fontFamily: 'monospace' }}>
                {timeToBreach ? `T + ${timeToBreach}s` : 'NOMINAL (SAFE)'}
              </div>
            </div>
          </div>

          {/* Actionable Engineering Resolvement Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: '#334155', letterSpacing: '0.04em' }}>
                  ACTIONABLE RESOLVEMENT RECOMMENDATIONS:
                </span>
                {mitigationStrategy && (
                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '1px 5px', borderRadius: '2px', border: '1px solid #bae6fd' }}>
                    {mitigationStrategy.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {suggestions.map((sug, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '9.5px',
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      padding: '4px 8px',
                      borderRadius: '3px',
                      lineHeight: 1.35,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={11} color="#0284c7" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{sug}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Structured Physical Evidence Breakdown */}
        {evidence.length > 0 && (
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '4px', letterSpacing: '0.05em' }}>
              PHYSICAL EVIDENCE BREAKDOWN:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {evidence.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '10px',
                    color: '#1e293b',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ color: '#0284c7', fontSize: '9px' }}>▸</span>
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Triggering Conditions Basis */}
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '4px', letterSpacing: '0.05em' }}>
            DECISION BASIS:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {conditions.map((c, i) => (
              <span
                key={i}
                style={{
                  fontSize: '9px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: 600,
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}