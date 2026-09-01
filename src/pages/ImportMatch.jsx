import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, ArrowLeft, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useGroundShape } from "@/lib/GroundShapeContext";
import { parseCSVText, parseHTMLScorecard } from "@/lib/playCricketParse";
import { writeImportedMatch } from "@/lib/playCricketImport";

export default function ImportMatch() {
  const navigate = useNavigate();
  const { mode } = useGroundShape();
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [log, setLog] = useState([]);
  const [error, setError] = useState("");

  const addLog = (msg) => setLog((prev) => [...prev, msg]);
  const working = status === "working" || fetching;

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetching(true);
    setLog([]);
    setError("");
    setStatus("working");
    addLog("🌐 Fetching scorecard from Play-Cricket…");
    try {
      const res = await base44.functions.invoke("importPlayCricketMatch", { url: url.trim() });
      const payload = res.data || {};
      if (payload.error === "NO_API_KEY") {
        setError(payload.message);
        setStatus("error");
      } else if (payload.error) {
        setError(payload.message || payload.error);
        setStatus("error");
      } else {
        addLog("✅ Scorecard fetched from Play-Cricket API");
        await writeImportedMatch(payload.data, mode, addLog);
        setStatus("done");
      }
    } catch (e) {
      setError(e.message || "Fetch failed.");
      setStatus("error");
    } finally {
      setFetching(false);
    }
  };

  const handleFile = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    const ext = selected.name.split(".").pop().toLowerCase();
    if (!["csv", "html", "htm"].includes(ext)) {
      setError("Please upload a Play-Cricket CSV or saved-HTML scorecard.");
      setFile(null);
      return;
    }
    setFile(selected);
    setLog([]);
    setStatus("idle");
    setError("");
  };

  const importFile = async () => {
    if (!file) return;
    setStatus("working");
    setLog([]);
    setError("");
    try {
      const text = await file.text();
      const ext = file.name.split(".").pop().toLowerCase();
      const data = ext === "csv" ? parseCSVText(text) : parseHTMLScorecard(text);
      addLog(`✅ Parsed match: ${data.team1Name} vs ${data.team2Name}`);
      addLog(`📅 Date: ${data.matchDate} | Ground: ${data.ground}`);
      await writeImportedMatch(data, mode, addLog);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Import failed.");
      setStatus("error");
    }
  };

  const reset = () => {
    setFile(null);
    setUrl("");
    setLog([]);
    setStatus("idle");
    setError("");
  };

  return (
    <div className="pb-24 md:pb-6">
      <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Matches
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Import Match Data</h1>
        <p className="text-slate-400 text-sm">Pull a completed match from Play-Cricket by URL, or upload a CSV/HTML scorecard. Imports teams, players, scorecards and a reconstructed ball-by-ball feed for analytics.</p>
      </div>

      {/* URL import */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-400" />
          Import from Play-Cricket URL
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://emcc.play-cricket.com/website/results/7747683"
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Button
            onClick={handleFetchUrl}
            disabled={working || !url.trim()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold sm:w-auto"
          >
            {fetching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Fetch from URL
          </Button>
        </div>
        <p className="text-slate-500 text-xs mt-2">Needs a Play-Cricket club API key (PLAY_CRICKET_API_KEY secret). Without it, use the file upload below.</p>
      </div>

      {/* File upload */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
        <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-emerald-400" />
          Upload Scorecard File
        </h2>
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors group">
          <Upload className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 mb-3 transition-colors" />
          <span className="text-slate-400 group-hover:text-white transition-colors font-medium">
            {file ? file.name : "Click to upload CSV or HTML file"}
          </span>
          <span className="text-slate-600 text-sm mt-1">Play-Cricket CSV or saved results-page HTML</span>
          <input type="file" accept=".csv,.html,.htm" className="hidden" onChange={handleFile} />
        </label>

        {file && status === "idle" && (
          <Button
            onClick={importFile}
            className="mt-4 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
          >
            <FileText className="w-4 h-4 mr-2" />
            Import Match Data
          </Button>
        )}
      </div>

      {log.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            {working ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : status === "done" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400" />
            )}
            Import Log
          </h3>
          <div className="space-y-1 font-mono text-sm">
            {log.map((l, i) => (
              <div key={i} className="text-slate-300">{l}</div>
            ))}
          </div>
          {status === "done" && (
            <div className="mt-4 flex gap-3">
              <Button onClick={() => navigate(createPageUrl("Home"))} className="flex-1 bg-emerald-500 hover:bg-emerald-600">
                View in Matches
              </Button>
              <Button variant="outline" onClick={reset} className="flex-1 border-slate-600">
                Import Another
              </Button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}