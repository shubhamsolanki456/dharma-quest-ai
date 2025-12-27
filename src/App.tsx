import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PaywallGuard } from "@/components/PaywallGuard";
import { DebugTimeSkip } from "@/components/DebugTimeSkip";
import Index from "./pages/Index";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import AIGuide from "./pages/AIGuide";
import Quests from "./pages/Quests";
import DailyShlok from "./pages/DailyShlok";
import Profile from "./pages/Profile";
import Journal from "./pages/Journal";
import Meditation from "./pages/Meditation";
import Manifestation from "./pages/Manifestation";
import MantraJaap from "./pages/MantraJaap";
import VoiceLog from "./pages/VoiceLog";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import SinLog from "./pages/SinLog";
import NotFound from "./pages/NotFound";
import Prayers from "./pages/Prayers";
import StartFreeTrial from "./pages/StartFreeTrial";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <PaywallGuard>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              
              {/* Auth required routes */}
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/start-free-trial" element={<StartFreeTrial />} />
              <Route path="/start-trial" element={<StartFreeTrial />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              
              {/* Protected routes (subscription required) */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ai-guide" element={<AIGuide />} />
              <Route path="/quests" element={<Quests />} />
              <Route path="/daily-shlok" element={<DailyShlok />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/meditation" element={<Meditation />} />
              <Route path="/manifestation" element={<Manifestation />} />
              <Route path="/mantra-jaap" element={<MantraJaap />} />
              <Route path="/voice-log" element={<VoiceLog />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/sin-log" element={<SinLog />} />
              <Route path="/prayers" element={<Prayers />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PaywallGuard>
          <DebugTimeSkip />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
