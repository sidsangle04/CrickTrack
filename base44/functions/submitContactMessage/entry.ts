import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    // Signed-out visitors may use the public contact page, so a missing session
    // is not an error here — they must simply leave an email address.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const topic = typeof body.subject === 'string' ? body.subject.trim().slice(0, 120) : '';
    const guestEmail = typeof body.email === 'string' ? body.email.trim().slice(0, 160) : '';

    if (!message) {
      return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    }
    if (message.length > 4000) {
      return Response.json({ error: 'Please keep your message under 4000 characters.' }, { status: 400 });
    }
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guestEmail)) {
      return Response.json({ error: 'Please enter your email address so we can reply.' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = (users || []).filter((u) => u.role === 'admin' && u.email);

    if (recipients.length === 0) {
      return Response.json({ error: 'No inbox is configured to receive messages yet.' }, { status: 503 });
    }

    const text = [
      'New message from the CrickTrack contact form.',
      '',
      `From: ${user?.full_name || 'Website visitor'} <${user?.email || guestEmail}>`,
      `Subject: ${topic || 'General enquiry'}`,
      '',
      message,
    ].join('\n');

    const results = await Promise.allSettled(
      recipients.map((admin) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: 'New CrickTrack contact message',
          body: text,
        })
      )
    );

    const delivered = results.filter((r) => r.status === 'fulfilled').length;
    if (delivered === 0) {
      return Response.json({ error: 'Your message could not be delivered right now.' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}