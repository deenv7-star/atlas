# Legal and trust pages: sources and open points

Written 18.10.2026 for the public pages under `src/site/content/pages/*.md`.
Every business detail that is not known yet is `null` in `src/config/legal.js`
(`npm run check:legal` lists them). On the live site a missing detail is never shown as `{{KEY}}`:
the sentence or list line that needs it is left out, or it reads "יעודכן בקרוב" (rules in `src/site/lib/md.jsx`). **A lawyer should review all of these pages before they go live.**

## Laws and official guidance used

| Topic | Source |
|---|---|
| Privacy Protection Law 1981 + Amendment 13 (in force 14.08.2025): notice duty (s. 11), access (s. 13), correction (s. 14), DPO duty for some bodies | gov.il professional guide to Amendment 13; Knesset text. https://www.gov.il/he/departments/legalInfo/amendment13 |
| Privacy Protection (Data Security) Regulations 2017: security levels, reg. 15 outsourcing agreement (data, purposes, systems, return/destruction, security duties, confidentiality, annual report, incident notice) | Nevo text https://www.nevo.co.il/law_html/law00/144811.htm ; PPA reg. 15 guide (updated after Amendment 13) https://www.gov.il/BlobFolder/reports/guide_section_15/he/Takna15%20_Tikon13.pdf ; PPA full guide ch. 17 https://www.gov.il/he/pages/data_security_guide?chapterIndex=17 |
| Transfer of data abroad: Privacy Protection (Transfer of Data to Databases Abroad) Regulations 2001 (EU transfer permitted) | Nevo / gov.il |
| Accessibility statement: reg. 35ה of the Equal Rights for Persons with Disabilities (Accessibility Adjustments for Service) Regulations 2013; coordinator only if 25+ employees; reg. 34(א)(4) service arrangements; IS 5568 = WCAG 2.0 AA | Regulation text https://www.nevo.co.il/law_html/law01/500_865.htm ; summary checked against https://nagish.pashut.app/guides/accessibility-statement (verified 27.09.2026) |
| Ongoing transaction cancellation (s. 13ד Consumer Protection Law): stop billing within 3 business days, cancel by phone / email / site / registered mail | Consumer Protection Law; consumers.org.il; gov.il returns page |
| Distance sale cancellation (s. 14ג): 14 days, fee 5% or ₪100 whichever lower, refund within 14 days | Consumer Protection (Cancellation of Transaction) Regulations 2010 |
| Spam (s. 30א Communications Law): advertisement needs prior explicit consent, statutory damages up to ₪1,000 per message | Ministry of Communications FAQ https://www.gov.il/he/pages/17052018_7 |
| Cookie consent should be separate per purpose (only relevant if analytics/ads are ever added) | elyashivlaw article (2026) |

## Facts about ATLAS the pages rely on (verified 18.10.2026)

- Supabase project `romvmqbcinurscwdsskx`: region eu-central-1 (Frankfurt); RLS on 37/37 public tables; email sign-in with email confirmation required; SMTP via Resend from noreply@atlas-il.com (Supabase Management API).
- Live headers on atlas-il.com: HSTS (max-age=63072000), X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (curl -I).
- No analytics / ad / tracking scripts in the code. Browser storage: Supabase auth token, `atlas_current_user`, `atlas_cookie_consent`, UI prefs (`atlas_command_palette_recents`, sidebar cookie), short-lived `login_just_completed` / `onboarding_just_completed`, PWA service-worker cache.
- No password / secret / card columns in public tables (information_schema query).
- CSV export exists for bookings, leads, payments; monthly report CSV/PDF.
- ATLAS does not process card payments; invoices are for tracking only (support KB `07-money.md`, `13-limitations.md`).
- No `OPENAI_API_KEY` secret on the live project, so OpenAI is **not** listed as a sub-processor. Add it to `SUBPROCESSORS` in `src/config/legal.js` if the AI assistant / help bot is switched to an AI provider.

## Deliberately NOT claimed

SOC 2, ISO 27001, 99.9% SLA, 24/7 monitoring, encryption-at-rest specifics, daily backups / PITR (PITR is off and the backups list is empty), 2FA (the in-app 2FA button is not real, F03), SSO/SAML, any response-time promise.

## Points for the lawyer

1. **Role split (controller vs holder):** the pages treat the zimmer owner as בעל השליטה for guest/lead data and ATLAS as מחזיק. Confirm, and confirm `/data-processing` is enough as the reg. 15 agreement (click-wrap) or needs a signed DPA.
2. **Database registration / DPO** under Amendment 13: does ATLAS (or its larger customers) need to register a database or appoint a DPO? The privacy page has a `{{DPO_NAME}}` slot.
3. **Security level** of ATLAS's own database under the 2017 Regulations (basic / medium) and the matching written security procedure; the security page states only facts, not compliance.
4. **Transfers to the US** (Vercel, Resend): basis under the 2001 Transfer Regulations.
5. **Cancellation:** 13ד requires cancellation by the same channels a deal can be made, including online. Today cancellation is manual (WhatsApp / form). Confirm this is enough, and decide `{{CANCELLATION_FEE_POLICY}}` (charge 5%/₪100 or not).
6. **Consumer vs business:** most customers are businesses; the cancellation page applies consumer rights "if you are a consumer". Confirm wording.
7. **Liability cap** (3 months of fees) and AS IS clause in Terms: enforceability against small businesses / consumers (Standard Contracts Law).
8. **Spam responsibility:** Terms put responsibility for guest messages on the owner (messages leave from the owner's own WhatsApp). Confirm.
9. **Accessibility:** is ATLAS (business size) obliged to appoint a coordinator? The statement has coordinator placeholders; if not obliged, replace with a contact for accessibility requests. The in-app screens are listed as not fully audited.
10. **Retention periods:** the privacy page says "a reasonable time" and "what the law requires"; set concrete periods.
11. **Blog disclaimers:** the tax (VAT / osek patur) and licensing articles say they are general information and not advice; confirm that is enough.
12. **Security gaps to fix before claiming more** (not on the public page): PITR off and no backups listed, public storage bucket `atlas-files` (F12), DB SSL enforcement off, network restrictions open, minimum password length 6, no captcha.
