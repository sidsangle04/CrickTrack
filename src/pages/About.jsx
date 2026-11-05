import React from 'react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
        About CrickTrack
      </h1>
      <p className="mt-3 text-slate-400">Tag | Analyse | Elevate</p>

      <div className="mt-8 space-y-8 text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-2">What CrickTrack does</h2>
          <p>
            CrickTrack is a ball-by-ball cricket scoring engine built for live matches. It lets you
            score a game as it happens, then turns every delivery into something you can learn from.
            Alongside the running scorecard it records where the ball pitched, where the shot was
            played and how each batter and bowler performed, so a finished match becomes a full set of
            batting, bowling, partnership and pitch-zone analytics rather than a page of numbers.
            Completed matches and official Play-Cricket scorecards can also be imported, so a club's
            history sits alongside the games it scores itself.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Who it is for</h2>
          <p>
            It is made for club and school coaches, captains, scorers, analysts and anyone who wants
            more from a scorebook than runs and wickets. TURF and Standard modes let the same app serve
            outdoor rectangular grounds and smaller circular formats, with each mode keeping its own
            teams, players and statistics. Tournament tools handle round-robin leagues, knockout
            brackets and net run rate calculations without a spreadsheet. Each account keeps its own
            matches, squads and ground data, so neighbouring clubs can use the app without ever seeing
            each other's records.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-2">Who builds it</h2>
          <p>
            CrickTrack is built and maintained by an independent team of cricket players, coaches and
            software engineers who wanted scoring software that reflected how the game is actually
            analysed at club level. We build it alongside the people who use it every weekend, and
            most features start as a problem a scorer or coach brought to us after a match.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 rounded-2xl bg-slate-800/60 border border-slate-700/50 p-5">
            <img
              src="https://base44.app/api/apps/69cd6e7dda99287bd2ab65f2/files/mp/public/69cd6e7dda99287bd2ab65f2/39b660479_siddhesh-sangle.png"
              alt="Siddhesh Sangle, founder of CrickTrack"
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover shrink-0"
            />
            <div className="text-center sm:text-left">
              <p className="text-lg font-semibold text-white">Siddhesh Sangle</p>
              <p className="text-sm font-medium text-emerald-400 mb-2">Founder &amp; Developer</p>
              <p className="text-sm text-slate-400 leading-relaxed">
                Siddhesh leads CrickTrack's scoring engine and analytics, working with club scorers
                and coaches to turn every delivery into something a team can learn from.
              </p>
            </div>
          </div>

          <p className="mt-3">
            Have a question, a bug to report or an idea for the next release?{' '}
            <Link to="/Contact" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Get in touch with the team
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}