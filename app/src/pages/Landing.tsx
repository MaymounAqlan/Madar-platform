import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { LandingHero } from '@/components/landing/LandingHero';
import {
  AiFlow,
  Beneficiaries,
  DashboardShowcase,
  FeaturesGrid,
  FinalCta,
  HowItWorks,
  ProblemSolution,
  ResumeAnalysis,
  SmartMatching,
  VisionGoals,
} from '@/components/landing/LandingSections';
import { FAQSection } from '@/components/landing/FAQSection';
import { LandingStats } from '@/components/landing/LandingStats';
import '@/components/landing/landing.css';

const routeSections: Record<string, string> = {
  '/features': 'features',
  '/how-it-works': 'how-it-works',
  '/careers': 'beneficiaries',
};

export default function Landing() {
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const sectionId = routeSections[location.pathname];
    if (!sectionId) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      return;
    }
    const frame = window.requestAnimationFrame(() => scrollToSection(sectionId));
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div id="top" className="landing-page w-full overflow-x-clip">
      <LandingHero onHowItWorks={() => scrollToSection('how-it-works')} />
      <LandingStats />
      <ProblemSolution />
      <HowItWorks />
      <DashboardShowcase />
      <ResumeAnalysis />
      <SmartMatching />
      <Beneficiaries />
      <AiFlow />
      <VisionGoals />
      <FeaturesGrid />
      <FAQSection />
      <FinalCta />
    </div>
  );
}
