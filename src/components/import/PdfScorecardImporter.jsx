import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useGroundShape } from "@/lib/GroundShapeContext";
import { normalizePdfScorecard, PDF_EXTRACT_SCHEMA } from "@/lib/pdfScorecardNormalize";
import { writePdfScorecardMatch } from "@/lib/pdfScorecardImport";
import { writeBallByBallMatch } from "@/lib/ballByBallImport";
import { attachPdfDeliveries, pdfDeliverySchema } from "@/lib/pdfDeliveryParse";
import PdfScorecardDropzone from "./PdfScorecardDropzone";
import PdfScorecardReview from "./PdfScorecardReview";

export default function PdfScorecardImporter() {
  const navigate = useNavigate();
  const { mode } = useGroundShape();
  const [status, setStatus] = useState("idle"); // idle | reading | review | importing | done | error
  const [file, setFile] = useState(null);
  const [plan, setPlan] = useState(null);
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");
  const [matchId, setMatchId] = useState("");
  const [progress, setProgress] = useState("");

  const busy = status === "reading" || status === "importing";
  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleSelect = async (selected) => {
    setFile(selected);
    setStatus("reading");
    setProgress("Uploading the PDF…");
    setError("");
    setLog([]);
    try {
      // The scorecard is stored privately, then read through a short-lived link.
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: selected });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri,
        expires_in: 900,
      });
      setProgress("Reading the scorecard…");
      const res = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: signed_url,
        json_schema: PDF_EXTRACT_SCHEMA,
      });
      if (res?.status !== "success") {
        throw new Error(res?.details || "The scorecard could not be read from that PDF.");
      }
      const raw = Array.isArray(res.output) ? res.output[0] : res.output;
      let nextPlan = normalizePdfScorecard(raw);

      // A full match PDF carries the ball-by-ball commentary as well, so read
      // both innings and keep the log only if it adds up to the scorecard.
      // The flag is only a hint, so the commentary is always tried.
      {
        setProgress("Reading the ball-by-ball commentary…");
        const [first, second] = await Promise.all(
          [1, 2].map((which) =>
            base44.integrations.Core.ExtractDataFromUploadedFile({
              file_url: signed_url,
              json_schema: pdfDeliverySchema(which),
            })
          )
        );
        const outputOf = (r) => (Array.isArray(r?.output) ? r.output[0] : r?.output);
        nextPlan = attachPdfDeliveries(nextPlan, [outputOf(first), outputOf(second)], !!raw?.has_ball_by_ball);
      }

      setPlan(nextPlan);
      setStatus("review");
    } catch (e) {
      setError(e.message || "Could not read that PDF.");
      setStatus("error");
    }
  };

  const confirmImport = async () => {
    if (!plan) return;
    setStatus("importing");
    setLog([]);
    setError("");
    try {
      const { matchId: id } = plan.hasBallByBall
        ? await writeBallByBallMatch(plan, mode, addLog)
        : await writePdfScorecardMatch(plan, mode, addLog);
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
      <PdfScorecardDropzone file={file} busy={busy} onSelect={handleSelect} onClear={reset} />

      {status === "reading" && (
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6 text-slate-300 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
          {progress || `Reading ${file?.name}…`}
        </div>
      )}

      {status === "review" && plan && (
        <PdfScorecardReview
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
              View Scorecard
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