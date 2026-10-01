import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// One-line, plain-English explanation of the win-probability number at key
// moments (wicket, end of over, innings break).
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      keyEvent = 'over_end',
      battingTeam = 'the batting side',
      bowlingTeam = 'the bowling side',
      score = '',
      target = null,
      battingPct = 50,
      why = ''
    } = body || {};

    const moment =
      keyEvent === 'wicket' ? 'A wicket has just fallen'
        : keyEvent === 'innings' ? 'The innings has just ended'
          : 'An over has just finished';

    const prompt = `You are a concise cricket analyst.
${moment} in a match between ${battingTeam} (batting) and ${bowlingTeam}.
Score: ${score}.${target ? ` Target: ${target}.` : ''}
The win-probability model gives ${battingTeam} a ${battingPct}% chance of winning. Situation: ${why}.
Write ONE short sentence (maximum 22 words) explaining what is driving that number right now. Plain English, no emojis, no bullet points, do not repeat the percentage.`;

    const insight = await base44.integrations.Core.InvokeLLM({ prompt });

    return Response.json({ insight: typeof insight === 'string' ? insight.trim() : '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}