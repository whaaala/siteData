process.on('uncaughtException', (err) => {
  console.error('[Scheduler] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Scheduler] Unhandled Rejection:', reason);
});

async function runScript(script) {
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [script], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${script} exited with code ${code}`));
      }
    });
  });
}

const ACTIVE_START_HOUR = 5;  // 5am
const ACTIVE_END_HOUR = 23;   // 11pm (last post at 10:48pm)

let lastBatchPublishDay = null;

async function startScheduler() {
  while (true) {
    try {
      const now = new Date();
      const hour = now.getHours();
      const today = now.toISOString().slice(0, 10);

      // Only post during active hours
      if (hour >= ACTIVE_START_HOUR && hour < ACTIVE_END_HOUR) {
        console.log(`[Scheduler] Starting crawer.js at ${now.toISOString()}`);
        try {
          await runScript('crawer.js');
          console.log(`[Scheduler] crawer.js completed at ${new Date().toISOString()}`);
        } catch (err) {
          console.error(`[Scheduler] Error running crawer.js:`, err);
        }

        // Force garbage collection before waiting
        if (global.gc) {
          console.log('[Scheduler] Forcing garbage collection before wait...');
          global.gc();
        } else {
          console.log('[Scheduler] Garbage collection not exposed. Start node with --expose-gc');
        }

        console.log('[Scheduler] Waiting 7 minutes before next run...');
        await new Promise((res) => setTimeout(res, 7 * 60 * 1000)); // 7 minutes

        // Optionally, force garbage collection again after wait
        if (global.gc) {
          console.log('[Scheduler] Forcing garbage collection after wait...');
          global.gc();
        }
      } else {
        // Outside active hours, wait until next check
        console.log('[Scheduler] Outside active hours. Waiting 10 minutes...');
        await new Promise((res) => setTimeout(res, 10 * 60 * 1000)); // 10 minutes
      }
      console.log('[Scheduler] Looping again...');
    } catch (err) {
      console.error('[Scheduler] Error in main loop:', err);
      // Wait a bit before retrying to avoid a crash loop
      await new Promise((res) => setTimeout(res, 60 * 1000));
    }
  }
}

startScheduler();