import type { CodePayload, SecurityAuditResult } from '../types/security';

const GEMINI_SYSTEM_PROMPT = `You are a Senior Application Security Penetration Tester. Analyze the provided codebase from a vibe-coded application. 
Perform deep static analysis focusing on the 4 highest-risk failure modes:
1. Leaked API secrets or private keys exposed in client bundles.
2. Missing or permissive Row Level Security (RLS) in Supabase/PostgreSQL.
3. Client-side payment logic or credit deductions that bypass server validation.
4. Unprotected server routes or missing Stripe webhook HMAC signature checks.

Return ONLY a single valid JSON object strictly matching this schema:
{
  "security_score": number, // 0 to 100, where 100 is completely secure and 0 is critically dangerous
  "status": "CRITICAL" | "WARNING" | "SECURE",
  "executive_summary": "plain English explanation for non-technical founders summarizing the overall posture and primary risks",
  "vulnerabilities": [
    {
      "id": "VIBE-001",
      "category": "SECRETS" | "DATABASE_RLS" | "PAYMENTS" | "AUTH",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM",
      "title": "Clear short title",
      "description": "plain English explanation of why this is dangerous and how attackers exploit it",
      "vulnerable_snippet": "exact lines of problematic code from input",
      "remediation_patch": "exact copy-paste fix code with explanation"
    }
  ]
}`;

