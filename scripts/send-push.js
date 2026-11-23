/**
 * Hourly Wedding Countdown Push Notification Dispatcher
 * Project: Panchani Royal Wedding (Dharmik & Nisha)
 *
 * Can be run:
 * 1. Automatically via GitHub Actions every 1 hour (cron: '0 * * * *')
 * 2. Manually via GitHub Actions UI (workflow_dispatch)
 * 3. Locally: node scripts/send-push.js
 * 4. Test specific token: node scripts/send-push.js --token <FCM_TOKEN>
 */

const fs = require('fs');
const path = require('path');

let initializeApp, cert, getApps;
let getMessaging;
let getFirestore;

try {
  const appModule = require('firebase-admin/app');
  initializeApp = appModule.initializeApp;
  cert = appModule.cert;
  getApps = appModule.getApps;

  getMessaging = require('firebase-admin/messaging').getMessaging;
  getFirestore = require('firebase-admin/firestore').getFirestore;
} catch (e) {
  console.error('❌ Error: firebase-admin modules not found. Please run: npm install firebase-admin');
  process.exit(1);
}

// 1. Initialize Firebase Admin SDK
function initFirebase() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0];
  }

  let credential = null;

  // Check Environment Variable (for GitHub Actions / Vercel Secrets)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      if (raw.startsWith("'") && raw.endsWith("'")) {
        raw = raw.slice(1, -1).trim();
      }
      const jsonStr = raw.startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonStr);
      credential = cert(parsed);
      console.log('🔑 Authenticated using FIREBASE_SERVICE_ACCOUNT environment variable for project:', parsed.project_id);
    } catch (err) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', err.message);
    }
  }

  // Check local file config/firebase-service-account.json
  if (!credential) {
    const localKeyPath = path.join(__dirname, '..', 'config', 'firebase-service-account.json');
    if (fs.existsSync(localKeyPath)) {
      try {
        const fileContent = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
        credential = cert(fileContent);
        console.log('🔑 Authenticated using config/firebase-service-account.json');
      } catch (err) {
        console.error('❌ Failed to read config/firebase-service-account.json:', err.message);
      }
    }
  }

  if (!credential) {
    console.error('\n❌ ERROR: Firebase Service Account credentials not found!');
    console.error('---------------------------------------------------------');
    console.error('To fix this:');
    console.error('1. In GitHub Repository: Go to Settings > Secrets and variables > Actions');
    console.error('   Add Secret named "FIREBASE_SERVICE_ACCOUNT" with the content of your Firebase service account JSON.');
    console.error('2. OR for local development: Save your JSON key as:');
    console.error('   config/firebase-service-account.json\n');
    process.exit(1);
  }

  return initializeApp({
    credential: credential,
    projectId: 'vidyasetu-f9452'
  });
}

// 2. Wedding Date & Countdown Calculator
const WEDDING_DATE = new Date('2027-01-29T00:00:00+05:30');

function calculateDaysLeft() {
  const now = new Date();
  const diff = WEDDING_DATE.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCountdownMessage(days) {
  if (days <= 0) {
    return 'આજે છે ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નનો માંગલિક દિવસ! આપ સહપરિવાર પધારી નવદંપતીને આશીર્વાદ આપશોજી. 💍';
  } else if (days === 1) {
    return 'કાલે છે શુભ લગ્નનો રૂડો અવસર! આપશ્રી સહપરિવાર અવશ્ય પધારશોજી. 🪕';
  } else {
    return `ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નને હવે માત્ર ${days} દિવસ બાકી છે! 🌸`;
  }
}

// 3. Fetch Registered Tokens
async function fetchAllTokens(app) {
  const tokenSet = new Set();
  const tokenDocMap = new Map(); // token -> firestore doc id for cleanup

  // Check CLI arg: --token <token>
  const tokenArgIdx = process.argv.indexOf('--token');
  if (tokenArgIdx !== -1 && process.argv[tokenArgIdx + 1]) {
    const singleToken = process.argv[tokenArgIdx + 1].trim();
    console.log(`🎯 Test mode: Using single token from command line argument.`);
    tokenSet.add(singleToken);
    return { tokens: Array.from(tokenSet), tokenDocMap };
  }

  // A. Fetch from Firestore
  try {
    const db = getFirestore(app);
    const snapshot = await db.collection('fcm_tokens').get();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data && data.token && typeof data.token === 'string') {
        tokenSet.add(data.token);
        tokenDocMap.set(data.token, doc.id);
      }
    });
    console.log(`📦 Loaded ${snapshot.size} device tokens from Firestore collection 'fcm_tokens'.`);
  } catch (err) {
    console.warn(`⚠️ Note: Could not read Firestore 'fcm_tokens' (${err.message}).`);
  }

  // B. Fallback to wishes_log/fcm_tokens.json
  const localFile = path.join(__dirname, '..', 'wishes_log', 'fcm_tokens.json');
  if (fs.existsSync(localFile)) {
    try {
      const records = JSON.parse(fs.readFileSync(localFile, 'utf8'));
      if (Array.isArray(records)) {
        records.forEach((r) => {
          const t = typeof r === 'string' ? r : r.token;
          if (t) tokenSet.add(t);
        });
        console.log(`📁 Loaded additional tokens from wishes_log/fcm_tokens.json.`);
      }
    } catch (_) {}
  }

  return { tokens: Array.from(tokenSet), tokenDocMap };
}

