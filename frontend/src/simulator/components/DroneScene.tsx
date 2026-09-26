import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, GizmoHelper, GizmoViewport, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { DroneModel } from './DroneModel';
import { WindParticles } from './WindParticles';
import { RainParticles } from './RainParticles';
import type { SimulationState, Vec3, Waypoint } from '../simulation/simulationTypes';
import { useDroneStore } from '../../store/droneStore';

export type CameraMode = 'FREE' | 'FOLLOW' | 'CHASE' | 'TOP';

function simToThree(p: Vec3): [number, number, number] {
  return [p.x, p.z, -p.y];
}

function SmoothCameraController({
  state,
  mode,
}: {
  state: SimulationState;
  mode: CameraMode;
}) {
  const { camera } = useThree();
  const targetRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (mode === 'FREE') return;

    const [tx, ty, tz] = simToThree(state.position);
    targetRef.current.lerp(new THREE.Vector3(tx, ty, tz), 0.08);

    if (mode === 'FOLLOW') {
      camera.position.lerp(new THREE.Vector3(tx - 15, ty + 9, tz - 15), 0.045);
      camera.lookAt(targetRef.current);
    } else if (mode === 'CHASE') {
      const yawRad = (-state.yaw * Math.PI) / 180;
      const chaseDist = 8.5;
      const targetCamX = tx - Math.sin(yawRad) * chaseDist;
      const targetCamZ = tz - Math.cos(yawRad) * chaseDist;
      const targetCamY = ty + 3.8;
      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.05);
      camera.lookAt(new THREE.Vector3(tx, ty + 1.0, tz));
    } else if (mode === 'TOP') {
      camera.position.lerp(new THREE.Vector3(tx, ty + 50, tz + 0.1), 0.05);
      camera.lookAt(targetRef.current);
    }
  });

  return null;
}

