# NSW DoE Outreach Email — SaaS Risk Assessment Request

**To:** ict.directorate@det.nsw.edu.au
**Subject:** Request for SaaS Risk Assessment Form — Word Labs Educational Platform

Dear Technology/Information Security Team,

I am a NSW primary school teacher and have developed an educational website called **Word Labs** (wordlabs.app) for teacher and student use in NSW public schools. Before seeking wider rollout, I would like to complete the Department's SaaS Risk Assessment and seek guidance on the approval process.

**About Word Labs:**
Word Labs is a browser-based spelling, morphology, and phonics tool for upper primary classrooms (Years 3–6). It aligns to the NSW English K–10 Syllabus and Australian Curriculum v9.0. Teachers use it to set diagnostic spelling sets, track student progress via heatmap dashboards, and generate differentiated worksheets and resources. Students engage through interactive activities including morpheme building, phoneme splitting, syllable work, and vocabulary games.

**Privacy and data minimisation:**
- Only student first names and in-game progress data are collected — no surnames, emails, dates of birth, photos, or other personal information
- Schools act as data controllers; Word Labs operates as a data processor
- Parent/guardian privacy summary available at wordlabs.app/parent-privacy

**Technical and security summary:**
- All data stored in Australia (Supabase hosted in Sydney, ap-southeast-2)
- Teacher authentication via Supabase Auth (bcrypt-hashed passwords, JWT sessions)
- HTTPS on all connections, encryption at rest on all database storage
- Row Level Security (RLS) policies enforce school-level data isolation
- Content Security Policy headers configured
- XSS and open redirect audits completed

**Compliance:**
- Australian Privacy Act 1988 and Australian Privacy Principles (APPs)
- NSW Privacy and Personal Information Protection Act 1998 (PPIP Act) — IPPs addressed in privacy policy
- Notifiable Data Breaches scheme — incident response plan documented
- WCAG 2.1 AA accessibility — skip links, ARIA landmarks, keyboard navigation, colour contrast audit completed across all pages

**Documentation ready for review:**
- Privacy Policy — wordlabs.app/privacy
- Terms of Service — wordlabs.app/terms
- School Data Handling Agreement — wordlabs.app/data-agreement
- Parent/Guardian Privacy Summary — wordlabs.app/parent-privacy
- Security Architecture Document
- Incident Response Plan
- Teacher Guide — wordlabs.app/teacher-guide

**Business details:**
- ABN: 42 805 947 083
- Registered business name: Word Labs Education
- Sole trader — Nicholas Deeney

Could you please provide the SaaS Risk Assessment form, along with any supporting documentation or requirements needed for digital tools in classrooms? If possible, I would also appreciate any advice on privacy, security, and accessibility compliance specific to Department approval.

Thank you for your assistance.

Kind regards,
Nicholas Deeney
Word Labs Education
nick@wordlabs.app
wordlabs.app