// 4. Send Multicast Notifications
async function main() {
  console.log('====================================================');
  console.log('🚀 Panchani Wedding Push Notification Dispatcher');
  console.log(`⏰ Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  console.log('====================================================');

  const app = initFirebase();
  const { tokens, tokenDocMap } = await fetchAllTokens(app);

  if (tokens.length === 0) {
    console.log('\n⚠️ No registered device tokens found.');
    console.log('Please open the app in a mobile browser / PWA and click "Allow" on notification.');
    console.log('Or test manually with: node scripts/send-push.js --token <DEVICE_FCM_TOKEN>\n');
    process.exit(0);
  }

  const daysLeft = calculateDaysLeft();
  const title = '॥ શુભ લગ્ન વધામણાં ॥';
  const bodyText = getCountdownMessage(daysLeft);

  console.log(`\n📅 Days remaining: ${daysLeft}`);
  console.log(`📢 Title: ${title}`);
  console.log(`💬 Message: ${bodyText}`);
  console.log(`📱 Sending to ${tokens.length} registered device(s)...\n`);

  const messaging = getMessaging(app);

  // Send in batches of 500 (FCM Multicast limit)
  const BATCH_SIZE = 500;
  let totalSuccess = 0;
  let totalFailure = 0;
  const invalidTokens = [];

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    const message = {
      notification: {
        title: title,
        body: bodyText
      },
      data: {
        title: title,
        body: bodyText,
        daysLeft: String(daysLeft),
        url: 'https://dharmikpanchani.github.io/panchaniweds/'
      },
      android: {
        priority: 'high',
        ttl: 86400000,
        notification: {
          title: title,
          body: bodyText,
          icon: 'icon-192.png',
          color: '#4a021e',
          sound: 'default',
          priority: 'max',
          defaultSound: true,
          defaultVibrateTimings: true,
          visibility: 'public'
        }
      },
      webpush: {
        headers: {
          Urgency: 'high',
          TTL: '86400',
          Topic: 'wedding-countdown'
        },
        notification: {
          title: title,
          body: bodyText,
          icon: 'https://dharmikpanchani.github.io/panchaniweds/icon-192.png',
          badge: 'https://dharmikpanchani.github.io/panchaniweds/badge-96.png',
          vibrate: [200, 100, 200],
          tag: 'wedding-countdown',
          renotify: true,
          requireInteraction: true
        },
        fcmOptions: {
          link: 'https://dharmikpanchani.github.io/panchaniweds/'
        }
      },
      tokens: batch
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      totalSuccess += response.successCount;
      totalFailure += response.failureCount;

      response.responses.forEach((resp, idx) => {
        const token = batch[idx];
        if (!resp.success) {
          const errorCode = resp.error?.code;
          const errorMsg = resp.error?.message;
          console.warn(`⚠️ Token ${token.slice(0, 16)}... failed: [${errorCode}] ${errorMsg}`);
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            invalidTokens.push(token);
          }
        } else {
          console.log(`✅ Token ${token.slice(0, 16)}... delivered successfully! MessageId: ${resp.messageId}`);
        }
      });
    } catch (err) {
      console.error('❌ Batch send failed:', err.message);
      totalFailure += batch.length;
    }
  }

  // Cleanup unregistered tokens from Firestore
  if (invalidTokens.length > 0) {
    try {
      const db = getFirestore(app);
      for (const tok of invalidTokens) {
        const docId = tokenDocMap.get(tok);
        if (docId) {
          await db.collection('fcm_tokens').doc(docId).delete();
          console.log(`🗑️ Removed invalid token doc ${docId} from Firestore.`);
        }
      }
    } catch (cleanupErr) {
      console.warn('⚠️ Token cleanup note:', cleanupErr.message);
    }
  }

  console.log('----------------------------------------------------');
  console.log(`✨ Results: ✅ ${totalSuccess} sent successfully | ❌ ${totalFailure} failed`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
