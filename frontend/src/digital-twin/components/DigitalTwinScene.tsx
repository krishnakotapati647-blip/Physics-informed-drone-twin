import { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, GizmoHelper, GizmoViewport, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useDroneStore } from '../../store/droneStore';
import { DroneModel } from '../../simulator/components/DroneModel';
import { WindParticles } from '../../simulator/components/WindParticles';
import { RainParticles } from '../../simulator/components/RainParticles';
import type { TelemetryFrame, Vec3, Waypoint } from '../../types';

interface DigitalTwinSceneProps {
  telemetry: TelemetryFrame | null;
  flownPath: Vec3[];
}

export type TwinCameraMode = 'CHASE' | 'FOLLOW' | 'TOP' | 'FREE';

function simToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

function TwinCameraController({
  pos,
  attitude,
  mode,
  orbitControlsRef,
}: {
  pos: { x: number; y: number; z: number };
  attitude: { roll: number; pitch: number; yaw: number } | null | undefined;
  mode: TwinCameraMode;
  orbitControlsRef: React.MutableRefObject<any>;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());

  useFrame(() => {
    const [tx, ty, tz] = simToThree(pos.x, pos.y, pos.z);

    if (mode === 'FREE') {
      if (orbitControlsRef.current) {
        // Gently guide the orbit target toward the drone so the user orbits around it
        orbitControlsRef.current.target.lerp(new THREE.Vector3(tx, ty + 0.3, tz), 0.05);
      }
      return;
    }

    targetRef.current.lerp(new THREE.Vector3(tx, ty + 0.3, tz), 0.08);

    if (mode === 'CHASE') {
      // Dynamic chase camera aligned with drone heading (7.5m behind, 3.2m above)
      const yaw = attitude?.yaw ?? 45;
      const yawRad = (-yaw * Math.PI) / 180;
      const chaseDist = 7.5;
      const targetCamX = tx - Math.sin(yawRad) * chaseDist;
      const targetCamZ = tz - Math.cos(yawRad) * chaseDist;
      const targetCamY = ty + 3.2;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.06);
      camera.lookAt(new THREE.Vector3(tx, ty + 0.7, tz));
    } else if (mode === 'FOLLOW') {
      // Smooth 3rd-person isometric tracking
      camera.position.lerp(new THREE.Vector3(tx - 11, ty + 6.5, tz - 11), 0.05);
      camera.lookAt(targetRef.current);
    } else if (mode === 'TOP') {
      // Overhead top-down tactical view
      camera.position.lerp(new THREE.Vector3(tx, ty + 38, tz + 0.1), 0.06);
      camera.lookAt(targetRef.current);
    }
  });

  return null;
}

