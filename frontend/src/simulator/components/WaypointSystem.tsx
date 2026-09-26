import { useRef } from 'react';
import { Text, Billboard } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Waypoint } from '../simulation/simulationTypes';

interface WaypointMarkerProps {
  waypoint: Waypoint;
}

function WaypointMarker({ waypoint }: WaypointMarkerProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const { position, name, status } = waypoint;
  // Convert sim coords (x=East, y=North, z=Alt) to Three.js (x, y=up, z=-y)
  const threePos: [number, number, number] = [position.x, position.z, -position.y];

  const color =
    status === 'COMPLETED' ? '#10b981' :
    status === 'CURRENT'   ? '#f59e0b' :
    '#3b82f6';

  useFrame((_, delta) => {
    if (status === 'CURRENT' && ringRef.current) {
      ringRef.current.rotation.y += delta * 1.2;
      ringRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.003) * 0.08);
    }
  });

  if (name === 'HOME' && waypoint.id === 0) return null; // hide origin home marker

  return (
    <group position={threePos}>
      {/* Vertical pole */}
      <mesh position={[0, -position.z / 2, 0]}>
        <cylinderGeometry args={[0.04, 0.04, position.z, 6]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Sphere marker */}
      <mesh ref={ringRef}>
        <sphereGeometry args={[1.0, 10, 10]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={status === 'CURRENT' ? 0.5 : 0.25}
          wireframe={status !== 'COMPLETED'}
        />
      </mesh>

      {/* Solid inner sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={status === 'CURRENT' ? 0.6 : 0.2}
        />
      </mesh>

      {/* Label */}
      <Billboard position={[0, 2.5, 0]}>
        <Text
          fontSize={1.4}
          color={color}
          anchorX="center"
          anchorY="middle"
          font={undefined}
        >
          {name}
        </Text>
        <Text
          fontSize={0.9}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
          position={[0, -1.2, 0]}
        >
          {`ALT ${position.z}m  ${status}`}
        </Text>
      </Billboard>
    </group>
  );
}

interface WaypointSystemProps {
  waypoints: Waypoint[];
}

export function WaypointSystem({ waypoints }: WaypointSystemProps) {
  return (
    <>
      {waypoints.map((wp) => (
        <WaypointMarker key={wp.id} waypoint={wp} />
      ))}
    </>
  );
}