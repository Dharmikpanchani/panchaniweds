import { NextResponse } from 'next/server';

export async function GET() {
  const serviceId =
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'service_qg8udpg';

  const templateId =
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'template_28u6ldd';

  const publicKey =
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || 'CyHUWuM_hLMLkKHP1';

  const recipientEmail =
    process.env.NEXT_PUBLIC_RECIPIENT_EMAIL || 'dharmikpanchani9@gmail.com';

  return NextResponse.json(
    {
      serviceId,
      templateId,
      publicKey,
      recipientEmail,
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
