# VibeGuard AI 🛡️

> **Pre-Flight Security Auditor for Apps Built with Lovable, Bolt.new, v0, and Cursor**

VibeGuard AI is a pre-flight static application security (AppSec) auditor designed for non-technical founders and indie hackers. It detects leaked secrets, broken Row Level Security (RLS) policies, client-side credit bypasses, and unverified webhooks before apps launch to production.

---

## ✨ Features

- **⚡ Direct Client-Side Gemini 3.8 Flash Engine:** Runs audits directly from your browser to Google Gemini 2.5/3.8 Flash with structured JSON schema outputs.
- **🔐 Zero Third-Party Intermediaries:** Your code and API key stay in your browser; never proxied through intermediate servers.
- **🎯 4 High-Risk Failure Modes Audited:**
  1. **Leaked Client Secrets:** Exposed `sk_live`, Supabase service role keys, and `NEXT_PUBLIC_` misuse.
  2. **Supabase Missing / Permissive RLS:** Unrestricted `USING (true)` policies, missing table RLS, and policy recursion.
  3. **Payment / Credit Bypasses:** Client-side credit deductions and missing Stripe webhook HMAC signature checks.
  4. **Broken Access Control & Open APIs:** Unauthenticated endpoints exposing customer PII.
- **📊 Circular Security Score Gauge:** Visual rating from 0–100 (Critical 0–40, Warning 41–79, Secure 80–100).
- **📝 Plain-English Executive Summaries:** Founder-focused explanations of financial, legal, and operational risks.
- **🛠️ 1-Click Copy Remediation Patches:** Copy-paste drop-in code fixes with side-by-side diffs.
- **📄 Markdown Security Report Export:** Download formatted reports for your team or investors.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (tested on Node v24)
- npm or pnpm

### Installation
```bash
git clone https://github.com/v7-vdev/vibeguard-ai.git
cd vibeguard-ai
npm install
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, dark-mode developer UI
- **Icons:** `lucide-react`
- **Security Engine:** Google Gemini 3.8 Flash API (`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`)

---

## 📄 License

MIT
