
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

const ACTIVE_START_HOUR = 7;  // 7am
const ACTIVE_END_HOUR = 23;   // 11pm (last post at 10:48pm)

let lastBatchPublishDay = null;

async function startScheduler() {
  while (true) {
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
      console.log('[Scheduler] Waiting 12 minutes before next run...');
      await new Promise((res) => setTimeout(res, 12 * 60 * 1000)); // 12 minutes
    } else if (hour === 22 && lastBatchPublishDay !== today) {
      // Run batchPublish.js at 10pm, only once per day (optional, if you still want this)
      console.log(`[Scheduler] Running batchPublish.js at ${now.toISOString()}`);
      try {
        await runScript('batchPublish.js');
        lastBatchPublishDay = today;
        console.log(`[Scheduler] batchPublish.js completed at ${new Date().toISOString()}`);
      } catch (err) {
        console.error(`[Scheduler] Error running batchPublish.js:`, err);
      }
      await new Promise((res) => setTimeout(res, 60 * 60 * 1000));
    } else {
      // Outside active hours, wait until next check
      console.log('[Scheduler] Outside active hours. Waiting 10 minutes...');
      await new Promise((res) => setTimeout(res, 10 * 60 * 1000)); // 10 minutes
    }
  }
}

startScheduler();