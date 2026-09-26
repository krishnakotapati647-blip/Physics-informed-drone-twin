import { DroneModel } from '../../simulator/components/DroneModel';
import type { TelemetryFrame } from '../../types';

interface DigitalTwinDroneModelProps {
  telemetry: TelemetryFrame | null;
  isGhost?: boolean;
}

export function DigitalTwinDroneModel({ telemetry, isGhost = false }: DigitalTwinDroneModelProps) {
  return (
    <DroneModel
      attitude={telemetry?.attitude ?? null}
      motors={telemetry?.motors ?? null}
      isGhost={isGhost}
    />
  );
}