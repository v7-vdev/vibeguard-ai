import type { CodePayload } from '../types/security';

export const SAMPLE_VULNERABLE_APP: CodePayload = {
  frontend: `// Generated with Bolt / Lovable / Cursor for an AI Image Generator App
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// ⚠️ VULNERABILITY #1: Leaked Service Role Key and Stripe Secret Key in client bundle!
const SUPABASE_URL = "https://xyzcompany.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5eiIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2ODg4ODg4ODh9.SECRET_SERVICE_KEY";
const STRIPE_SECRET_KEY = "sk_live_EXAMPLE_MOCK_LEAKED_SECRET_KEY_FOR_TESTING_ONLY";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export function GenerateImageModal({ user }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // ⚠️ VULNERABILITY #2: Client-side credit deduction!
    // An attacker can open DevTools and bypass this, or set credits to 999999.
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profile.credits < 1) {
      alert("No credits left! Purchase more to continue.");
      setIsGenerating(false);
      return;
    }

    // Direct client mutation to decrement credits
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    // Call AI generation API
    await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify({ prompt, userId: user.id }),
    });

    setIsGenerating(false);
  };

  const handleUpgradeToPro = async () => {
    // ⚠️ VULNERABILITY #3: Direct client-side payment creation with exposed secret key
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": \`Bearer \${STRIPE_SECRET_KEY}\`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        "success_url": window.location.origin + "/dashboard?success=true",
        "cancel_url": window.location.origin + "/dashboard?canceled=true",
        "mode": "subscription",
        "line_items[0][price]": "price_1OvExampleProPlanId",
        "line_items[0][quantity]": "1",
        "client_reference_id": user.id
      })
    });
    const session = await res.json();
    window.location.href = session.url;
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold">AI Studio</h2>
      <textarea 
        value={prompt} 
        onChange={(e) => setPrompt(e.target.value)} 
        placeholder="Enter your prompt..."
        className="w-full p-2 border rounded"
      />
      <div className="flex gap-4 mt-4">
        <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
          Generate Image (1 Credit)
        </button>
        <button onClick={handleUpgradeToPro} className="btn-secondary">
          Upgrade to Unlimited Pro ($29/mo)
        </button>
      </div>
    </div>
  );
}`,

  backend: `// Next.js App Router: app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ⚠️ VULNERABILITY #4: Missing Stripe Webhook HMAC Signature verification!
// An attacker can forge POST requests with fake "checkout.session.completed" 
// payloads and give any user account unlimited Pro subscriptions for free!
export async function POST(req: Request) {
  try {
    const event = await req.json(); // Raw JSON without stripe.webhooks.constructEvent!

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;

      // Automatically upgrade user in database without verifying stripe-signature header!
      await supabaseAdmin
        .from('profiles')
        .update({
          is_pro: true,
          plan: 'pro_unlimited',
          credits: 999999,
          subscription_id: session.subscription
        })
        .eq('id', userId);

      console.log(\`User \${userId} successfully granted Pro membership!\`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// ⚠️ VULNERABILITY #5: Broken Access Control & Unauthenticated Admin Route
// Anyone who discovers this URL can dump or delete all customer records!
export async function GET(req: Request) {
  // No authorization header check or session check!
  const { data: users, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, is_pro, credits');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ all_users: users });
}`,

  supabase: `-- Supabase Database Schema generated by vibe-coding prompt
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 5,
  is_pro BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ⚠️ VULNERABILITY #6: Broken / Permissive Row Level Security (RLS) Policy
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- DANGEROUS: Permissive policy allowing anyone on the internet with anon key 
-- to view, edit, and overwrite ANY user's profile and credits!
CREATE POLICY "Public profiles are open for everyone" 
  ON public.profiles 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- ⚠️ VULNERABILITY #7: Missing RLS completely on generated_images table!
-- Anyone can read all generated images or insert malicious records.
-- Note: 'ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY' was forgotten!
`
};

export const SAMPLE_HARDENED_APP: CodePayload = {
  frontend: `// Hardened Next.js / React Client Component
import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// Safe: Only public anonymous keys are exposed in client bundle
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function SecureStudio({ user }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // Credits deduction is enforced securely on the backend server, NOT in browser!
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      alert("Image generated successfully!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    // Payment sessions are generated securely on the server!
    const res = await fetch("/api/checkout/session", { method: "POST" });
    const { checkoutUrl } = await res.json();
    if (checkoutUrl) window.location.href = checkoutUrl;
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl">
      <h2 className="text-xl font-bold">Secure AI Studio</h2>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <button onClick={handleGenerate} disabled={loading}>Generate</button>
      <button onClick={handleUpgrade}>Upgrade to Pro</button>
    </div>
  );
}`,

  backend: `// Next.js App Router: app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/navigation';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // Cryptographically verified against webhook secret
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: \`Webhook Error: \${err.message}\` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true, plan: 'pro_unlimited' })
        .eq('id', userId);
    }
  }

  return NextResponse.json({ received: true });
}`,

  supabase: `-- Hardened Supabase PostgreSQL Schema with Strict RLS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  credits INTEGER DEFAULT 5 CHECK (credits >= 0),
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Strict least-privilege policies
CREATE POLICY "Users can only read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Prevent users from modifying their own 'credits' or 'is_pro' status
-- Updates should only happen via secure Database Webhooks or Service Role RPC functions
CREATE POLICY "Users can only update their display name"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only view their own generated images"
  ON public.generated_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
  ON public.generated_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
`
};
