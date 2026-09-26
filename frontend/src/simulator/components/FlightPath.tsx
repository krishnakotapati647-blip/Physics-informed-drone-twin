import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Vec3, Waypoint } from '../simulation/simulationTypes';

interface FlightPathProps {
  waypoints: Waypoint[];
  currentPosition: Vec3;
  pathHistory: Vec3[];
}

export function FlightPath({ waypoints, currentPosition, pathHistory }: FlightPathProps) {
  // Completed path (history)
  const historyPoints = useMemo(() => {
    if (pathHistory.length < 2) return null;
    return pathHistory.map((p) => [p.x, p.z, -p.y] as [number, number, number]);
  }, [pathHistory]);

  // Planned path (remaining waypoints)
  const plannedPoints = useMemo(() => {
    const upcoming = waypoints.filter((w) => w.status !== 'COMPLETED');
    if (upcoming.length < 1) return null;
    const pts: [number, number, number][] = [
      [currentPosition.x, currentPosition.z, -currentPosition.y],
      ...upcoming.map((w) => [w.position.x, w.position.z, -w.position.y] as [number, number, number]),
    ];
    return pts;
  }, [waypoints, currentPosition]);

  return (
    <>
      {/* Completed path - dim cyan */}
      {historyPoints && historyPoints.length >= 2 && (
        <Line
          points={historyPoints}
          color="#0891b2"
          lineWidth={1.5}
          transparent
          opacity={0.5}
        />
      )}

      {/* Planned path - dashed translucent */}
      {plannedPoints && plannedPoints.length >= 2 && (
        <Line
          points={plannedPoints}
          color="#3b82f6"
          lineWidth={1}
          transparent
          opacity={0.35}
          dashed
          dashSize={2}
          gapSize={1.5}
        />
      )}
    </>
  );
}