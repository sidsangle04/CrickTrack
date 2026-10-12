import React from "react";
import { X } from "lucide-react";

const inputClass =
  "w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500";

const Head = ({ children, className = "" }) => (
  <th className={`px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
    {children}
  </th>
);

function TextCell({ value, onChange }) {
  return (
    <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />
  );
}

function NumCell({ value, onChange, width = "w-14" }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={`${inputClass} ${width} text-center`}
    />
  );
}

export default function PdfRosterEditor({ innings, onChange }) {
  const setBatter = (i, patch) =>
    onChange({ ...innings, batters: innings.batters.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  const removeBatter = (i) =>
    onChange({ ...innings, batters: innings.batters.filter((_, idx) => idx !== i) });

  const setBowler = (i, patch) =>
    onChange({ ...innings, bowlers: innings.bowlers.map((b, idx) => (idx === i ? { ...b, ...patch } : b)) });
  const removeBowler = (i) =>
    onChange({ ...innings, bowlers: innings.bowlers.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Batting</p>
        {innings.batters.length === 0 ? (
          <p className="text-slate-500 text-xs">No batting rows were read from the PDF.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[620px] border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <Head>Batter</Head>
                  <Head>How out</Head>
                  <Head className="w-14 text-center">R</Head>
                  <Head className="w-14 text-center">B</Head>
                  <Head className="w-14 text-center">4s</Head>
                  <Head className="w-14 text-center">6s</Head>
                  <Head className="w-8" />
                </tr>
              </thead>
              <tbody>
                {innings.batters.map((b, i) => (
                  <tr key={i}>
                    <td className="pr-1 w-[22%]">
                      <TextCell value={b.name} onChange={(v) => setBatter(i, { name: v })} />
                    </td>
                    <td className="pr-1">
                      <TextCell value={b.how_out} onChange={(v) => setBatter(i, { how_out: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.runs} onChange={(v) => setBatter(i, { runs: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.balls} onChange={(v) => setBatter(i, { balls: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.fours} onChange={(v) => setBatter(i, { fours: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.sixes} onChange={(v) => setBatter(i, { sixes: v })} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeBatter(i)}
                        className="p-1 rounded text-slate-600 hover:text-red-400"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Bowling</p>
        {innings.bowlers.length === 0 ? (
          <p className="text-slate-500 text-xs">No bowling rows were read from the PDF.</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[520px] border-separate border-spacing-y-1">
              <thead>
                <tr>
                  <Head>Bowler</Head>
                  <Head className="w-16 text-center">O</Head>
                  <Head className="w-14 text-center">M</Head>
                  <Head className="w-14 text-center">R</Head>
                  <Head className="w-14 text-center">W</Head>
                  <Head className="w-8" />
                </tr>
              </thead>
              <tbody>
                {innings.bowlers.map((b, i) => (
                  <tr key={i}>
                    <td className="pr-1">
                      <TextCell value={b.name} onChange={(v) => setBowler(i, { name: v })} />
                    </td>
                    <td className="pr-1">
                      <input
                        type="text"
                        value={b.overs ?? ""}
                        onChange={(e) => setBowler(i, { overs: e.target.value })}
                        className={`${inputClass} w-16 text-center`}
                        placeholder="0.0"
                      />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.maidens} onChange={(v) => setBowler(i, { maidens: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.runs} onChange={(v) => setBowler(i, { runs: v })} />
                    </td>
                    <td className="pr-1">
                      <NumCell value={b.wickets} onChange={(v) => setBowler(i, { wickets: v })} />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => removeBowler(i)}
                        className="p-1 rounded text-slate-600 hover:text-red-400"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}