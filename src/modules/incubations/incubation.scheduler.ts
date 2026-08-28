import { IncubationService } from './incubation.service.js';

let schedulerTimer: NodeJS.Timeout | null = null;
const incubationService = new IncubationService();

/**
 * Start the background incubation deadline scheduler.
 * PostgreSQL is the single source of truth; detects missed deadlines upon restart.
 */
export function startIncubationScheduler(intervalMs = 30000): void {
  if (schedulerTimer) {
    return;
  }

  console.log(`[SCHEDULER] Starting Incubation Timer Daemon (poll interval: ${intervalMs / 1000}s)...`);

  // 1. Run an immediate sweep on boot
  runSweepSafe();

  // 2. Schedule recurring idempotent check
  schedulerTimer = setInterval(() => {
    runSweepSafe();
  }, intervalMs);
}

async function runSweepSafe(): Promise<void> {
  try {
    const updatedCount = await incubationService.runScheduledSweep();
    if (updatedCount > 0) {
      console.log(`[SCHEDULER] Incubation sweep updated ${updatedCount} incubation(s) to DUE / OVERDUE state.`);
    }
  } catch (err: any) {
    console.warn(`[SCHEDULER] Warning during incubation sweep:`, err.message);
  }
}

/**
 * Gracefully stop the background incubation scheduler.
 */
export function stopIncubationScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    console.log('[SCHEDULER] Incubation Timer Daemon stopped.');
  }
}
