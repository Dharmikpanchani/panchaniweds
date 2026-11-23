/**
 * 1-Minute Automated Push Notification Runner for Live Testing
 * Runs every 60 seconds (1 minute sharp).
 */

const { execSync } = require('child_process');
const path = require('path');

const sendScript = path.join(__dirname, 'send-push.js');

console.log('====================================================');
console.log('⏱️ 1-Minute Wedding Push Notification Runner STARTED');
console.log('Interval: Every 60 seconds (1 Minute)');
console.log('====================================================\n');

function runPush() {
  const timeStr = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`[${timeStr}] 🚀 Triggering 1-minute push notification...`);
  try {
    const output = execSync(`node "${sendScript}"`, { encoding: 'utf8' });
    const successMatch = output.match(/✅ (\d+) sent successfully/);
    if (successMatch) {
      console.log(`[${timeStr}] ✨ Push sent successfully! Sent: ${successMatch[1]}`);
    } else {
      console.log(`[${timeStr}] ⚠️ Push finished. Output:\n`, output.slice(0, 300));
    }
  } catch (err) {
    console.error(`[${timeStr}] ❌ Error running push:`, err.message);
  }
}

// Run immediately on start
runPush();

// Then run every 60 seconds (1 minute)
setInterval(runPush, 60000);
