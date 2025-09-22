const cron = require('node-cron');

function startMidnightCron(io) {
  // Run at local server time midnight
  cron.schedule('0 0 * * *', () => {
    console.log('[Cron] Midnight reset trigger');
    io.emit('system:midnight', { at: new Date().toISOString() });
  });
}

module.exports = { startMidnightCron };
