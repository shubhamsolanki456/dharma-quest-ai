import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout currentPage="/terms">
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display">Terms of Service</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p className="text-sm">
            <strong>Last Updated:</strong> January 1, 2026
          </p>

          <section>
            <h2 className="text-lg font-display text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Dharma AI, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">2. Description of Service</h2>
            <p>
              Dharma AI is a spiritual guidance and habit-tracking application that provides:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>AI-powered scripture insights from Hindu texts</li>
              <li>Daily spiritual quests and habit tracking</li>
              <li>Meditation and journaling tools</li>
              <li>Mantra chanting features</li>
              <li>Progress tracking through Dharma Points</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the app for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with other users' enjoyment of the app</li>
              <li>Upload harmful or malicious content</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">5. Subscription & Payments</h2>
            <p>
              Some features of Dharma AI require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pay all applicable fees for the chosen plan</li>
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>Refund policies as outlined in the subscription terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">6. Intellectual Property</h2>
            <p>
              All content, features, and functionality of Dharma AI are owned by us and protected by copyright, trademark, and other intellectual property laws. The spiritual scriptures and traditional texts quoted are attributed to their original sources.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">7. Disclaimer</h2>
            <p>
              Dharma AI provides spiritual guidance for educational and self-improvement purposes only. We are not a substitute for professional medical, psychological, or religious advice. Always consult qualified professionals for specific concerns.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, Dharma AI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes through the app or via email.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p className="text-saffron font-medium">thedharmaai@gmail.com</p>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
};

export default TermsOfService;
