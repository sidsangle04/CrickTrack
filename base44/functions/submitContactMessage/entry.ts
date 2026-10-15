import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const topic = typeof body.subject === 'string' ? body.subject.trim().slice(0, 120) : '';

    if (!message) {
      return Response.json({ error: 'Please enter a message.' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = (users || []).filter((u) => u.role === 'admin' && u.email);

    if (recipients.length === 0) {
      return Response.json({ error: 'No inbox is configured to receive messages yet.' }, { status: 503 });
    }

    const text = [
      'New message from the CrickTrack contact form.',
      '',
      `From: ${user.full_name || 'App user'} <${user.email}>`,
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