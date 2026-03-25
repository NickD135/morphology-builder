# NSW Department of Education — SaaS Approval Checklist

**Product:** Word Labs (wordlabs.app)
**Owner:** Nicholas Deeney — Word Labs Education (ABN registered)
**Date created:** 25 March 2026
**Last updated:** 25 March 2026
**Source:** NSW DoE AI assistant guidance on requirements for educational SaaS acceptance

---

## Overview

For Word Labs to be officially accepted and used by NSW Department of Education teachers, it must meet standards across 10 areas: privacy, security, data sovereignty, authentication, consent, accessibility, compatibility, content, support, and formal approval process.

---

## 1. Privacy & Data Protection

| Requirement | Status | Evidence |
|---|---|---|
| Comply with NSW PPIP Act 1998 | ✅ Done | privacy.html updated with PPIP Act references, IPP alignment (s.9, s.18, s.19) |
| Comply with Australian Privacy Principles (APPs) | ✅ Done | privacy.html addresses all 13 APPs |
| Only collect minimum information required | ✅ Done | Student first names + unique codes only. No surnames, DOB, email, photos |
| Clear privacy policy and data handling practices | ✅ Done | privacy.html, data-agreement.html, parent-privacy.html published |
| Student data stored securely, only accessible by authorised users | ✅ Done | Supabase RLS policies, teacher auth required |
| Never share personal info with third parties without consent | ✅ Done | No third-party data sharing; sub-processors listed in data agreement |
| NSW IPC listed as complaint body | ✅ Done | Added to privacy.html and data-agreement.html |

---

## 2. Cyber Security

| Requirement | Status | Evidence |
|---|---|---|
| Data encrypted in transit (SSL/TLS) | ✅ Done | Supabase enforces HTTPS; Vercel enforces HTTPS |
| Data encrypted at rest | ✅ Done | Supabase encrypts PostgreSQL at rest (AES-256) |
| Passwords hashed and salted | ✅ Done | Supabase Auth uses bcrypt |
| Unique codes not easily guessable | ✅ Done | 6-char alphanumeric class codes, 3-char student codes |
| Protected against SQL Injection | ✅ Done | Supabase JS client uses parameterised queries |
| Protected against XSS | ✅ Done | escapeHtml() on all user data in innerHTML; CSP header deployed |
| Protected against CSRF | ✅ Done | JWT bearer tokens (not cookies); documented in security architecture |
| Content-Security-Policy header | ✅ Done | Deployed in vercel.json |
| Open redirect protection | ✅ Done | returnTo parameter validated in teacher-login.html |
| Security architecture document | ✅ Done | docs/security-architecture.md |
| Incident response plan | ✅ Done | docs/incident-response-plan.md |
| Regular vulnerability assessments / pen testing | ❌ Not done | Recommend arranging external pen test before formal submission |
| Comply with NSW DoE Cyber Security Policy | Pending | Need to obtain and review the specific policy document |

---

## 3. Data Sovereignty

| Requirement | Status | Evidence |
|---|---|---|
| All data stored in Australian data centres | ✅ Done | Supabase project in `ap-southeast-2` (Sydney) |
| No overseas hosting for user data | ✅ Done | Database and auth in Sydney; static files on Vercel CDN (no user data) |
| Transborder disclosure documented | ✅ Done | privacy.html Section 6.1 — student data never leaves AU; teacher billing via Stripe documented per s.19 |

---

## 4. User Authentication

| Requirement | Status | Evidence |
|---|---|---|
| Strong authentication for teachers | ✅ Done | Supabase Auth — email/password with email verification |
| Students only access their own data | ✅ Done | Session-based access; RLS policies on all tables |
| Secure password/code reset process | ✅ Done | Teachers: email-based reset. Students: teacher regenerates codes |

---

## 5. Consent & Permissions

| Requirement | Status | Evidence |
|---|---|---|
| Terms of use for teachers | ✅ Done | terms.html |
| Privacy info for students/parents | ✅ Done | parent-privacy.html — plain-language summary for schools to share with families |
| Parent/guardian consent for under-16s | ✅ Done | privacy.html Section 5.1 — IPP 2 consent model documented; school acts as controller under existing enrolment authority |

---

## 6. Accessibility (WCAG 2.1 AA)

