import { useState, useEffect, useCallback } from 'react';
import { simulationEngine } from './simulationEngine';
import type { SimulationState, ScenarioType } from './simulationTypes';
import { sendCommand } from '../../services/wsClient';

export function useSimulation() {
  const [state, setState] = useState<SimulationState>(simulationEngine.getState());

  useEffect(() => {
    const unsub = simulationEngine.subscribe(setState);
    return unsub;
  }, []);

  const start = useCallback(() => {
    simulationEngine.start();
    sendCommand('START');
  }, []);

  const pause = useCallback(() => {
    simulationEngine.pause();
    sendCommand('PAUSE');
  }, []);

  const resume = useCallback(() => {
    simulationEngine.resume();
    sendCommand('RESUME');
  }, []);

  const reset = useCallback(() => {
    simulationEngine.reset();
    sendCommand('RESET');
  }, []);

  const returnToBase = useCallback(() => {
    simulationEngine.returnToBase();
    sendCommand('RETURN_TO_BASE');
  }, []);

  const abort = useCallback(() => {
    simulationEngine.abort();
    sendCommand('ABORT');
  }, []);

  const setScenario = useCallback((s: ScenarioType) => {
    simulationEngine.setScenario(s);
    sendCommand('SCENARIO_CHANGE', { scenario: s });
  }, []);

  const runPhysicsValidationSuite = useCallback(() => {
    return simulationEngine.runPhysicsValidationSuite();
  }, []);

  return { state, start, pause, resume, reset, returnToBase, abort, setScenario, runPhysicsValidationSuite };
}
