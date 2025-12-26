import { useState } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout currentPage="/privacy">
      <div className="p-4 space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-display">Privacy Policy</h1>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-muted-foreground">
          <p className="text-sm">
            <strong>Last Updated:</strong> January 1, 2026
          </p>

          <section>
            <h2 className="text-lg font-display text-foreground">1. Introduction</h2>
            <p>
              Welcome to Dharma AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Account information (email, name)</li>
              <li>Spiritual journey data (meditation sessions, journal entries, quest completions)</li>
              <li>Voice recordings (if you use the Voice Log feature)</li>
              <li>Usage data and app interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain our services</li>
              <li>Personalize your spiritual journey experience</li>
              <li>Track your progress and achievements</li>
              <li>Send you notifications and reminders (with your consent)</li>
              <li>Improve our app and develop new features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">4. Data Storage & Security</h2>
            <p>
              Your data is securely stored using industry-standard encryption. We use Supabase for our backend infrastructure, which provides enterprise-grade security features including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>End-to-end encryption</li>
              <li>Row Level Security (RLS) policies</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">5. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. Your spiritual journey is private and personal. We only share data with service providers who help us operate the app (e.g., cloud hosting).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">6. Children's Privacy</h2>
            <p>
              Our app is not intended for children under 13. We do not knowingly collect personal information from children under 13 years of age.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-display text-foreground">7. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-saffron font-medium">thedharmaai@gmail.com</p>
          </section>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PrivacyPolicy;
