import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGroundShape } from "@/lib/GroundShapeContext";
import { buildImportPlan } from "@/lib/ballByBallParse";
import { writeBallByBallMatch } from "@/lib/ballByBallImport";
import BallByBallDropzone from "./BallByBallDropzone";
import BallByBallReview from "./BallByBallReview";

export default function BallByBallImporter() {
  const navigate = useNavigate();
  const { mode } = useGroundShape();
  const [status, setStatus] = useState("idle"); // idle | parsing | review | importing | done | error
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");
  const [matchId, setMatchId] = useState("");

  const busy = status === "parsing" || status === "importing";
  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleSelect = async (selected) => {
    setFile(selected);
    setStatus("parsing");
    setError("");
    setLog([]);
    try {
      const built = await buildImportPlan(selected);
      setPlan(built);
      setStatus("review");
    } catch (e) {
      setError(e.message || "Could not read that file.");
      setStatus("error");
    }
  };

  const confirmImport = async () => {
    if (!plan) return;
    setStatus("importing");
    setLog([]);
    setError("");
    try {
      const { matchId: id } = await writeBallByBallMatch(plan, mode, addLog);
      setMatchId(id);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Import failed.");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setPlan(null);
    setLog([]);
    setError("");
    setMatchId("");
    setStatus("idle");
  };

  return (
    <>
      <BallByBallDropzone
        file={file}
        busy={busy}
        onSelect={handleSelect}
        onClear={reset}
      />

      {status === "parsing" && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6 text-slate-300 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          Reading {file?.name}…
        </div>
      )}

      {status === "review" && plan && (
        <BallByBallReview
          plan={plan}
          onChange={setPlan}
          onConfirm={confirmImport}
          onCancel={reset}
          busy={busy}
        />
      )}

      {status === "importing" && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700/50 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            Importing match
          </h3>
          <div className="space-y-1 font-mono text-sm">
            {log.map((l, i) => (
              <div key={i} className="text-slate-300">{l}</div>
            ))}
          </div>
        </div>
      )}

      {status === "done" && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-emerald-500/30 mb-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Match imported
          </h3>
          <div className="space-y-1 font-mono text-sm mb-4">
            {log.map((l, i) => (
              <div key={i} className="text-slate-300">{l}</div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(createPageUrl("Scorecard") + `?matchId=${matchId}`)}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
            >
              View Scorecard & Report
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="flex-1 border-slate-600 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Import Another
            </Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </>
  );
}