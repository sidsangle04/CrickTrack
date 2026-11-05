import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Every contact form submission lands in this inbox.
const CONTACT_INBOX = 'cricktrack2026@gmail.com';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Signed-out visitors may use the public contact page, so a missing session
    // is not an error here — they simply fill in their own details.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const body = await req.json().catch(() => ({}));
    const str = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

    const name = str(body.name, 120) || user?.full_name || '';
    const email = str(body.email, 160) || user?.email || '';
    const phone = str(body.phone, 40);
    const topic = str(body.subject, 120);
    const message = str(body.message, 4000);

    if (!name) {
      return Response.json({ error: 'Please tell us your name.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return Response.json({ error: 'Please enter a valid email address so we can reply.' }, { status: 400 });
    }
    if (!message) {
      return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    }

    const text = [
      'New message from the CrickTrack contact form.',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Contact number: ${phone || 'Not given'}`,
      `Subject: ${topic || 'General enquiry'}`,
      ...(user ? ['', `Sent by signed-in user: ${user.email}`] : []),
      '',
      'Message:',
      message,
    ].join('\n');

    const subject = `New CrickTrack contact message${topic ? `: ${topic}` : ''}`;

    // This inbox is the only destination — app admins are not copied.
    const sent = await base44.asServiceRole.integrations.Core.SendEmail({
      to: CONTACT_INBOX,
      subject,
      body: text,
    }).catch(() => null);

    if (sent?.success === false) {
      return Response.json({ error: 'Your message could not be delivered right now.' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}