| Requirement | Status | Evidence |
|---|---|---|
| Skip-to-content links | ✅ Done | All 34 pages |
| ARIA landmarks (banner, main, navigation) | ✅ Done | All 34 pages |
| ARIA labels on forms, buttons, navigation | ✅ Done | All teacher pages, game pages |
| aria-live regions for dynamic content | ✅ Done | Scores, feedback, errors across all pages |
| Keyboard navigation for all interactive elements | ✅ Done | Tab/Enter/Space support on all drag-and-drop games |
| Colour contrast meets 4.5:1 / 3:1 | ✅ Done | Full audit and fix across all pages |
| Text resizable to 200% without loss | ✅ Done | Dashboard cells use min-width/min-height |
| No colour-only indicators | ✅ Done | ✓/✗ icons on correct/wrong states; ⚠ on intervention flags |
| All images have descriptive ALT text | ✅ Done | Audited and fixed |
| Error messages associated with form fields | ✅ Done | aria-live regions, for=/id associations |
| Content readable and understandable | ✅ Done | Plain language, age-appropriate |
| No flashing content | ✅ Done | Particle effects are subtle, no rapid flashing |
| Audio/video has captions/transcripts | N/A | No video content |
| Tested with screen readers | ❌ Not done | Requires manual testing with VoiceOver/NVDA |
| Accessible forms and navigation | ✅ Done | Proper label associations, keyboard-navigable |

---

## 7. Integration & Compatibility

| Requirement | Status | Evidence |
|---|---|---|
| Works on Chrome, Edge, Safari | ✅ Done | Vanilla HTML/CSS/JS, no browser-specific APIs |
| Does not interfere with DoE content filters/firewall | Partial | GitHub Pages deployment works on school network; wordlabs.app may need whitelisting by some school firewalls |

---

## 8. Content & Educational Value

| Requirement | Status | Evidence |
|---|---|---|
| Educational, age-appropriate, respectful, inclusive | ✅ Done | Morphology/phonics curriculum aligned to NSW Syllabus and Australian Curriculum v9.0 |
| No advertisements | ✅ Done | Zero ads, no tracking cookies |
| No unapproved external links | ✅ Done | Only CDN links (Google Fonts, Supabase JS library) |

---

## 9. Support, Maintenance & Incident Response

| Requirement | Status | Evidence |
|---|---|---|
| Ongoing support for teachers | ✅ Done | Email nick@wordlabs.app, 24h response on school days, in-app feedback form |
| Security/privacy incident reporting process | ✅ Done | docs/incident-response-plan.md; reporting process in teacher guide |
| Setup/use/troubleshooting instructions | ✅ Done | teacher-guide.html — comprehensive 9-section guide |
| Formal teacher guide | ✅ Done | teacher-guide.html (print-friendly) |

---

## 10. Formal Approval Process

| Step | Status | Notes |
|---|---|---|
| Complete SaaS Risk Assessment form | ❌ Not started | Request form from DoE ICT Directorate |
| Provide documentation package | ✅ Ready | Privacy policy, security architecture, incident response plan, data agreement, parent summary, teacher guide |
| Technical review by DoE | ❌ Not started | Triggered after documentation submitted |
| Privacy Impact Assessment | ❌ Not started | May be required by DoE |
| External penetration testing | ❌ Not started | Arrange before or during formal review |
| Pilot with small group of teachers | In progress | PL demo 2026-03-25; need formal structured pilot |
| Written approval | ❌ Not started | Final step |

---

## Remaining Action Items

1. **Screen reader testing** — test with VoiceOver (Mac) and/or NVDA (Windows) to verify accessibility
2. **External penetration testing** — arrange a basic security assessment (can be done during review process)
3. **Contact NSW DoE ICT Directorate** — request the SaaS Risk Assessment form
4. **Formal pilot program** — structure a trial with 3-5 NSW teachers with feedback collection
5. **School firewall whitelisting** — document which domains need whitelisting (wordlabs.app, kdpavfrzmmzknqfpodrl.supabase.co, cdn.jsdelivr.net, fonts.googleapis.com)

---

## Documentation Package (Ready to Submit)

| Document | URL/File |
|---|---|
| Privacy Policy | wordlabs.app/privacy |
| Terms of Service | wordlabs.app/terms |
| Data Handling Agreement | wordlabs.app/data-agreement |
| Parent Privacy Summary | wordlabs.app/parent-privacy |
| Security Architecture | docs/security-architecture.md |
| Incident Response Plan | docs/incident-response-plan.md |
| Teacher Guide | wordlabs.app/teacher-guide |
| About / Curriculum Alignment | wordlabs.app/about |

---

## Contacts

- **NSW DoE ICT Directorate** — for SaaS Risk Assessment form and technical review
- **School Digital Strategy Team** — for initial guidance
- **School ICT Manager / InfoSecurity team** — for firewall/network compatibility
