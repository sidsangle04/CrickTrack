import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const field =
  "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500";

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      />
    </label>
  );
}

export default function BallByBallReview({ plan, onChange, onConfirm, onCancel, busy }) {
  const errors = plan.issues.filter((i) => i.level === "error");
  const warnings = plan.issues.filter((i) => i.level === "warning");
  const setMatch = (key, value) => onChange({ ...plan, match: { ...plan.match, [key]: value } });
  const setBattingTeam = (index, side) =>
    onChange({ ...plan, innings: plan.innings.map((inn, i) => (i === index ? { ...inn, battingTeam: side } : inn)) });

  const totalDeliveries = plan.summaries.reduce((s, i) => s + i.balls, 0);
  const teamName = (side) => plan.match[side === "team1" ? "team1Name" : "team2Name"] || side;

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-emerald-500/30 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        <h2 className="text-white font-semibold">Review before importing</h2>
      </div>
      <p className="text-slate-400 text-xs mb-5">
        Read from {plan.fileName}
        {plan.sourceSheet ? ` · sheet “${plan.sourceSheet}”` : ""} · {totalDeliveries} deliveries across{" "}
        {plan.innings.length} innings
      </p>

      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2 mb-5">
          {errors.map((issue, i) => (
            <div key={`e${i}`} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
          {warnings.map((issue, i) => (
            <div key={`w${i}`} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Field label="Team 1" value={plan.match.team1Name} onChange={(v) => setMatch("team1Name", v)} placeholder="Team 1" />
        <Field label="Team 2" value={plan.match.team2Name} onChange={(v) => setMatch("team2Name", v)} placeholder="Team 2" />
        <Field label="Date" type="date" value={plan.match.date} onChange={(v) => setMatch("date", v)} />
        <Field label="Venue" value={plan.match.venue} onChange={(v) => setMatch("venue", v)} placeholder="Ground name" />
        <Field
          label="Overs per innings"
          type="number"
          value={plan.match.oversPerInnings}
          onChange={(v) => setMatch("oversPerInnings", parseFloat(v) || 0)}
        />
        <label className="block">
          <span className="block text-xs font-medium text-slate-400 mb-1.5">Ball type</span>
          <select
            value={plan.match.ballType}
            onChange={(e) => setMatch("ballType", e.target.value)}
            className={field}
          >
            <option value="leather">Leather</option>
            <option value="tennis">Tennis</option>
            <option value="tape">Tape</option>
          </select>
        </label>
      </div>

      <h3 className="text-white font-semibold text-sm mb-3">Innings</h3>
      <div className="space-y-3 mb-6">
        {plan.innings.map((inn, index) => {
          const s = plan.summaries[index];
          return (
            <div key={index} className="p-4 rounded-xl bg-slate-900 border border-slate-700">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-sm font-medium text-white">Innings {inn.number}</span>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-800">
                  {["team1", "team2"].map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => setBattingTeam(index, side)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        inn.battingTeam === side
                          ? "bg-emerald-500 text-white"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {teamName(side)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                <span className="text-white font-semibold text-sm">
                  {s.runs}/{s.wickets}
                </span>
                <span>{s.balls} balls · {s.overs} overs</span>
                <span>{s.fours} fours · {s.sixes} sixes</span>
                <span>
                  Extras: {s.extras.wides + s.extras.no_balls + s.extras.byes + s.extras.leg_byes + s.extras.penalty}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onConfirm}
          disabled={busy || errors.length > 0}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Import Match
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Choose a different file
        </Button>
      </div>
    </div>
  );
}