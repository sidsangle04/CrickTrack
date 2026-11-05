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

        <section className="rounded-2xl bg-slate-800/40 border border-slate-700/50 p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 mb-5">
            Founder's Note
          </p>

          <img
            src="https://base44.app/api/apps/69cd6e7dda99287bd2ab65f2/files/mp/public/69cd6e7dda99287bd2ab65f2/39b660479_siddhesh-sangle.png"
            alt="Siddhesh Manoj Sangle, founder and developer of CrickTrack"
            className="w-32 md:w-40 aspect-[4/5] rounded-2xl object-cover mb-6"
          />

          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-5">
            My Story, Why I Built CrickTrack
          </h2>

          <div className="space-y-4">
            <p>Hi, I'm Siddhesh Manoj Sangle, Founder and Developer of CrickTrack.</p>
            <p>
              My journey in sports analytics has given me the opportunity to work with different sports
              analysis platforms and technologies. Through my experience, I have seen how much of a
              difference performance analysis and data can make in helping coaches understand their
              players, identify strengths and weaknesses, and make better decisions.
            </p>
            <p>But during this journey, I also noticed something that always stayed with me.</p>
            <p>
              There are so many talented players, passionate coaches, and promising cricket clubs that
              have the potential to achieve great things. However, many of them don't have access to
              proper performance analysis tools because professional sports analysis software can be
              very expensive.
            </p>
            <p>
              I have worked with several established analysis platforms, and I understand the value they
              bring to professional teams. But I also realised that the grassroots cricket community
              deserves access to these kinds of technologies. A talented young player playing for a
              small academy should also have the opportunity to understand their performance and
              identify areas where they can improve.
            </p>
            <p>
              I kept thinking about this, and eventually I decided to build something of my own.
            </p>
            <p className="text-lg font-semibold text-emerald-400">
              That's how CrickTrack was born.
            </p>
            <p>
              I built CrickTrack with one simple intention: to make cricket performance analysis
              accessible to everyone, not just professional teams or organisations with large budgets.
            </p>
            <p>
              Through CrickTrack, I want coaches, clubs, academies, and individual players to be able to
              analyse matches, understand performances, identify patterns, and use data to support
              player development.
            </p>
            <p>
              My intention is to make the platform freely accessible so that financial limitations don't
              become a barrier for people who want to learn, analyse, and improve.
            </p>
            <p>
              For me, this is not just about building another software product or creating a business.
              It's about giving something back to the sports community that has been such an important
              part of my professional journey.
            </p>
            <p>
              I strongly believe that talent is everywhere, but opportunities and resources are not
              always equally available. If I can build something that helps even a small cricket academy
              understand its players better, or helps a young cricketer identify an area of improvement,
              I believe that is meaningful progress.
            </p>
            <p>
              I want to continue developing CrickTrack, introducing better analytical capabilities, and
              making sports technology more accessible to the people who can benefit from it the most.
            </p>
            <p className="font-semibold text-white">
              My vision is simple: I want to make sure that every player and every club, regardless of
              their financial resources, has an opportunity to understand their performance and improve
              through data.
            </p>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-700/60 text-sm">
            <p className="font-semibold text-white">Siddhesh Manoj Sangle</p>
            <p className="text-slate-400">Founder &amp; Developer, CrickTrack</p>
            <p className="text-slate-400">Sports Analytics Researcher</p>
          </div>
        </section>
      </div>
    </div>
  );
}