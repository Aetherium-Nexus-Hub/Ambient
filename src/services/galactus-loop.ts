import { galactusOrchestrator } from './galactus-orchestrator';
import { paralegalService } from './paralegal-service';
import { jarvisBridge } from './jarvis-bridge';

export const startGalactusLoop = async () => {
  try {
    console.log("🚀 Starting Galactus Self-Sustaining Cycle...");

    const state = await galactusOrchestrator.initiate({
      cycleId: `cycle-${Date.now()}`,
      failSafeLevel: 'full'
    });

    const repoReport = await paralegalService.runMaintenance([
      'emergence', 'Ambient', 'tonysfart', 'The-Paralegal-', 'Nexus', 'Hefboom'
    ]);

    await jarvisBridge.reportStatus({
      cycleId: state.cycleId,
      galactusStatus: state.status,
      repoHealth: repoReport
    });

    console.log("✅ Cycle completed successfully.");
  } catch (error) {
    console.error("❌ Galactus Cycle Error (Fail-safe engaged):", error);
  }

  // Next cycle
  setTimeout(startGalactusLoop, 1000 * 60 * 45); // Every 45 minutes
};