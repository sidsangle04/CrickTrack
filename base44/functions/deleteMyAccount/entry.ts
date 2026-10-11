import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Deletes the signed-in user's own account.
// The user id always comes from the verified session — never from the request
// body — so a caller can only ever delete themselves, and the confirmation
// word has to be present before anything is removed.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    if (String(body?.confirm || '').trim().toUpperCase() !== 'DELETE') {
      return Response.json({ error: 'Confirmation text did not match.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.User.delete(user.id);

    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}