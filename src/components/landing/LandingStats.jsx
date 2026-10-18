import React from 'react';
import Reveal from '@/components/landing/Reveal';
import CountUpStat from '@/components/landing/CountUpStat';

const STATS = [
  { value: 2, suffix: '', label: 'Scoring modes', hint: 'TURF and Standard, kept apart' },
  { value: 11, suffix: '', label: 'Players per side', hint: 'Squads, roles and bowling styles' },
  { value: 10, suffix: '+', label: 'Live analytics views', hint: 'Wagon wheel to worm graph' },
  { value: 8, suffix: '', label: 'Wagon-wheel zones', hint: 'Every scoring area tagged' },
];

export default function LandingStats() {
  return (
    <section className="pb-2 pt-6 md:pt-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-700/40 lg:grid-cols-4">
        {STATS.map((stat, index) => (
          <Reveal key={stat.label} delay={index * 0.09} className="bg-slate-900/70 px-6 py-7">
            <div className="flex items-baseline bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-4xl">
              <CountUpStat value={stat.value} />
              {stat.suffix && <span>{stat.suffix}</span>}
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{stat.hint}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}