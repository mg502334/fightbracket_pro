import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Shield, AlertTriangle, FileText, BookOpen } from 'lucide-react';

export type StaticPageId = 'help' | 'privacy' | 'disclaimer' | 'terms';

interface TermsOfServiceModalProps {
  pageId: StaticPageId | null;
  onClose: () => void;
  theme: any;
}

const STATIC_DOCS: Record<StaticPageId, { title: string; icon: any; content: string }> = {
  help: {
    title: "HELP & SUPPORT CENTER",
    icon: HelpCircle,
    content: `
# Help & Support Center

## For Players
### How do I know when my match is ready?
When a Tournament Organizer (TO) assigns your match to a setup, you will see your station number update live on your bracket dashboard. If you opted in, you will also receive a text message with your station number.

### How do I report my score?
Once your match concludes, click the report link on your dashboard or in your SMS notification. Enter the final score and submit. If your opponent submits the same score, the bracket updates automatically.

## For Tournament Organizers
### A player reported the wrong score. How do I fix it?
If players enter conflicting scores, a red alert will appear on your TO Dashboard. Click the alert, review the match, and override the score manually.

### How do I add physical stations/setups?
Go to your Tournament Settings panel, navigate to "Station Management," and add your available tables and setup variants (e.g., Table 1 - Setup A, Table 1 - Setup B).
`
  },
  privacy: {
    title: "PRIVACY POLICY & LEGAL INFO",
    icon: Shield,
    content: `
# PRIVACY POLICY & LEGAL INFORMATION
*Last Updated: August 4, 2026*

Your privacy is important to us. This policy explains how fightbracketpro.com ("we," "our," or "the platform") collects, uses, processes, and secures your data across our cloud infrastructure. By using our platform, you agree to the practices described below.

## 1. INFORMATION WE COLLECT & INTEGRATE
* **Account & Authentication Data:** Email addresses, usernames, and encrypted passwords. If you sign in using third-party OAuth services (Google, Discord, Twitch, or Spotify), we collect your public account ID, email, and basic profile avatar as permitted by those platforms.
* **Ecosystem & Tournament Data:** 
  * Gaming Identifiers: Steam IDs and game-specific identifiers, including Tekken 8 IDs (Polaris Engine identifiers).
  * Third-Party Tournament Data: Tournament records, brackets, and seeding pulled via the start.gg API to sync your competitive history.
* **Streaming Media URLs:** User-provided links from streaming platforms (including Twitch, YouTube, Kick, and TikTok) used to broadcast live matches.
* **Messaging Service Data:** Text communications, timestamps, and routing metadata sent between users via our internal messaging system.
* **Communication Data:** Phone numbers provided voluntarily to receive automated station assignment SMS alerts.
* **Technical Logging:** IP addresses, device identifiers, and browser configurations handled automatically via our infrastructure.

## 2. HOW WE USE YOUR DATA & PRIVACY CONTROLS
We use your data strictly to power tournament bracket operations, dashboard personalization, and user communication.
* **Public vs. Private Profiles:** Users maintain full control over their visibility. By default, profiles displaying your tournament brackets, gaming IDs, and streaming links are public. You may toggle your profile settings to "Private" at any time to hide this information from public directories and search features.
* **Messaging Data:** Internal messages are used solely to facilitate tournament coordination and user interaction. We do not read or monitor private messages unless flagged for violating our Terms of Service.
* **API and Data Integration:** External data fetched from start.gg or provided via developer API keys is used exclusively to automate live match progression and player data syncing.

We never sell, rent, or trade your personal information, messages, or connected platform data to third-party advertisers.

## 3. OUR TECHNICAL INFRASTRUCTURE STACK
Your data is securely processed and synchronized across the following third-party infrastructure providers:
* **Vercel:** Securely hosts our frontend application and processes edge network traffic.
* **Neon Postgres & Supabase:** Power our primary backend databases, secure user authentication systems, and media storage networks.
* **SMS Gateways:** Phone numbers are passed to secure telecom processors strictly for match alert routing and are never shared for marketing.

## 4. DATA SECURITY & ENCRYPTION GUARANTEES
We implement strict technical and administrative safeguards to protect your personal data. 
* **Sensitive Integration Credentials:** All user-provided developer API keys and passwords are strictly encrypted at-rest using robust server-side encryption protocols.
* **Database Guardrails:** Access to our Neon and Supabase databases is protected by rigid Row-Level Security (RLS) layers to ensure users can never access or query other players' private data or credentials.

## 5. YOUR RIGHTS & DATA DELETION
You have the right to access, export, or permanently delete your account, message history, and data records at any time. To execute a complete account deletion, navigate to your Account Settings or contact our support team.
`
  },
  disclaimer: {
    title: "NON-AFFILIATION DISCLAIMER",
    icon: AlertTriangle,
    content: `
# ⚖️ Non-Affiliation & Trademark Disclaimer
Last Updated: August 4, 2026

FightBracket Pro (fightbracketpro.com) is an independent, community-driven software platform built strictly for tournament organization and management.

## 1. NO OFFICIAL LEAGUE OR PUBLISHER AFFILIATION
We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with:

* **Esports Leagues & Events:** Evolution Championship Series (Evo), Sony Interactive Entertainment, or any official competitive circuits.
* **Video Game Publishers & Franchises:** Any game developers or fighting game franchises (including but not limited to Bandai Namco Entertainment, Capcom, NetherRealm Studios, Arc System Works, or Nintendo).

## 2. NO THIRD-PARTY PLATFORM AFFILIATION
While our platform integrates third-party tools to facilitate tournament workflows, logging, streaming, and account authentication, FightBracket Pro is entirely independent and has no official corporate partnership, joint venture, or endorsement from:

* **Tournament Engines:** start.gg or its parent entities.
* **Streaming & Media Services:** Twitch, YouTube, Kick, or TikTok.
* **Authentication, OAuth, & API Providers:** Twitch, Discord, Google, or Spotify.

## 3. TRADEMARK NOTICE
All product names, company names, logos, video game titles, characters, and trademarks displayed on this website are the structural property of their respective owners. Their appearance on FightBracket Pro is for informational, organizational, and bracket tracking purposes only. Use of these names and assets does not imply any affiliation with, endorsement by, or sponsorship from the respective trademark holders.
`
  },

  terms: {
    title: "TERMS OF USE",
    icon: FileText,
    content: `
# Terms of Use

Welcome to fightbracketpro.com (the "Service"). By using our website, you agree to comply with and be bound by the following terms.

## 1. Description of Service
fightbracketpro.com provides tournament bracket management, station assignment software, and score tracking tools. 

## 2. Limitation of Liability
The Service is provided on an "as-is" and "as-available" basis. While we strive to prevent disruptions, fightbracketpro.com is not liable for any tournament delays, scoring errors, loss of tournament data, financial losses, or disputes regarding prize pools resulting from the use or failure of our software. Tournament Organizers use this tool at their own risk.

## 3. User Conduct
Users agree not to:
* Manipulate tournament scores or match outcomes fraudulently.
* Harass, threaten, or abuse other players or tournament staff.
* Deploy bots, scrapers, or automated tools that disrupt the website's infrastructure.

## 4. Account Termination
We reserve the right to suspend or terminate access to our Service at any time, without prior notice, for conduct that violates these Terms.
`
  }
};

