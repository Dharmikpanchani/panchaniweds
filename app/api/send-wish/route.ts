import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, message } = body;

    if (!name || !phone || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const serviceId =
      process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_qg8udpg';

    const templateId =
      process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_28u6ldd';

    const publicKey =
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'CyHUWuM_hLMLkKHP1';

    const recipientEmail =
      process.env.NEXT_PUBLIC_RECIPIENT_EMAIL || 'dharmikpanchani9@gmail.com';

    // Comprehensive template parameters matching any EmailJS template
    const templateParams = {
      name: name,
      from_name: name,
      user_name: name,
      to_name: 'ચિ. ધાર્મિક અને કુ. નિશા (પંચાણી પરિવાર)',
      to_email: recipientEmail,
      recipient_email: recipientEmail,
      email: recipientEmail,
      from_email: 'wedding-wishes@dharmikpanchani.com',
      user_email: recipientEmail,
      reply_to: recipientEmail,
      phone: phone,
      number: phone,
      contact_number: phone,
      mobile: phone,
      message: message,
      user_message: message,
      subject: 'શુભ લગ્ન શુભેચ્છા અને આશીર્વાદ સંદેશ (ધાર્મિક & નિશા)',
      title: 'પંચાણી પરિવાર શુભ વિવાહ - આશીર્વાદ સંદેશ',
      address: 'પંચાણી પરિવાર રોયલ વેડિંગ (Panchani Royal Wedding)',
      event: 'ચિ. ધાર્મિક અને કુ. નિશા શુભ વિવાહ પ્રસંગ',
    };

    // 1. Try sending via EmailJS
    let emailSent = false;
    let emailError = null;

    try {
      const emailRes = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams,
        }),
      });

      if (emailRes.ok) {
        emailSent = true;
      } else {
        emailError = await emailRes.text();
        console.warn('Server EmailJS send error:', emailRes.status, emailError);
      }
    } catch (err: any) {
      emailError = err.message;
      console.warn('Server EmailJS fetch error:', err.message);
    }

    // 2. Persist wish to a local JSON log as a guaranteed backup
    try {
      const logDir = path.join(process.cwd(), 'wishes_log');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logFile = path.join(logDir, 'wishes.json');
      let existingWishes = [];
      if (fs.existsSync(logFile)) {
        try {
          existingWishes = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (_) { }
      }
      existingWishes.push({
        name,
        phone,
        message,
        timestamp: new Date().toISOString(),
        emailSent,
      });
      fs.writeFileSync(logFile, JSON.stringify(existingWishes, null, 2), 'utf8');
    } catch (logErr) {
      console.error('Failed to log wish locally:', logErr);
    }

    return NextResponse.json({
      success: true,
      emailSent,
      error: emailError,
    });
  } catch (error: any) {
    console.error('API /api/send-wish error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
