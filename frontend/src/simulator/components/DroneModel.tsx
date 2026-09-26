import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface DroneStateProps {
  roll: number;
  pitch: number;
  yaw: number;
  motors?: Array<{ id?: number; rpm?: number; efficiency?: number }>;
}

export interface DroneModelProps {
  state?: DroneStateProps | null;
  attitude?: { roll: number; pitch: number; yaw: number } | null;
  motors?: Array<{ id?: number; rpm?: number; efficiency?: number }> | null;
  isGhost?: boolean;
}

const ARM_POSITIONS = [
  { x: 0.35, z: 0.35, rotY: Math.PI / 4 },
  { x: -0.35, z: 0.35, rotY: -Math.PI / 4 },
  { x: 0.35, z: -0.35, rotY: -Math.PI / 4 },
  { x: -0.35, z: -0.35, rotY: Math.PI / 4 },
];

export function DroneModel({ state, attitude, motors, isGhost = false }: DroneModelProps) {
  const propRefs = useRef<(THREE.Mesh | null)[]>([null, null, null, null]);
  const groupRef = useRef<THREE.Group>(null);

  const roll = state?.roll ?? attitude?.roll ?? 0;
  const pitch = state?.pitch ?? attitude?.pitch ?? 0;
  const yaw = state?.yaw ?? attitude?.yaw ?? 0;
  const motorList = state?.motors ?? motors ?? [];

  // Rotor rotation and attitude orientation with aerospace YXZ Euler order
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.set(
        (pitch * Math.PI) / 180,
        ((180 - yaw) * Math.PI) / 180,
        (-roll * Math.PI) / 180,
        'YXZ'
      );
    }
    propRefs.current.forEach((ref, i) => {
      if (!ref) return;
      const motorRpm = motorList[i]?.rpm ?? (motorList.length === 0 ? 5500 : 0);
      const radsPerSec = (motorRpm * 2 * Math.PI) / 60;
      const dir = i % 2 === 0 ? 1 : -1; // alternate CW/CCW
      ref.rotation.y += dir * radsPerSec * delta * 0.15; // visual scale
    });
  });

  const opacity = isGhost ? 0.35 : 1;
  const transparent = isGhost;

  // Color scheme
  const bodyColor = isGhost ? '#06b6d4' : '#1e293b';
  const armColor = isGhost ? '#0891b2' : '#0f172a';
  const motorColor = isGhost ? '#0e7490' : '#334155';
  const propColor = isGhost ? '#67e8f9' : '#94a3b8';
  const emissive = isGhost ? '#06b6d4' : '#000000';

  // Motor health color (motor efficiency < 0.7 turns red, < 0.9 amber)
  const motorColors = [0, 1, 2, 3].map((i) => {
    const m = motorList[i];
    if (m && typeof m.efficiency === 'number' && m.efficiency < 0.7) return '#ef4444';
    if (m && typeof m.efficiency === 'number' && m.efficiency < 0.9) return '#f59e0b';
    return motorColor;
  });

  return (
    <group ref={groupRef}>
      {/* Central body */}
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.12, 0.45]} />
        <meshStandardMaterial
          color={bodyColor}
          emissive={emissive}
          emissiveIntensity={isGhost ? 0.4 : 0}
          metalness={0.7}
          roughness={0.3}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {/* Top dome */}
      <mesh position={[0, 0.09, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isGhost ? '#06b6d4' : '#0f172a'}
          metalness={0.5}
          roughness={0.4}
          transparent={transparent}
          opacity={opacity}
        />
      </mesh>

      {/* Four arms */}
      {ARM_POSITIONS.map((arm, i) => (
        <group key={i} position={[arm.x, 0, arm.z]}>
          {/* Arm tube */}
          <mesh rotation={[0, arm.rotY, 0]} castShadow>
            <boxGeometry args={[0.48, 0.04, 0.06]} />
            <meshStandardMaterial
              color={armColor}
              metalness={0.6}
              roughness={0.4}
              transparent={transparent}
              opacity={opacity}
            />
          </mesh>

          {/* Motor nacelle */}
          <mesh position={[0, 0.025, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.075, 0.07, 12]} />
            <meshStandardMaterial
              color={motorColors[i]}
              metalness={0.8}
              roughness={0.2}
              transparent={transparent}
              opacity={opacity}
            />
          </mesh>

          {/* Propeller disc (semi-transparent) */}
          <mesh
            ref={(el) => { propRefs.current[i] = el; }}
            position={[0, 0.07, 0]}
          >
            <cylinderGeometry args={[0.22, 0.22, 0.008, 16]} />
            <meshStandardMaterial
              color={propColor}
              transparent
              opacity={isGhost ? 0.2 : 0.55}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Propeller blade cross */}
          <mesh
            ref={null}
            position={[0, 0.072, 0]}
            rotation={[0, (i * Math.PI) / 4, 0]}
          >
            <boxGeometry args={[0.42, 0.008, 0.035]} />
            <meshStandardMaterial
              color={isGhost ? '#67e8f9' : '#475569'}
              transparent={transparent}
              opacity={opacity * 0.7}
            />
          </mesh>
          <mesh
            position={[0, 0.072, 0]}
            rotation={[0, (i * Math.PI) / 4 + Math.PI / 2, 0]}
          >
            <boxGeometry args={[0.42, 0.008, 0.035]} />
            <meshStandardMaterial
              color={isGhost ? '#67e8f9' : '#475569'}
              transparent={transparent}
              opacity={opacity * 0.7}
            />
          </mesh>

          {/* Nav light */}
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial
              color={i < 2 ? '#00ff88' : '#ff4444'}
              emissive={i < 2 ? '#00ff88' : '#ff4444'}
              emissiveIntensity={0.8}
              transparent={transparent}
              opacity={opacity}
            />
          </mesh>
        </group>
      ))}

      {/* Landing legs */}
      {[[-0.2, 0.2], [0.2, 0.2], [-0.2, -0.2], [0.2, -0.2]].map(([lx, lz], i) => (
        <group key={`leg-${i}`} position={[lx, -0.06, lz]}>
          <mesh>
            <cylinderGeometry args={[0.012, 0.012, 0.15, 6]} />
            <meshStandardMaterial color={armColor} transparent={transparent} opacity={opacity} />
          </mesh>
          <mesh position={[0, -0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.22, 6]} />
            <meshStandardMaterial color={armColor} transparent={transparent} opacity={opacity} />
          </mesh>
        </group>
      ))}

      {/* Front indicator light */}
      <mesh position={[0, 0, 0.26]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
}