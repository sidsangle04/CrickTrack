import React from "react";
import { Upload, FileText, X } from "lucide-react";

export default function PdfScorecardDropzone({ file, busy, onSelect, onClear }) {
  const handleChange = (e) => {
    const selected = e.target.files[0];
    if (selected) onSelect(selected);
    e.target.value = "";
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6">
      <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-400" />
        Play-Cricket PDF Scorecard
      </h2>

      <p className="text-slate-400 text-xs mb-4">
        The printed results page saved as a PDF. Innings totals, batting and bowling figures, extras
        and the result are read from it. A printed scorecard has no ball-by-ball log, so delivery
        analytics stay empty for the match.
      </p>

      {file ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
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
            Click to upload a PDF scorecard
          </span>
          <span className="text-slate-600 text-xs mt-1">.pdf</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleChange}
            disabled={busy}
          />
        </label>
      )}
    </div>
  );
}