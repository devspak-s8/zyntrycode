import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Walkthrough } from "./components/Walkthrough";
import { Features } from "./components/Features";
import { Environments } from "./components/Environments";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Walkthrough />
        <Features />
        <Environments />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
