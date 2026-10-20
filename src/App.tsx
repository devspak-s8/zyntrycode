import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { Walkthrough } from "./components/Walkthrough";
import { Features } from "./components/Features";
import { Demo } from "./components/Demo";
import { Environments } from "./components/Environments";
import { Benefits } from "./components/Benefits";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Walkthrough />
        <Features />
        <Demo />
        <Environments />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
