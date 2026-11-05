import React, { useCallback } from 'react';
import LandingHero from '@/components/landing/LandingHero';
import LandingNav from '@/components/landing/LandingNav';
import LandingScrollMenu from '@/components/landing/LandingScrollMenu';
import PhotoRoll from '@/components/landing/PhotoRoll';
import LandingGrassroots from '@/components/landing/LandingGrassroots';
import LandingOverview from '@/components/landing/LandingOverview';
import LandingStats from '@/components/landing/LandingStats';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingInsights from '@/components/landing/LandingInsights';
import LandingCommunity from '@/components/landing/LandingCommunity';

export default function Landing() {
  const handleExplore = useCallback(() => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="pb-24 md:pb-6">
      <LandingHero onExplore={handleExplore} />
      <LandingNav />
      <PhotoRoll />
      <LandingGrassroots />
      <LandingOverview />
      <LandingStats />
      <LandingFeatures />
      <LandingInsights />
      <LandingCommunity />
      <LandingScrollMenu />
    </div>
  );
}