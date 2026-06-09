import { Navbar } from '@/components/landing/navbar';
import { Hero } from '@/components/landing/hero';
import { Logos } from '@/components/landing/logos';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FAQ } from '@/components/landing/faq';
import { CTA } from '@/components/landing/cta';
import { Footer } from '@/components/landing/footer';

export const metadata = {
  title: 'SEO Optimizer — AI-Powered Multi-Agent SEO Analysis',
  description: 'Paste a URL. Eight specialized AI agents analyze your site in parallel and deliver a prioritized action plan in under 60 seconds.',
};

export default function LandingPage() {
  return (
    <div className="bg-[#020202] min-h-screen">
      <Navbar />
      <Hero />
      <Logos />
      <FeaturesSection />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
