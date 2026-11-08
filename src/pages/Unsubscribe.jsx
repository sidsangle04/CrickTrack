import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, MailX, RefreshCw } from 'lucide-react';

const LOGO = 'https://media.base44.com/images/public/69cd6e7dda99287bd2ab65f2/c49e9414c_CrickTrackLogo.png';

// The platform keeps the unsubscribe list; this page only reports the token's verdict.
const readToken = () => new URLSearchParams(window.location.hash.slice(1)).get('token');

const inEditorPreview = () =>
  window.self !== window.top || /^preview(-sandbox)?--/.test(window.location.hostname);

export default function Unsubscribe() {
  const [status, setStatus] = useState('loading');

  const submit = useCallback(async () => {
    const token = readToken();
    if (!token) {
      setStatus(inEditorPreview() ? 'preview' : 'invalid');
      return;
    }
    setStatus('loading');
    try {
      const response = await fetch('/api/app-emails/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (response.ok) setStatus('done');
      else if (response.status === 400) setStatus('invalid');
      else setStatus('error');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    submit();
  }, [submit]);

  const card = {
    loading: {
      icon: <Loader2 className="w-7 h-7 text-emerald-400 animate-spin" />,
      title: 'Updating your preferences',
      body: 'This only takes a moment.',
    },
    done: {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
      title: "You're unsubscribed",
      body: 'You will no longer receive marketing emails from CrickTrack. Transactional emails such as password resets and account notices will still arrive.',
    },
    preview: {
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-400" />,
      title: "You're unsubscribed",
      body: 'You will no longer receive marketing emails from CrickTrack. Transactional emails such as password resets and account notices will still arrive.',
    },
    invalid: {
      icon: <AlertCircle className="w-7 h-7 text-amber-400" />,
      title: "This unsubscribe link isn't valid",
      body: 'The link may have expired or already been used. If you are still receiving emails you do not want, reply to one of them and we will remove you.',
    },
    error: {
      icon: <AlertCircle className="w-7 h-7 text-red-400" />,
      title: "We couldn't update your preferences",
      body: 'Something went wrong on our side. Please try again.',
    },
  }[status];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <a href="/" className="flex items-center justify-center gap-2 mb-6">
          <img src={LOGO} alt="CrickTrack" className="h-10 w-auto rounded-lg bg-white p-1 shadow-lg" />
          <span className="text-lg font-bold text-white tracking-tight">CrickTrack</span>
        </a>

        <div className="bg-slate-800/70 border border-slate-700/60 rounded-2xl p-6 md:p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-slate-900/80 border border-slate-700/60 flex items-center justify-center mx-auto">
            {card.icon}
          </div>

          <h1 className="mt-4 text-xl md:text-2xl font-bold text-white tracking-tight">{card.title}</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">{card.body}</p>

          {status === 'preview' && (
            <span className="inline-block mt-3 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-slate-700 text-slate-300">
              Preview
            </span>
          )}

          {status === 'error' && (
            <button
              onClick={submit}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-sm font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          )}

          {(status === 'done' || status === 'preview' || status === 'invalid') && (
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
              <MailX className="w-3.5 h-3.5" />
              <span>Email preferences for CrickTrack</span>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
            Back to CrickTrack
          </a>
        </div>
      </div>
    </div>
  );
}