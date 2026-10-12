import React, { useState } from "react";
import { Info, AlertTriangle, ChevronDown, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfRosterEditor from "./PdfRosterEditor";

const inputClass =
  "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{label}</span>
    {children}
  </label>
);

export default function PdfScorecardReview({ plan, onChange, onConfirm, onCancel, busy }) {
  const [openInnings, setOpenInnings] = useState(0);

  const setMatch = (patch) => onChange({ ...plan, match: { ...plan.match, ...patch } });
  const setInnings = (index, patch) =>
    onChange({ ...plan, innings: plan.innings.map((inn, i) => (i === index ? { ...inn, ...patch } : inn)) });

  const errors = [...plan.issues.filter((i) => i.level === "error")];
  if (!plan.match.team1Name.trim() || !plan.match.team2Name.trim()) {
    errors.push({ message: "Enter both team names before importing." });
  }
  const warnings = plan.issues.filter((i) => i.level === "warning");

  const sideName = (inn) => (inn.battingTeam === "team1" ? plan.match.team1Name : plan.match.team2Name);

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 mb-6">
      <h2 className="text-white font-semibold mb-1">Review the extracted scorecard</h2>
      <p className="text-slate-400 text-xs mb-4">
        Correct anything the reader got wrong, then import.
      </p>

      {plan.hasBallByBall ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-5">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Ball-by-ball commentary found, and it adds up to the scorecard:{" "}
            {plan.innings
              .map((inn) => `${inn.deliveries.length} deliveries in innings ${inn.number}`)
              .join(", ")}
            . Delivery-level analytics will be available for this match.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-5">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            A printed scorecard has no ball-by-ball log. Innings totals, batting, bowling, extras and the
            result are imported — delivery-level analytics will not be available for this match.
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-2 mb-5">
          {errors.map((e, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{e.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <Field label="Team 1 (batted first)">
          <input
            type="text"
            value={plan.match.team1Name}
            onChange={(e) => setMatch({ team1Name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Team 2">
          <input
            type="text"
            value={plan.match.team2Name}
            onChange={(e) => setMatch({ team2Name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={plan.match.date}
            onChange={(e) => setMatch({ date: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Venue">
          <input
            type="text"
            value={plan.match.venue}
            onChange={(e) => setMatch({ venue: e.target.value })}
            placeholder="Ground name"
            className={inputClass}
          />
        </Field>
        <Field label="Overs per innings">
          <input
            type="number"
            value={plan.match.oversPerInnings}
            onChange={(e) => setMatch({ oversPerInnings: parseInt(e.target.value, 10) || 0 })}
            className={inputClass}
          />
        </Field>
        <Field label="Result">
          <input
            type="text"
            value={plan.match.result}
            onChange={(e) => setMatch({ result: e.target.value })}
            placeholder="e.g. EMCC won by 4 wickets"
            className={inputClass}
          />
        </Field>
      </div>

      {plan.innings.map((inn, index) => (
        <div key={index} className="rounded-xl border border-slate-700/50 bg-slate-900/40 mb-4 overflow-hidden">
          <button
            type="button"
            onClick={() => setOpenInnings(openInnings === index ? -1 : index)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-800/40 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">
                Innings {inn.number} — {sideName(inn)}
              </p>
              <p className="text-slate-400 text-xs">
                {inn.runs}/{inn.wickets} ({inn.overs} ov) · {inn.batters.length} batters ·{" "}
                {inn.bowlers.length} bowlers
                {inn.deliveries?.length ? ` · ${inn.deliveries.length} deliveries` : ""}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                openInnings === index ? "rotate-180" : ""
              }`}
            />
          </button>

          {openInnings === index && (
            <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <Field label="Runs">
                  <input
                    type="number"
                    value={inn.runs}
                    onChange={(e) => setInnings(index, { runs: parseInt(e.target.value, 10) || 0 })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Wickets">
                  <input
                    type="number"
                    value={inn.wickets}
                    onChange={(e) => setInnings(index, { wickets: parseInt(e.target.value, 10) || 0 })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Overs">
                  <input
                    type="text"
                    value={inn.overs}
                    onChange={(e) => setInnings(index, { overs: e.target.value })}
                    placeholder="34.1"
                    className={inputClass}
                  />
                </Field>
                <Field label="Byes">
                  <input
                    type="number"
                    value={inn.extras.byes}
                    onChange={(e) =>
                      setInnings(index, {
                        extras: { ...inn.extras, byes: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Leg byes">
                  <input
                    type="number"
                    value={inn.extras.leg_byes}
                    onChange={(e) =>
                      setInnings(index, {
                        extras: { ...inn.extras, leg_byes: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Wides">
                  <input
                    type="number"
                    value={inn.extras.wides}
                    onChange={(e) =>
                      setInnings(index, {
                        extras: { ...inn.extras, wides: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="No balls">
                  <input
                    type="number"
                    value={inn.extras.no_balls}
                    onChange={(e) =>
                      setInnings(index, {
                        extras: { ...inn.extras, no_balls: parseInt(e.target.value, 10) || 0 },
                      })
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <PdfRosterEditor innings={inn} onChange={(next) => setInnings(index, next)} />
            </div>
          )}
        </div>
      ))}

      {warnings.length > 0 && (
        <div className="space-y-2 mb-5">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{w.message}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onConfirm}
          disabled={busy || errors.length > 0}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
        >
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Import this match
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}