function TwinSceneContent({
  telemetry,
  flownPath,
  cameraMode,
  orbitControlsRef,
}: {
  telemetry: TelemetryFrame | null;
  flownPath: Vec3[];
  cameraMode: TwinCameraMode;
  orbitControlsRef: React.MutableRefObject<any>;
}) {
  const pos = telemetry?.position ?? { x: 0, y: 0, z: 0 };
  const vel = telemetry?.velocity;
  const speed = vel ? Math.sqrt(vel.vx ** 2 + vel.vy ** 2 + vel.vz ** 2) : 0;
  const threePos = simToThree(pos.x, pos.y, pos.z);
  const prediction = useDroneStore((s) => s.prediction);
  const emergencyState = useDroneStore((s) => s.emergencyState);

  // Synchronized Flown Path (Solid aerospace blue line)
  const pathPoints = useMemo(() => {
    if (flownPath.length < 2) return null;
    return flownPath.map((p) => [p.x, p.z, -p.y] as [number, number, number]);
  }, [flownPath]);

  // Predicted Future Trajectory Line (Dashed High-Visibility Amber)
  const predictedPathPoints = useMemo(() => {
    if (!prediction?.trajectory || prediction.trajectory.length < 2) return null;
    return [
      simToThree(pos.x, pos.y, pos.z),
      ...prediction.trajectory.map((p) => simToThree(p.x, p.y, p.z)),
    ];
  }, [prediction?.trajectory, pos.x, pos.y, pos.z]);

  // Waypoints from telemetry mission state
  const waypoints = telemetry?.mission_state?.waypoints ?? [];
  const plannedPathPoints = useMemo(() => {
    if (waypoints.length < 2) return null;
    const pts: [number, number, number][] = waypoints.map((w: Waypoint) => [
      w.position.x,
      w.position.z,
      -w.position.y,
    ]);
    return pts;
  }, [waypoints]);

  const env = telemetry?.environment;
  const visibility = env?.visibility ?? 1.0;
  const isStorm = Boolean(env?.rain) || (env?.wind_speed ?? 0) > 16;
  const isFog = visibility < 0.35;

  const skyColor = isStorm ? '#94a3b8' : isFog ? '#cbd5e1' : '#f8fafc';
  const fogNear = isFog ? 8 : isStorm ? 20 : 130;
  const fogFar = isFog ? 48 : isStorm ? 110 : 360;
  const ambIntensity = isStorm ? 0.45 : isFog ? 0.75 : 0.7;
  const sunIntensity = isStorm ? 0.55 : isFog ? 0.75 : 1.1;

  const isEmerg = Boolean(emergencyState?.emergencyActive);
  const isCritical = emergencyState?.emergencySeverity === 'CRITICAL';

  return (
    <>
      <ambientLight intensity={ambIntensity} color="#ffffff" />
      <directionalLight position={[50, 90, 50]} intensity={sunIntensity} color={isStorm ? '#94a3b8' : '#ffffff'} />
      <directionalLight position={[-40, 40, -40]} intensity={0.3} color="#bae6fd" />

      {/* Clean Dynamic Scientific Background & Fog */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogNear, fogFar]} />

      {/* Scientific Engineering Grid */}
      <Grid
        args={[300, 300]}
        cellSize={5}
        cellThickness={0.4}
        cellColor="#e2e8f0"
        sectionSize={25}
        sectionThickness={0.9}
        sectionColor="#cbd5e1"
        fadeDistance={200}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Light Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>

      {/* Base Helipad Marker */}
      <group position={[0, 0.02, 0]}>
        <mesh>
          <cylinderGeometry args={[4, 4, 0.03, 32]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.6, 3.8, 36]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
      </group>

      {/* Altitude Rings */}
      {[10, 20, 30, 40, 50].map((alt) => (
        <mesh key={alt} position={[0, alt, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[alt * 0.75, alt * 0.75 + 0.1, 48]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Flown Actual Trajectory Line — Crisp Aerospace Blue */}
      {pathPoints && pathPoints.length >= 2 && (
        <Line
          points={pathPoints}
          color="#0284c7"
          lineWidth={1.8}
          transparent
          opacity={0.9}
        />
      )}

      {/* Planned Waypoint Route (Dashed Slate) */}
      {plannedPathPoints && plannedPathPoints.length >= 2 && (
        <Line
          points={plannedPathPoints}
          color="#94a3b8"
          lineWidth={1.4}
          transparent
          opacity={0.5}
          dashed
          dashSize={2}
          gapSize={1.5}
        />
      )}

      {/* Predicted 10s Forward Path (Dashed High-Visibility Amber) */}
      {predictedPathPoints && predictedPathPoints.length >= 2 && (
        <Line
          points={predictedPathPoints}
          color="#f59e0b"
          lineWidth={2.2}
          dashed
          dashSize={1.8}
          gapSize={0.8}
        />
      )}

      {/* Waypoint Markers */}
      {waypoints.map((wp: Waypoint) => {
        if (wp.name === 'HOME' && wp.id === 0) return null;
        const [wx, wy, wz] = simToThree(wp.position.x, wp.position.y, wp.position.z);
        return (
          <group key={wp.id} position={[wx, wy, wz]}>
            <mesh>
              <sphereGeometry args={[0.3, 12, 12]} />
              <meshStandardMaterial color="#0284c7" transparent opacity={0.3} wireframe />
            </mesh>
            <Billboard position={[0, 1.4, 0]}>
              <Text fontSize={0.9} color="#0f172a" anchorX="center" anchorY="middle">
                {wp.name}
              </Text>
            </Billboard>
          </group>
        );
      })}

      {/* Wind Particles Streamlines */}
      <WindParticles environment={env} count={isStorm ? 130 : 80} />

      {/* Precipitation Rain Particles */}
      <RainParticles
        active={isStorm}
        windVx={env?.wind_vx ?? 0}
        windVy={env?.wind_vy ?? 0}
        count={800}
      />

      {/* The 3D Digital Twin Quadcopter — EXACT SAME 3D Asset */}
      <group position={threePos}>
        <DroneModel
          attitude={telemetry?.attitude ?? null}
          motors={telemetry?.motors ?? null}
        />

        {/* Dedicated Local Light on Twin Drone so it is crystal clear */}
        <pointLight position={[0, 2.5, 0]} intensity={0.6} distance={15} color="#ffffff" />

        {/* 3D Coordinated Floating HUD Reticle Above Twin Drone */}
        <Billboard position={[0, 1.25, 0]}>
          <group>
            {/* Top designation pill */}
            <Text
              fontSize={0.34}
              color={isCritical ? '#dc2626' : isEmerg ? '#d97706' : '#0284c7'}
              anchorX="center"
              anchorY="bottom"
              outlineWidth={0.02}
              outlineColor="#ffffff"
            >
              {`⬡ DIGITAL TWIN (DRONE-001) ⬡`}
            </Text>
            {/* Live coordinated telemetry sub-label */}
            <Text
              position={[0, -0.06, 0]}
              fontSize={0.24}
              color="#0f172a"
              anchorX="center"
              anchorY="top"
              outlineWidth={0.018}
              outlineColor="#ffffff"
            >
              {`ALT: ${pos.z.toFixed(1)}m  |  SPD: ${speed.toFixed(1)} m/s`}
            </Text>
          </group>
        </Billboard>

        {emergencyState?.emergencyActive && (
          <group>
            {/* Warning beacon ring around quadcopter */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <ringGeometry args={[0.9, 1.05, 32]} />
              <meshBasicMaterial
                color={isCritical ? '#dc2626' : '#f59e0b'}
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
              <ringGeometry args={[1.25, 1.35, 32]} />
              <meshBasicMaterial
                color={isCritical ? '#ef4444' : '#fbbf24'}
                transparent
                opacity={0.45}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        )}
      </group>

      {/* Altitude Tether Laser & Ground Shadow */}
      {pos.z > 0.3 && (
        <>
          <mesh position={[pos.x, pos.z / 2, -pos.y]}>
            <cylinderGeometry args={[0.02, 0.02, pos.z, 8]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.35} />
          </mesh>
          <mesh position={[pos.x, 0.02, -pos.y]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.5, 32]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.5} />
          </mesh>
          <mesh position={[pos.x, 0.01, -pos.y]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[Math.max(0.6, 2.4 - pos.z * 0.035), 32]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.35} />
          </mesh>
        </>
      )}

      <TwinCameraController
        pos={pos}
        attitude={telemetry?.attitude}
        mode={cameraMode}
        orbitControlsRef={orbitControlsRef}
      />
    </>
  );
}

export function DigitalTwinScene({ telemetry, flownPath }: DigitalTwinSceneProps) {
  const [cameraMode, setCameraMode] = useState<TwinCameraMode>('CHASE');
  const orbitControlsRef = useRef<any>(null);
  const prediction = useDroneStore((s) => s.prediction);
  const emergencyState = useDroneStore((s) => s.emergencyState);
  const lastDecision = useDroneStore((s) => s.lastDecision);

  const isEmerg = Boolean(emergencyState?.emergencyActive);
  const isCritical = emergencyState?.emergencySeverity === 'CRITICAL';

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '6px',
        overflow: 'hidden',
        border: isEmerg ? `2px solid ${isCritical ? '#dc2626' : '#f59e0b'}` : '1px solid transparent',
        boxShadow: isEmerg
          ? `inset 0 0 24px ${isCritical ? 'rgba(220, 38, 38, 0.22)' : 'rgba(245, 158, 11, 0.18)'}`
          : 'none',
        transition: 'border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Floating HUD In-Scene Emergency State Banner */}
      {isEmerg && emergencyState && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: isCritical ? 'rgba(254, 242, 242, 0.96)' : 'rgba(255, 251, 235, 0.96)',
            backdropFilter: 'blur(6px)',
            border: `1.5px solid ${isCritical ? '#f87171' : '#fde68a'}`,
            boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
            padding: '5px 14px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '11px',
            pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isCritical ? '#dc2626' : '#d97706',
              }}
              className="pulse-dot"
            />
            <span
              style={{
                fontWeight: 800,
                color: isCritical ? '#991b1b' : '#92400e',
                letterSpacing: '0.04em',
              }}
            >
              🔴 EMERGENCY ACTIVE: {emergencyState.emergencyType.replace(/_/g, ' ')}
            </span>
          </div>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ fontSize: '10px', color: '#475569', fontWeight: 500 }}>
            {emergencyState.emergencyReason}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              background: isCritical ? '#fee2e2' : '#fef3c7',
              color: isCritical ? '#b91c1c' : '#b45309',
              padding: '2px 7px',
              borderRadius: '3px',
              border: `1px solid ${isCritical ? '#fca5a5' : '#fde68a'}`,
              letterSpacing: '0.03em',
            }}
          >
            ACTION: {emergencyState.recommendedAction}
          </span>
        </div>
      )}

      <Canvas
        camera={{ position: [-9, 5.5, -9], fov: 50, near: 0.1, far: 500 }}
        style={{ background: '#f8fafc' }}
      >
        <TwinSceneContent
          telemetry={telemetry}
          flownPath={flownPath}
          cameraMode={cameraMode}
          orbitControlsRef={orbitControlsRef}
        />
        <OrbitControls
          ref={orbitControlsRef}
          enabled={cameraMode === 'FREE'}
          enableDamping
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={180}
          maxPolarAngle={Math.PI / 2.05}
        />
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport axisColors={['#ef4444', '#16a34a', '#0284c7']} labelColor="#0f172a" />
        </GizmoHelper>
      </Canvas>

      {/* Camera Mode Selector Bar */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          zIndex: 15,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(6px)',
          padding: '4px 6px',
          borderRadius: '6px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
        }}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color: '#64748b',
            padding: '0 5px',
            letterSpacing: '0.05em',
          }}
        >
          CAM:
        </span>
        {(['CHASE', 'FOLLOW', 'TOP', 'FREE'] as TwinCameraMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setCameraMode(mode)}
            style={{
              background: cameraMode === mode ? '#0284c7' : '#ffffff',
              color: cameraMode === mode ? '#ffffff' : '#475569',
              border: `1px solid ${cameraMode === mode ? '#0284c7' : '#e2e8f0'}`,
              padding: '4px 9px',
              fontSize: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: '4px',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {cameraMode === mode && (
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  background: '#ffffff',
                }}
              />
            )}
            {mode}
          </button>
        ))}
      </div>

      {/* In-Scene Trajectory Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(4px)',
          border: '1px solid #e2e8f0',
          padding: '6px 12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '3px', background: '#0284c7', borderRadius: '1px' }} />
          <span style={{ fontWeight: 600, color: '#0f172a' }}>ACTUAL TRAJECTORY</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', background: '#94a3b8', borderTop: '1px dashed #94a3b8' }} />
          <span style={{ color: '#64748b' }}>PLANNED ROUTE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '12px', height: '2px', background: '#f59e0b', borderTop: '2px dashed #f59e0b' }} />
          <span style={{ fontWeight: 700, color: '#d97706' }}>PREDICTED (10s HORIZON)</span>
        </div>
        {prediction?.predicted_drift_magnitude_m !== undefined && (
          <div style={{ fontSize: '10px', color: prediction.predicted_drift_magnitude_m > 3.5 ? '#dc2626' : '#64748b', fontWeight: 600 }}>
            DRIFT: {prediction.predicted_drift_magnitude_m.toFixed(1)}m
          </div>
        )}
        {lastDecision?.risk_level && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color:
                lastDecision.risk_level === 'CRITICAL'
                  ? '#dc2626'
                  : lastDecision.risk_level === 'ELEVATED' || lastDecision.risk_level === 'MODERATE'
                  ? '#d97706'
                  : '#16a34a',
            }}
          >
            RISK: {lastDecision.risk_level} ({lastDecision.risk_score}%)
          </div>
        )}
        {lastDecision?.time_to_breach_s && (
          <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 800, fontFamily: 'monospace' }}>
            T-BREACH: {lastDecision.time_to_breach_s}s
          </div>
        )}
      </div>
    </div>
  );
}