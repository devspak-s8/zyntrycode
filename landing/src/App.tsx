import { useRoute } from "./router";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Walkthrough } from "./components/Walkthrough";
import { Features } from "./components/Features";
import { Environments } from "./components/Environments";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";
import { HowItWorks } from "./pages/how-it-works";
import { FeaturesPage } from "./pages/features";
import { EnvironmentsPage } from "./pages/environments";
import { Docs } from "./pages/docs";
import { Routing } from "./pages/routing";
import { ExtensionPage } from "./pages/extension";
import { GetStarted } from "./pages/get-started";
import { SignIn } from "./pages/sign-in";
import { Contact } from "./pages/contact";
import { SecurityPage } from "./pages/security";

export default function App() {
  const route = useRoute();

  if (route === "how-it-works") return <HowItWorks />;
  if (route === "features") return <FeaturesPage />;
  if (route === "environments") return <EnvironmentsPage />;
  if (route === "docs") return <Docs />;
  if (route === "routing") return <Routing />;
  if (route === "extension") return <ExtensionPage />;
  if (route === "get-started") return <GetStarted />;
  if (route === "sign-in") return <SignIn />;
  if (route === "contact") return <Contact />;
  if (route === "security") return <SecurityPage />;

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