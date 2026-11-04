import React, { useState } from "react";
import { Lock, Users, Loader2 } from "lucide-react";
import { setMatchVisibility, isShared } from "@/lib/matchVisibility";

// Private/shared state of one match. The creator and admins get a button to
// flip it; everyone else who can see the match sees a read-only badge.
export default function MatchVisibilityControl({ match, canManage, onChanged }) {
  const shared = isShared(match);
  const [saving, setSaving] = useState(false);

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;
    setSaving(true);
    try {
      await setMatchVisibility(match.id, shared ? "private" : "shared");
      if (onChanged) onChanged(match.id, shared ? "private" : "shared");
    } finally {
      setSaving(false);
    }
  };

  const styles = shared
    ? "bg-sky-500/15 text-sky-300 border-sky-500/40"
    : "bg-slate-800 text-slate-400 border-slate-700";

  const label = shared ? "Shared" : "Private";
  const Icon = shared ? Users : Lock;

  if (!canManage) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border ${styles}`}
        title={shared ? "Any signed-in user can view this match" : "Only you and admins can see this match"}
      >
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors hover:brightness-125 disabled:opacity-60 ${styles}`}
      title={
        shared
          ? "Shared — anyone signed in can view. Tap to make private."
          : "Private — only you and admins. Tap to share with everyone."
      }
    >
      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  );
}