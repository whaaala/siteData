process.on('uncaughtException', (err) => {
  console.error('[Scheduler] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Scheduler] Unhandled Rejection:', reason);
});

async function runScript(script) {
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    let skipWait = false;
    const proc = spawn('node', [script]);

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      if (
        output.includes(
          '[Main] All posts for this URL have already been processed or quota met. Marking URL as scraped.'
        )
      ) {
        skipWait = true;
      }
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(skipWait);
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
          const skipWait = await runScript('crawer.js'); // <-- Capture the return value!
          console.log(`[Scheduler] crawer.js completed at ${new Date().toISOString()}`);

          // Force garbage collection before waiting
          if (global.gc) {
            console.log('[Scheduler] Forcing garbage collection before wait...');
            global.gc();
          } else {
            console.log('[Scheduler] Garbage collection not exposed. Start node with --expose-gc');
          }

          if (skipWait) {
            console.log('[Scheduler] No wait, starting next run immediately...');
            continue; // Immediately start next loop
          } else {
            console.log('[Scheduler] Waiting 7 minutes before next run...');
            await new Promise((res) => setTimeout(res, 7 * 60 * 1000)); // 7 minutes
          }

          // Optionally, force garbage collection again after wait
          if (global.gc) {
            console.log('[Scheduler] Forcing garbage collection after wait...');
            global.gc();
          }
        } catch (err) {
          console.error(`[Scheduler] Error running crawer.js:`, err);
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