function HomeHelipad() {
  return (
    <group position={[0, 0.02, 0]}>
      {/* Concrete Pad */}
      <mesh receiveShadow>
        <cylinderGeometry args={[5, 5, 0.04, 32]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>
      {/* Outer Blue Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.4, 4.7, 36]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      {/* Inner Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 2.7, 32]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      {/* "H" Marking */}
      <mesh position={[-0.8, 0.04, 0]}>
        <boxGeometry args={[0.3, 0.02, 2.4]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0.8, 0.04, 0]}>
        <boxGeometry args={[0.3, 0.02, 2.4]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[0.3, 0.02, 1.6]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
    </group>
  );
}

function FlightTrajectoryAndWaypoints({
  waypoints,
  currentPos,
  pathHistory,
}: {
  waypoints: Waypoint[];
  currentPos: Vec3;
  pathHistory: Vec3[];
}) {
  const prediction = useDroneStore((s) => s.prediction);

  const historyPoints = pathHistory.length >= 2
    ? pathHistory.map((p) => [p.x, p.z, -p.y] as [number, number, number])
    : null;

  const upcoming = waypoints.filter((w) => w.status !== 'COMPLETED');
  const plannedPoints: [number, number, number][] | null = upcoming.length > 0
    ? [
        [currentPos.x, currentPos.z, -currentPos.y],
        ...upcoming.map((w) => [w.position.x, w.position.z, -w.position.y] as [number, number, number]),
      ]
    : null;

  const predictedPathPoints = useMemo(() => {
    if (!prediction?.trajectory || prediction.trajectory.length < 2) return null;
    return [
      simToThree(currentPos),
      ...prediction.trajectory.map((p) => simToThree({ x: p.x, y: p.y, z: p.z })),
    ];
  }, [prediction?.trajectory, currentPos.x, currentPos.y, currentPos.z]);

  return (
    <>
      {/* Completed Flown Trajectory — Crisp Aerospace Blue */}
      {historyPoints && (
        <Line
          points={historyPoints}
          color="#0284c7"
          lineWidth={2.5}
          transparent
          opacity={0.9}
        />
      )}

      {/* Planned Upcoming Route — Subtle dashed line */}
      {plannedPoints && plannedPoints.length >= 2 && (
        <Line
          points={plannedPoints}
          color="#94a3b8"
          lineWidth={1.5}
          transparent
          opacity={0.6}
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
          lineWidth={2.4}
          dashed
          dashSize={1.8}
          gapSize={0.8}
        />
      )}

      {/* Waypoint Markers */}
      {waypoints.map((wp) => {
        if (wp.name === 'HOME' && wp.id === 0) return null;
        const [wx, wy, wz] = simToThree(wp.position);
        const isCurrent = wp.status === 'CURRENT';
        const isDone = wp.status === 'COMPLETED';

        const color = isDone ? '#16a34a' : isCurrent ? '#0284c7' : '#64748b';

        return (
          <group key={wp.id} position={[wx, wy, wz]}>
            {/* Altitude pole down to ground */}
            <mesh position={[0, -wy / 2, 0]}>
              <cylinderGeometry args={[0.03, 0.03, wy, 6]} />
              <meshBasicMaterial color={color} transparent opacity={0.35} />
            </mesh>

            {/* Waypoint ring */}
            <mesh>
              <torusGeometry args={[0.9, 0.06, 8, 24]} />
              <meshBasicMaterial color={color} />
            </mesh>

            <Billboard position={[0, 1.8, 0]}>
              <Text fontSize={1.1} color={color} anchorX="center" anchorY="middle">
                {wp.name}
              </Text>
              <Text fontSize={0.7} color="#64748b" anchorX="center" anchorY="middle" position={[0, -0.9, 0]}>
                {`ALT ${wp.position.z}m`}
              </Text>
            </Billboard>
          </group>
        );
      })}
    </>
  );
}

function SceneContent({
  state,
  pathHistory,
  cameraMode,
}: {
  state: SimulationState;
  pathHistory: Vec3[];
  cameraMode: CameraMode;
}) {
  const droneThreePos = simToThree(state.position);

  const visibility = state.environment.visibility ?? 1.0;
  const isStorm = state.scenario === 'STORM' || Boolean(state.environment.rain);
  const isFog = state.scenario === 'FOG' || visibility < 0.35;

  const skyColor = isStorm ? '#94a3b8' : isFog ? '#cbd5e1' : '#e0f2fe';
  const fogNear = isFog ? 8 : isStorm ? 20 : 130;
  const fogFar = isFog ? 48 : isStorm ? 110 : 380;
  const ambIntensity = isStorm ? 0.45 : isFog ? 0.7 : 0.65;
  const sunIntensity = isStorm ? 0.55 : isFog ? 0.75 : 1.2;

  return (
    <>
      {/* Sunlight & Sky Lighting */}
      <ambientLight intensity={ambIntensity} color="#ffffff" />
      <directionalLight
        position={[60, 100, 50]}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={250}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        color={isStorm ? '#94a3b8' : '#ffffff'}
      />
      <directionalLight position={[-40, 50, -40]} intensity={0.3} color="#bae6fd" />

      {/* Dynamic sky atmosphere & fog */}
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, fogNear, fogFar]} />

      {/* Clean Light Engineering Grid */}
      <Grid
        args={[300, 300]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#cbd5e1"
        sectionSize={25}
        sectionThickness={1.0}
        sectionColor="#94a3b8"
        fadeDistance={220}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Light Soft Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Helipad Base */}
      <HomeHelipad />

      {/* Altitude Reference Rings */}
      {[10, 20, 30, 40, 50].map((alt) => (
        <mesh key={alt} position={[0, alt, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[alt * 0.8, alt * 0.8 + 0.12, 48]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Trajectory and Waypoints */}
      <FlightTrajectoryAndWaypoints
        waypoints={state.waypoints}
        currentPos={state.position}
        pathHistory={pathHistory}
      />

      {/* Wind Particles Streamlines */}
      <WindParticles environment={state.environment} count={isStorm ? 140 : 90} />

      {/* Precipitation Rain Particles */}
      <RainParticles
        active={isStorm}
        windVx={state.environment.windVx}
        windVy={state.environment.windVy}
        count={850}
      />

      {/* 3D Quadcopter */}
      <group position={droneThreePos}>
        <DroneModel state={state} />
      </group>

      {/* Altitude line and ground shadow */}
      {state.position.z > 0.4 && (
        <>
          <mesh position={[state.position.x, state.position.z / 2, -state.position.y]}>
            <cylinderGeometry args={[0.03, 0.03, state.position.z, 4]} />
            <meshBasicMaterial color="#0284c7" transparent opacity={0.35} />
          </mesh>
          <mesh
            position={[state.position.x, 0.02, -state.position.y]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[Math.max(0.6, 2.5 - state.position.z * 0.04), 24]} />
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {/* Camera Mode Controller */}
      <SmoothCameraController state={state} mode={cameraMode} />
    </>
  );
}

interface DroneSceneProps {
  state: SimulationState;
  pathHistory: Vec3[];
  cameraMode: CameraMode;
}

export function DroneScene({ state, pathHistory, cameraMode }: DroneSceneProps) {
  const prediction = useDroneStore((s) => s.prediction);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas
        camera={{ position: [-26, 18, -26], fov: 52, near: 0.1, far: 500 }}
        shadows
        style={{ background: '#e0f2fe' }}
      >
        <SceneContent state={state} pathHistory={pathHistory} cameraMode={cameraMode} />
        {cameraMode === 'FREE' && (
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={4}
            maxDistance={220}
            maxPolarAngle={Math.PI / 2.05}
          />
        )}
        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport axisColors={['#ef4444', '#16a34a', '#0284c7']} labelColor="#0f172a" />
        </GizmoHelper>
      </Canvas>

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
          pointerEvents: 'none',
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
      </div>
    </div>
  );
}