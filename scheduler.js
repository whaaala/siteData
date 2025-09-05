async function runScraper() {
  const { spawn } = await import('child_process');
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['crawer.js'], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Scraper exited with code ${code}`));
      }
    });
  });
}

async function startScheduler() {
  while (true) {
    console.log(`[Scheduler] Starting crawer.js at ${new Date().toISOString()}`);
    try {
      await runScraper();
      console.log(`[Scheduler] crawer.js completed at ${new Date().toISOString()}`);
    } catch (err) {
      console.error(`[Scheduler] Error:`, err);
    }
     console.log('[Scheduler] Waiting 45 seconds before next run...');
    await new Promise((res) => setTimeout(res, 45 * 1000));
  }
}

startScheduler();