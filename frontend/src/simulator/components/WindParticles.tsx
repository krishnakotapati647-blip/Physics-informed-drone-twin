import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WindParticlesProps {
  environment?: {
    windSpeed?: number;
    windDirection?: number;
    turbulence?: number;
    wind_speed?: number;
    wind_direction?: number;
  } | null;
  count?: number;
}

const FIELD_SIZE = 120;
const FIELD_HEIGHT = 50;

export function WindParticles({ environment, count = 80 }: WindParticlesProps) {
  const meshRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * FIELD_SIZE;
      pos[i * 3 + 1] = Math.random() * FIELD_HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * FIELD_SIZE;
    }
    return pos;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  const windSpeed = environment?.windSpeed ?? environment?.wind_speed ?? 2;
  const windDir = environment?.windDirection ?? environment?.wind_direction ?? 270;
  const turbulence = environment?.turbulence ?? 0;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const speed = windSpeed * 0.45;
    const dirRad = (windDir * Math.PI) / 180;
    const wx = Math.sin(dirRad) * speed;
    const wz = -Math.cos(dirRad) * speed; // Three.js z = -North

    for (let i = 0; i < count; i++) {
      arr[i * 3]     += wx * delta;
      arr[i * 3 + 2] += wz * delta;
      // Turbulence wobble
      arr[i * 3 + 1] += (Math.random() - 0.5) * turbulence * delta * 2;

      // Wrap around field
      const half = FIELD_SIZE / 2;
      if (arr[i * 3] > half) arr[i * 3] -= FIELD_SIZE;
      if (arr[i * 3] < -half) arr[i * 3] += FIELD_SIZE;
      if (arr[i * 3 + 2] > half) arr[i * 3 + 2] -= FIELD_SIZE;
      if (arr[i * 3 + 2] < -half) arr[i * 3 + 2] += FIELD_SIZE;
      if (arr[i * 3 + 1] > FIELD_HEIGHT) arr[i * 3 + 1] = 0;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = FIELD_HEIGHT;
    }
    posAttr.needsUpdate = true;
  });

  const opacity = Math.min(0.75, 0.2 + windSpeed * 0.035);

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color="#0284c7"
        size={0.55}
        transparent
        opacity={opacity}
        sizeAttenuation
      />
    </points>
  );
}