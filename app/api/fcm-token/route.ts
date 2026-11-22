import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const tokensFilePath = path.join(process.cwd(), 'wishes_log', 'fcm_tokens.json');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, userAgent } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Valid FCM token is required' }, { status: 400 });
    }

    // Ensure directory exists
    const dir = path.dirname(tokensFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let tokens: Array<{ token: string; addedAt: string; userAgent?: string }> = [];
    if (fs.existsSync(tokensFilePath)) {
      try {
        tokens = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
      } catch (e) {
        tokens = [];
      }
    }

    // Check if token already registered
    const existing = tokens.find((t) => t.token === token);
    if (!existing) {
      tokens.push({
        token,
        addedAt: new Date().toISOString(),
        userAgent: userAgent || 'Unknown'
      });
      fs.writeFileSync(tokensFilePath, JSON.stringify(tokens, null, 2), 'utf8');
    }

    return NextResponse.json({ success: true, count: tokens.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    let tokens: any[] = [];
    if (fs.existsSync(tokensFilePath)) {
      try {
        tokens = JSON.parse(fs.readFileSync(tokensFilePath, 'utf8'));
      } catch (e) {
        tokens = [];
      }
    }
    return NextResponse.json({ count: tokens.length, tokens: tokens.map(t => t.token) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

