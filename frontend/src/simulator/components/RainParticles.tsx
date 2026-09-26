import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RainParticlesProps {
  active: boolean;
  windVx?: number;
  windVy?: number;
  count?: number;
}

export function RainParticles({
  active,
  windVx = 0,
  windVy = 0,
  count = 900,
}: RainParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = Math.random() * 45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      vel[i] = 22 + Math.random() * 12; // 22-34 m/s fall speed
    }

    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      array[idx + 1] -= velocities[i] * delta;
      array[idx] += windVx * 0.5 * delta;
      array[idx + 2] += -windVy * 0.5 * delta;

      // Wrap around bounds
      if (array[idx + 1] < 0) {
        array[idx + 1] = 45;
        array[idx] = (Math.random() - 0.5) * 80;
        array[idx + 2] = (Math.random() - 0.5) * 80;
      }
      if (array[idx] > 40) array[idx] = -40;
      if (array[idx] < -40) array[idx] = 40;
      if (array[idx + 2] > 40) array[idx + 2] = -40;
      if (array[idx + 2] < -40) array[idx + 2] = 40;
    }

    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#7dd3fc"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}