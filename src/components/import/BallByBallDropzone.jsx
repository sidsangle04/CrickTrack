import React from "react";
import { Upload, FileSpreadsheet, Download, X } from "lucide-react";
import { TEMPLATE_CSV } from "@/lib/ballByBallParse";

const ACCEPTED = [".csv", ".xlsx", ".xls"];

export default function BallByBallDropzone({ file, busy, onSelect, onClear }) {
  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cricktrack-ball-by-ball-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onSelect(selected);
    e.target.value = "";
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          Ball-by-Ball File (Excel or CSV)
        </h2>
        <button
          type="button"
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>

      <p className="text-slate-400 text-xs mb-4">
        One row per delivery. Batter, Non Striker and Bowler names, plus Runs — Extras, Wicket, Shot, Line and Length
        columns are used when present. Team, date and venue can sit at the top of the file or be filled in on the next step.
      </p>

      {file ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm text-white truncate">{file.name}</span>
          </div>
          {!busy && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors group">
          <Upload className="w-9 h-9 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
          <span className="text-slate-400 group-hover:text-white transition-colors font-medium text-sm">
            Click to upload an Excel or CSV file
          </span>
          <span className="text-slate-600 text-xs mt-1">{ACCEPTED.join(" · ")}</span>
          <input type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={handleChange} disabled={busy} />
        </label>
      )}
    </div>
  );
}