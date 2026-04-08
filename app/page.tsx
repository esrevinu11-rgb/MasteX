import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { RankShowcase } from "@/components/landing/rank-showcase";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <RankShowcase />
      <Pricing />
      <Footer />
    </main>
  );
}
