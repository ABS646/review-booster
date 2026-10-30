import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { phone, businessName, googleLink, userId, reviewGating } = await req.json();

    if (!phone || !businessName || !googleLink || !userId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    // The Magic Link Logic
    // If gating is on, point to our /r/ page. If off, point straight to Google.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const finalLink = reviewGating 
      ? `${baseUrl}/r/${userId}` 
      : googleLink;

    const messageBody = `Hi! Thanks for visiting ${businessName}. Please take 10 seconds to leave us a 5-star review here: ${finalLink}`;

    const message = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    await supabaseAdmin.from('review_requests').insert({
      user_id: userId,
      customer_phone: formattedPhone,
      status: 'sent'
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error: any) {
    console.error('SMS Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}