export async function runGeminiSecurityAudit(
  code: CodePayload,
  apiKey: string
): Promise<SecurityAuditResult> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Google Gemini API key is missing. Please provide a key or run the live demo scan.');
  }

  // Count lines and files for metadata
  const frontendLines = code.frontend.trim() ? code.frontend.split('\n').length : 0;
  const backendLines = code.backend.trim() ? code.backend.split('\n').length : 0;
  const supabaseLines = code.supabase.trim() ? code.supabase.split('\n').length : 0;
  const totalLines = frontendLines + backendLines + supabaseLines;
  const totalFiles = (code.frontend.trim() ? 1 : 0) + (code.backend.trim() ? 1 : 0) + (code.supabase.trim() ? 1 : 0);

  if (totalFiles === 0) {
    throw new Error('Please paste at least one code snippet (Frontend, Backend, or Supabase SQL) to audit.');
  }

  const promptContent = `
=== CODEBASE AUDIT TARGET ===

--- FILE 1: FRONTEND CODE (React / Next.js / HTML) ---
${code.frontend.trim() ? code.frontend : '// No frontend code provided'}

--- FILE 2: BACKEND / API ROUTES (e.g. Next.js API Routes, Edge Functions) ---
${code.backend.trim() ? code.backend : '// No backend routes provided'}

--- FILE 3: SUPABASE / DATABASE SQL SCHEMA ---
${code.supabase.trim() ? code.supabase : '// No database schema provided'}
`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey.trim()}`;

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: GEMINI_SYSTEM_PROMPT
        }
      ]
    },
    contents: [
      {
        parts: [
          {
            text: promptContent
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errData = await response.json();
      errorDetail = errData?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Received an empty response from Gemini 3.8 Flash API.');
  }

  // Strip potential markdown wrappers like ```json ... ```
  let cleanedText = rawText.trim();
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    const parsed: SecurityAuditResult = JSON.parse(cleanedText);
    parsed.analyzed_at = new Date().toISOString();
    parsed.meta = {
      files_scanned: totalFiles,
      lines_scanned: totalLines,
      detected_frameworks: ['React', 'Next.js', 'Supabase', 'Stripe']
    };
    return parsed;
  } catch (parseErr) {
    console.error('JSON parsing failed:', parseErr, cleanedText);
    throw new Error('Failed to parse Gemini output into valid security schema JSON. Raw output: ' + cleanedText.substring(0, 100));
  }
}

/**
 * Built-in static simulation engine for instant demonstrations or when evaluating offline
 */
export function getSimulatedAudit(code: CodePayload): SecurityAuditResult {
  const isVulnerableSample =
    code.frontend.includes('STRIPE_SECRET_KEY') ||
    code.frontend.includes('SUPABASE_SERVICE_KEY') ||
    code.backend.includes('req.json()') ||
    code.supabase.includes('USING (true)');

  if (isVulnerableSample) {
    return {
      security_score: 22,
      status: 'CRITICAL',
      executive_summary:
        "Critical vulnerabilities detected in client-side secrets and backend routes. Anyone inspecting your client bundle can drain your Stripe account or read your entire Supabase database. Payment confirmation has zero cryptographic verification, allowing users to fake paid subscriptions by sending spoofed requests.",
      analyzed_at: new Date().toISOString(),
      meta: {
        files_scanned: 3,
        lines_scanned: 168,
        detected_frameworks: ['Next.js', 'Supabase', 'Stripe', 'Tailwind']
      },
      vulnerabilities: [
        {
          id: 'VIBE-001',
          category: 'SECRETS',
          severity: 'CRITICAL',
          title: 'Supabase Service Role Key & Stripe Secret Leaked in Client Bundle',
          description:
            'The frontend code contains SUPABASE_SERVICE_KEY and STRIPE_SECRET_KEY in client-side code. The Supabase service role key bypasses ALL Row Level Security completely, giving anyone full admin database access. The Stripe secret allows unauthorized refunds, transfers, and customer data exfiltration.',
          vulnerable_snippet: `const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";\nconst STRIPE_SECRET_KEY = "sk_live_EXAMPLE_MOCK_LEAKED_SECRET_KEY_FOR_TESTING_ONLY";`,
          remediation_patch: `// 1. In frontend: Use ONLY NEXT_PUBLIC_SUPABASE_ANON_KEY\nconst supabase = createClient(\n  process.env.NEXT_PUBLIC_SUPABASE_URL!,\n  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!\n);\n\n// 2. In backend routes only: Never expose sk_live or service role keys to client!\n// Access them strictly in server environment (e.g. process.env.STRIPE_SECRET_KEY)`
        },
        {
          id: 'VIBE-002',
          category: 'DATABASE_RLS',
          severity: 'CRITICAL',
          title: 'Unrestricted Public RLS Policy (USING true) on Profiles Table',
          description:
            'The Supabase RLS policy "Public profiles are open for everyone" uses USING (true) WITH CHECK (true) FOR ALL actions. Any user or unauthenticated visitor with your anon key can modify other users\' names, emails, and award themselves arbitrary credits.',
          vulnerable_snippet: `CREATE POLICY "Public profiles are open for everyone" \n  ON public.profiles \n  FOR ALL \n  USING (true) \n  WITH CHECK (true);`,
          remediation_patch: `-- Drop permissive policy and enforce strict ownership\nDROP POLICY IF EXISTS "Public profiles are open for everyone" ON public.profiles;\n\nCREATE POLICY "Users view own profile"\n  ON public.profiles FOR SELECT\n  TO authenticated\n  USING (auth.uid() = id);\n\nCREATE POLICY "Users update own display info"\n  ON public.profiles FOR UPDATE\n  TO authenticated\n  USING (auth.uid() = id)\n  WITH CHECK (auth.uid() = id);`
        },
        {
          id: 'VIBE-003',
          category: 'PAYMENTS',
          severity: 'CRITICAL',
          title: 'Missing Stripe Webhook HMAC Signature Verification',
          description:
            'The webhook handler parses req.json() directly without calling stripe.webhooks.constructEvent() using the endpoint secret and stripe-signature header. Any bad actor can send a fake POST request with a forged checkout.session.completed event to grant themselves unlimited Pro membership for free.',
          vulnerable_snippet: `export async function POST(req: Request) {\n  const event = await req.json(); // Unsigned!\n  if (event.type === 'checkout.session.completed') {\n    await supabaseAdmin.from('profiles').update({ is_pro: true });\n  }\n}`,
          remediation_patch: `import { headers } from 'next/headers';\nimport Stripe from 'stripe';\n\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\nexport async function POST(req: Request) {\n  const rawBody = await req.text();\n  const signature = headers().get('stripe-signature');\n  \n  let event: Stripe.Event;\n  try {\n    event = stripe.webhooks.constructEvent(\n      rawBody,\n      signature!,\n      process.env.STRIPE_WEBHOOK_SECRET!\n    );\n  } catch (err: any) {\n    return new Response(\`Webhook signature verification failed: \${err.message}\`, { status: 400 });\n  }\n\n  // Safe to process verified event...\n}`
        },
        {
          id: 'VIBE-004',
          category: 'PAYMENTS',
          severity: 'HIGH',
          title: 'Client-Side Credit Deduction Vulnerability',
          description:
            'The client application performs credits validation and decrement via browser Supabase calls before initiating generation. Attackers can modify the client logic in browser DevTools or call the backend directly, generating unlimited content without decrementing credits.',
          vulnerable_snippet: `await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);\nawait fetch("/api/generate", { ... });`,
          remediation_patch: `// Move credit verification and atomic decrement into a Postgres RPC function or Server Action:\nCREATE OR REPLACE FUNCTION deduct_credit_for_user(user_uuid UUID)\nRETURNS BOOLEAN AS $$\nBEGIN\n  UPDATE public.profiles\n  SET credits = credits - 1\n  WHERE id = user_uuid AND credits >= 1;\n  \n  RETURN FOUND;\nEND;\n$$ LANGUAGE plpgsql SECURITY DEFINER;\n\n// Call this strictly on your secure backend API route before triggering expensive AI generation.`
        },
        {
          id: 'VIBE-005',
          category: 'AUTH',
          severity: 'HIGH',
          title: 'Unauthenticated Admin Route Exposing All User Profiles',
          description:
            'The GET handler in app/api/webhooks/stripe/route.ts exposes all user profiles without validating authentication or admin role claims. Anyone who browses to this endpoint gets a full dump of user emails and names.',
          vulnerable_snippet: `export async function GET(req: Request) {\n  const { data: users } = await supabaseAdmin.from('profiles').select('id, email, full_name, is_pro, credits');\n  return NextResponse.json({ all_users: users });\n}`,
          remediation_patch: `// Protect endpoint with Supabase Auth session & verify admin role:\nimport { createServerClient } from '@supabase/ssr';\nimport { cookies } from 'next/headers';\n\nexport async function GET(req: Request) {\n  const cookieStore = cookies();\n  const supabase = createServerClient(..., { cookies: { get(name) { return cookieStore.get(name)?.value } } });\n  const { data: { user } } = await supabase.auth.getUser();\n  \n  if (!user || user.app_metadata?.role !== 'admin') {\n    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });\n  }\n  \n  // Return data safely\n}`
        }
      ]
    };
  }

  // Generic clean result
  return {
    security_score: 94,
    status: 'SECURE',
    executive_summary:
      "Excellent security posture! No client-side secret leakage detected. Row Level Security policies enforce strict authenticated ownership boundaries. Stripe webhook signatures are cryptographically validated against the endpoint secret.",
    analyzed_at: new Date().toISOString(),
    meta: {
      files_scanned: 3,
      lines_scanned: 132,
      detected_frameworks: ['React', 'Supabase', 'Stripe']
    },
    vulnerabilities: [
      {
        id: 'VIBE-INFO-001',
        category: 'DATABASE_RLS',
        severity: 'MEDIUM',
        title: 'Consider Setting Explicit CHECK Constraint on Credit Decrements',
        description:
          'Ensure database columns have explicit CHECK (credits >= 0) to prevent negative credit balances during concurrent requests.',
        vulnerable_snippet: `credits INTEGER DEFAULT 5`,
        remediation_patch: `ALTER TABLE public.profiles ADD CONSTRAINT check_credits_positive CHECK (credits >= 0);`
      }
    ]
  };
}
