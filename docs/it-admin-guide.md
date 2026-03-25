# Word Labs — IT Administrator Guide

**Product:** Word Labs (wordlabs.app)
**Version:** 1.0 — 25 March 2026
**Contact:** nick@wordlabs.app

---

## Overview

Word Labs is a browser-based educational tool for morphology and phonics instruction. It requires no software installation — students and teachers access it via a web browser. This guide provides the technical details your IT team needs to allow Word Labs on your school network.

---

## Domains to Whitelist

The following domains must be accessible for Word Labs to function:

| Domain | Protocol | Purpose | Required? |
|--------|----------|---------|-----------|
| `wordlabs.app` | HTTPS (443) | Main application | **Yes** |
| `kdpavfrzmmzknqfpodrl.supabase.co` | HTTPS (443), WSS (443) | Database, authentication, API | **Yes** |
| `cdn.jsdelivr.net` | HTTPS (443) | Supabase JavaScript library (CDN) | **Yes** |
| `fonts.googleapis.com` | HTTPS (443) | Google Fonts CSS (Lexend typeface) | **Yes** |
| `fonts.gstatic.com` | HTTPS (443) | Google Fonts files | **Yes** |
| `js.stripe.com` | HTTPS (443) | Payment processing (teacher accounts only) | No — only needed for subscription management |

### Alternative deployment

If `wordlabs.app` is blocked by your school's content filter, Word Labs is also available at:

| URL | Notes |
|-----|-------|
| `nickd135.github.io/morphology-builder/` | GitHub Pages mirror — works on most school networks |
| `morphology-builder.vercel.app` | Vercel deployment URL |

Contact nick@wordlabs.app if you need the application hosted on a school-approved domain.

---

## Network Requirements

- **Bandwidth:** Minimal — the application is static HTML/CSS/JS (~2 MB total). No video or large media downloads.
- **Ports:** Only standard HTTPS (port 443). No special ports required.
- **WebSocket:** The Supabase client uses WSS (WebSocket Secure) on port 443 for real-time features. If your firewall inspects WebSocket traffic, ensure `wss://kdpavfrzmmzknqfpodrl.supabase.co` is allowed.
- **Proxy/SSL inspection:** Word Labs works behind SSL-inspecting proxies. No certificate pinning is used.

---

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Google Chrome | 80+ | Fully supported |
| Microsoft Edge | 80+ (Chromium) | Fully supported |
| Safari | 14+ | Fully supported |
| Firefox | 78+ | Fully supported |
| Safari (iPad) | 14+ | Fully supported |
| Chrome (Android) | 80+ | Fully supported |

**JavaScript must be enabled.** Word Labs uses standard ES6 JavaScript — no plugins, extensions, or special browser settings required.

---

## Data & Privacy Summary

| Item | Detail |
|------|--------|
| **Student data collected** | First name only (no surname, email, DOB, or photos) |
| **Data location** | Sydney, Australia (Supabase `ap-southeast-2`) |
| **Encryption in transit** | TLS 1.2+ (HTTPS everywhere) |
| **Encryption at rest** | AES-256 (Supabase/AWS managed) |
| **Authentication** | Teachers: email/password (Supabase Auth, bcrypt). Students: class code + name + 3-letter code |
| **Cookies** | Session cookies for teacher auth only. No advertising or tracking cookies |
| **Third-party trackers** | None. No Google Analytics, no ad networks, no tracking pixels |
| **PPIP Act compliance** | Privacy policy references NSW IPPs; data agreement includes IPP commitment |

Full documentation:
- Privacy Policy: [wordlabs.app/privacy](https://wordlabs.app/privacy)
- Data Handling Agreement: [wordlabs.app/data-agreement](https://wordlabs.app/data-agreement)
- Security Architecture: Available on request (docs/security-architecture.md)
- Incident Response Plan: Available on request (docs/incident-response-plan.md)

---

## No Software Installation Required

Word Labs is a web application. There is nothing to install, configure, or update on school devices. The application:

- Runs entirely in the browser
- Does not require admin privileges
- Does not install browser extensions
- Does not access the device filesystem, camera, microphone, or location
- Does not require Java, Flash, or any plugins
- Works on managed/locked-down devices (Chromebooks, school iPads, Windows laptops)

---

## Student Access

Students access Word Labs by:

1. Opening the browser and navigating to `wordlabs.app` (or the alternative URL)
2. Clicking "Log in" and entering their class code (provided by their teacher)
3. Selecting their name from the class list
4. Entering their 3-letter login code (provided by their teacher)

No email addresses or passwords are required for students. Teachers generate and manage all student login codes.

---

## Testing Connectivity

To verify Word Labs works on your network, open a browser and navigate to:

```
https://wordlabs.app
```

If the page loads and you can see the Word Labs landing page with activity cards, the network is correctly configured. To test the database connection, click "Log in" — if the class code input appears, the Supabase API is reachable.

If the page does not load, check:
1. Is `wordlabs.app` blocked by your content filter? Try the GitHub Pages URL instead.
2. Is `cdn.jsdelivr.net` blocked? This prevents the Supabase library from loading.
3. Is `kdpavfrzmmzknqfpodrl.supabase.co` blocked? This prevents all data operations.

---

## Contact

For technical questions or to request additional documentation:

**Nicholas Deeney**
Word Labs Education
Email: nick@wordlabs.app
Response time: Within 24 hours on school days
