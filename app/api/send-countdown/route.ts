import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Testing threshold: 100 days (user requested 100 days for testing; change to 5 in future)
export const DEFAULT_COUNTDOWN_THRESHOLD_DAYS = 100;
const WEDDING_DATE_ISO = '2027-01-29T00:00:00+05:30';

let firebaseAdminApp: any = null;

async function getFirebaseMessaging() {
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getMessaging } = await import('firebase-admin/messaging');

  const existing = getApps();
  if (existing.length > 0) {
    return getMessaging(existing[0]);
  }

  const serviceAccountPath = path.join(process.cwd(), 'config', 'firebase-service-account.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error('config/firebase-service-account.json not found');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  firebaseAdminApp = initializeApp({
    credential: cert(serviceAccount)
  });

  return getMessaging(firebaseAdminApp);
}

function calculateDaysLeft() {
  const wedding = new Date(WEDDING_DATE_ISO).getTime();
  const now = Date.now();
  const diff = wedding - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export async function POST(req: NextRequest) {
  return handleCountdownPush(req);
}

export async function GET(req: NextRequest) {
  return handleCountdownPush(req);
}

async function handleCountdownPush(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const threshold = Number(url.searchParams.get('threshold')) || DEFAULT_COUNTDOWN_THRESHOLD_DAYS;

    const daysLeft = calculateDaysLeft();

    // Check if within threshold
    if (!force && daysLeft > threshold) {
      return NextResponse.json({
        success: false,
        message: `Wedding is ${daysLeft} days away, which is outside the ${threshold}-day threshold. No notification sent.`,
        daysLeft,
        threshold
      });
    }

    // Read stored tokens
    const tokensFilePath = path.join(process.cwd(), 'wishes_log', 'fcm_tokens.json');
    if (!fs.existsSync(tokensFilePath)) {
      return NextResponse.json({
        success: true,
        message: 'No registered FCM devices found in wishes_log/fcm_tokens.json.',
        daysLeft,
        sentCount: 0
      });
    }

    const tokenRecords: any[] = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
    const tokens = tokenRecords.map((r) => r.token).filter(Boolean);

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active device tokens found.',
        daysLeft,
        sentCount: 0
      });
    }

    const messaging = await getFirebaseMessaging();

    const title = '॥ શુભ લગ્ન વધામણાં ॥';
    let bodyText = `ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નને હવે માત્ર ${daysLeft} દિવસ બાકી છે! 🌸`;
    if (daysLeft === 1) {
      bodyText = 'કાલે છે શુભ લગ્નનો રૂડો અવસર! આપશ્રી સહપરિવાર અવશ્ય પધારશોજી. 🪕';
    } else if (daysLeft <= 0) {
      bodyText = 'આજે છે ચિ. ધાર્મિક અને ચિ. નિશાના શુભ લગ્નનો માંગલિક દિવસ! આપ સહપરિવાર પધારી નવદંપતીને આશીર્વાદ આપશોજી. 💍';
    }

    const messagePayload = {
      notification: {
        title,
        body: bodyText
      },
      data: {
        title,
        body: bodyText,
        daysLeft: String(daysLeft),
        url: './index.html'
      },
      tokens
    };

    const response = await messaging.sendEachForMulticast(messagePayload);

    return NextResponse.json({
      success: true,
      daysLeft,
      threshold,
      totalTokens: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error sending push notification' }, { status: 500 });
  }
}

