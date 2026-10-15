import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const fieldClass =
  'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors';

export default function Contact() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      const response = await base44.functions.invoke('submitContactMessage', {
        subject: subject.trim(),
        message: message.trim(),
      });
      if (response.data?.success) {
        setStatus('sent');
        setSubject('');
        setMessage('');
      } else {
        setStatus('error');
        setError(response.data?.error || 'Your message could not be sent.');
      }
    } catch (err) {
      setStatus('error');
      setError('Your message could not be sent. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Contact Us</h1>
      <p className="mt-3 text-slate-400">
        Questions, bug reports, feature requests or feedback: send us a message and the CrickTrack
        team will get back to you.
      </p>

      {status === 'sent' ? (
        <div className="mt-8 flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Thanks, your message is on its way.</p>
            <p className="text-sm text-slate-400 mt-1">
              We will reply to the email address on your account.
            </p>
            <Button
              variant="ghost"
              className="mt-3 text-emerald-400 hover:text-emerald-300 px-0"
              onClick={() => setStatus('idle')}
            >
              Send another message
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 md:p-6"
        >
          <div>
            <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-400 mb-1.5">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="What is your message about?"
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-medium text-slate-400 mb-1.5">
              Message
            </label>
            <textarea
              id="contact-message"
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Tell us how we can help"
              className={fieldClass}
              required
            />
          </div>

          {status === 'error' && (
            <div className="flex items-start gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={status === 'sending' || !message.trim()}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-medium shadow-lg shadow-emerald-500/25"
          >
            {status === 'sending' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Sending
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send message
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}