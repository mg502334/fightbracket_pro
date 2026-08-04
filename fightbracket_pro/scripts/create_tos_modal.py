import re

file_path = 'c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/StaticPageModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('StaticPageModal', 'TermsOfServiceModal')
text = text.replace('Privacy Policy & Legal Information', 'Terms of Service')
text = text.replace('privacy policy', 'Terms of Service')
text = text.replace('## PRIVACY POLICY', '## TERMS OF SERVICE')

new_content = """## ⚖️ FightBracket Pro — Terms of Service
Last Updated: August 4, 2026

Welcome to FightBracket Pro ("we," "our," or "the platform"). By accessing our website, tournament bracket dashboards, messaging systems, or developer integration nodes, you agree to be bound by these Terms of Service. If you do not agree to these terms, please terminate your session and close the platform.

### 1. PLATFORM SCOPE & STRICT NO-GAMBLING POLICY
FightBracket Pro is a free tournament management system (TMS) provided strictly for casual competitive play, entertainment, and tournament coordination.

* **Wagering Prohibition:** You are strictly prohibited from using our live bracket updates, tournament URLs, player directories, or match reporting systems to facilitate, coordinate, or track real-money gambling, sports wagering, or illegal betting rings.
* **No Financial Processing:** We do not collect payments or process prize distributions. Any localized use of this free platform to circumvent this policy will result in the immediate and permanent deletion of the offending tournament ecosystem and all associated user accounts.

### 2. ACCURACY OF AUTOMATED TOURNAMENT DATA & APIS
Our platform orchestrates live metadata syncing by pulling cross-platform gaming assets through external third-party developer integrations (such as the start.gg API, Steam API, and Tekken 8/Polaris server hooks).

* We do not guarantee the structural accuracy, up-time, or integrity of data pushed or pulled from these external ecosystems.
* If a sync delay from an external developer endpoint breaks a seed chart, corrupts a player's tournament path, or fails to fetch game histories, it remains the responsibility of the designated Tournament Organizer (TO) to perform manual diagnostic corrections.

### 3. USER-GENERATED CONTENT & COMMUNICATIVE CONDUCT
By initializing custom brackets or utilizing our integrated peer-to-peer user messaging network, you assume full responsibility for all content transmitted. You agree that you will not submit, message, or host content that:

* Infringes upon protected industry trademarks (such as unauthorized usage of official promotion logos).
* Is explicitly unlawful, abusive, defamatory, harassing, or threatening to other competitors or tournament officials.

We maintain full administrative discretion to police data tables across our network and may erase bracket data or text streams without prior notification if terms are breached.

### 4. SERVICE INFRASTRUCTURE & LIMITATION OF LIABILITY
FightBracket Pro is deployed using a distributed architecture spanning Vercel edge endpoints, Supabase authentication networks, and Neon PostgreSQL databases. While we utilize modern secure data layers, the platform is provided on an "AS-IS" and "AS-AVAILABLE" basis.

To the maximum extent permitted by law, FightBracket Pro and its developers shall not be liable for any damages resulting from:

* Unexpected server drops, database disconnections, or system downtime during live tournament pool cycles.
* Loss of historic competitor logs, broken match results, or chat metadata synchronization failures.
* Manual scoring overrides, user moderation decisions, or station tracking errors executed by independent Tournament Organizers.

### 5. ACCOUNT INDEMNITY & AUTHENTICATION SHARED OAUTH
If you register for our services using third-party single-sign-on (OAuth) systems (including Google, Discord, Twitch, or Spotify), you are solely responsible for securing your authorization tokens. We possess no structural ability to restore an account if your primary social channel credentials are leaked or compromised externally.

---

## 🚫 Non-Affiliation Disclaimer
fightbracketpro.com is an independent software platform built for tournament organization and management.

We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with:

* Evolution Championship Series (Evo) or Sony Interactive Entertainment.
* Any video game publishers, developers, or fighting game franchises (including but not limited to Bandai Namco, Capcom, NetherRealm, or Arc System Works).

All product and company names, logos, and trademarks displayed on this website are the property of their respective owners. Their use does not imply any affiliation with or endorsement by them.
"""

text = re.sub(r'const privacyContent = `.*?`;', 'const termsContent = `\\n' + new_content + '\\n`;', text, flags=re.DOTALL)
text = text.replace('privacyContent', 'termsContent')

with open('c:/projects/fightbracket_pro_extended/fightbracket_pro/src/app/components/TermsOfServiceModal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('TermsOfServiceModal.tsx created!')