export function TermsOfServiceModal({ pageId, onClose, theme }: TermsOfServiceModalProps) {
  if (!pageId || !STATIC_DOCS[pageId]) return null;

  const doc = STATIC_DOCS[pageId];
  const Icon = doc.icon;

  // Simple markdown renderer for clean display
  const renderFormattedContent = (rawContent: string) => {
    const lines = rawContent.trim().split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-3" />;

      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-2xl font-bold font-rajdhani text-white border-b border-white/10 pb-2 mt-2 mb-4" style={{ color: theme.primaryColor }}>
            {trimmed.replace('# ', '')}
          </h1>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="text-lg font-bold font-rajdhani text-cyan-400 mt-5 mb-2">
            {trimmed.replace('## ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-sm font-bold font-mono text-white/90 mt-3 mb-1">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="text-xs font-mono opacity-80 ml-4 list-disc space-y-1 my-1">
            {trimmed.replace('* ', '')}
          </li>
        );
      }
      return (
        <p key={idx} className="text-xs font-mono opacity-75 leading-relaxed my-2">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl h-[620px] overflow-hidden rounded-2xl border bg-[#050A14] shadow-2xl flex flex-col"
          style={{ borderColor: `${theme.primaryColor}40` }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top Bar Header */}
          <div
            className="flex items-center justify-between p-5 border-b bg-white/5"
            style={{ borderColor: 'rgba(255,255,255,0.08)' }}
          >
            <div className="flex items-center gap-3">
              <Icon size={22} style={{ color: theme.primaryColor }} />
              <div>
                <h2 className="font-bold tracking-wider text-base font-rajdhani text-white">
                  {doc.title}
                </h2>
                <p className="text-[11px] font-mono opacity-50">FightBracket Pro Legal & Info Center</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 opacity-60 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-[#070D1B]">
            {renderFormattedContent(doc.content)}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-4 border-t bg-black/40 flex justify-between items-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-[11px] font-mono opacity-40">fightbracketpro.com</span>
            <button
              onClick={onClose}
              className="px-5 py-1.5 rounded-lg bg-white/10 text-white font-mono font-bold text-xs hover:bg-white/20 transition-all"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
