import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VulnerabilityBadges } from './components/VulnerabilityBadges';
import { CodeInputSection } from './components/CodeInputSection';
import { ScannerLoading } from './components/ScannerLoading';
import { AuditResultsPanel } from './components/AuditResultsPanel';
import { ApiKeyModal } from './components/ApiKeyModal';
import type { CodePayload, CodeTab, SecurityAuditResult } from './types/security';
import { SAMPLE_VULNERABLE_APP, SAMPLE_HARDENED_APP } from './data/samplePresets';
import { runGeminiSecurityAudit, getSimulatedAudit } from './services/geminiAuditService';
import { AlertCircle, CheckCircle2, Lock, Zap } from 'lucide-react';


export function App() {
  // Local storage persistence for Gemini API key
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('vibeguard_gemini_api_key') || '';
  });

  // Load sample vulnerable app initially for instant user engagement
  const [code, setCode] = useState<CodePayload>(SAMPLE_VULNERABLE_APP);
  const [activeTab, setActiveTab] = useState<CodeTab>('frontend');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<SecurityAuditResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    if (newKey) {
      localStorage.setItem('vibeguard_gemini_api_key', newKey);
      showToast('Gemini API key saved securely to localStorage');
    } else {
      localStorage.removeItem('vibeguard_gemini_api_key');
      showToast('Gemini API key removed');
    }
  };

  const handleCodeChange = (tab: CodeTab, value: string) => {
    setCode((prev) => ({ ...prev, [tab]: value }));
  };

  const handleLoadPreset = (presetPayload: CodePayload, name: string) => {
    setCode(presetPayload);
    setAuditResult(null);
    setErrorMessage(null);
    showToast(`Loaded ${name} App Preset`);
  };

  const executeAudit = async (forceSimulate = false) => {
    setErrorMessage(null);
    setIsLoading(true);

    const totalLines =
      (code.frontend ? code.frontend.split('\n').length : 0) +
      (code.backend ? code.backend.split('\n').length : 0) +
      (code.supabase ? code.supabase.split('\n').length : 0);

    if (totalLines === 0) {
      setErrorMessage('Please paste at least one file or click "Load Sample Vulnerable App" above.');
      setIsLoading(false);
      return;
    }

    try {
      if (apiKey && apiKey.trim() && !forceSimulate) {
        // Direct client fetch to Gemini 3.8 Flash
        const result = await runGeminiSecurityAudit(code, apiKey);
        setAuditResult(result);
        showToast('Audit complete via Gemini 3.8 Flash!');
      } else {
        // Instant simulated offline analysis if no API key is provided
        await new Promise((res) => setTimeout(res, 2800)); // Simulate radar analysis duration
        const simulated = getSimulatedAudit(code);
        setAuditResult(simulated);
        showToast('Audit complete via Built-in AppSec Engine!');
      }

      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setErrorMessage(err.message || 'An unexpected error occurred during security audit.');
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to run audit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          executeAudit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, apiKey, isLoading]);

  const totalLines =
    (code.frontend ? code.frontend.split('\n').length : 0) +
    (code.backend ? code.backend.split('\n').length : 0) +
    (code.supabase ? code.supabase.split('\n').length : 0);

  const totalFiles =
    (code.frontend.trim() ? 1 : 0) +
    (code.backend.trim() ? 1 : 0) +
    (code.supabase.trim() ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 shadow-2xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        apiKey={apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Tagline for Founders */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-800/60">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 mb-3">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              Automated Pre-Flight Security Check
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Don't Launch Your Vibe-Coded App With Leaked Keys or Broken RLS.
            </h2>
            <p className="mt-1.5 text-sm text-slate-400 max-w-2xl leading-relaxed">
              Bolt, Lovable, v0, and Cursor create full-stack apps in minutes — but frequently leave <span className="text-slate-200 font-medium">Stripe secret keys in client bundles</span>, <span className="text-slate-200 font-medium">missing Supabase RLS</span>, and <span className="text-slate-200 font-medium">unverified webhooks</span>. Audit your code before shipping.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleLoadPreset(SAMPLE_VULNERABLE_APP, 'Vulnerable')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 transition"
            >
              Try Vulnerable Preset
            </button>
            <button
              onClick={() => handleLoadPreset(SAMPLE_HARDENED_APP, 'Hardened')}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50 transition"
            >
              Try Clean Preset
            </button>
          </div>
        </div>

        {/* 4 Core Scanned Vulnerability Modes Row */}
        <VulnerabilityBadges />

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {!apiKey && (
                <button
                  onClick={() => setIsApiKeyModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-white font-medium transition"
                >
                  Enter Gemini Key
                </button>
              )}
              <button
                onClick={() => executeAudit(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
              >
                Run Instant Offline Simulation
              </button>
            </div>
          </div>
        )}

        {/* Code Input & Tabs Section */}
        <CodeInputSection
          code={code}
          onChangeCode={handleCodeChange}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onRunAudit={() => executeAudit(false)}
          isLoading={isLoading}
          onLoadPreset={handleLoadPreset}
          hasApiKey={Boolean(apiKey && apiKey.trim())}
          onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        />

        {/* Dynamic Scanner Loading / Progress HUD */}
        {isLoading && (
          <div ref={resultsRef} className="pt-4">
            <ScannerLoading filesCount={totalFiles} linesCount={totalLines} />
          </div>
        )}

        {/* Audit Results Panel */}
        {!isLoading && auditResult && (
          <div ref={resultsRef} className="pt-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Security Audit Results
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Generated: {new Date(auditResult.analyzed_at || Date.now()).toLocaleTimeString()}
              </span>
            </div>

            <AuditResultsPanel
              audit={auditResult}
              onRerunAudit={() => executeAudit(false)}
            />
          </div>
        )}

        {/* Bottom Educational Callout: Why Vibe-Coding Creates Security Traps */}
        <section className="mt-12 pt-8 border-t border-slate-800/80">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 border border-slate-800 p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-3 text-cyan-400">
              <Lock className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                The 4 Hidden Traps in AI-Generated Applications
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed">
              AI code generation tools are trained to make code that "works immediately", which often means taking the path of least resistance: disabling security policies, hardcoding admin keys in client components, and skipping cryptographic webhook checks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-amber-300 block mb-1">
                  1. The "NEXT_PUBLIC_" Fallacy
                </span>
                <p className="text-slate-400 leading-relaxed">
                  When a prompt asks for a Supabase or Stripe action, the AI often pastes the secret key directly into the React component or prepends <code className="text-cyan-300">NEXT_PUBLIC_</code> so it works in the browser. Any visitor can open the Network tab and steal full admin control.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-rose-300 block mb-1">
                  2. "USING (true)" Permissive RLS
                </span>
                <p className="text-slate-400 leading-relaxed">
                  When database queries fail due to RLS, vibe-coders ask the AI to "fix the Supabase permission error". The AI frequently responds with <code className="text-rose-300">CREATE POLICY ON table FOR ALL USING (true)</code>, which opens the table to anyone with your public URL.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-cyan-300 block mb-1">
                  3. Client-Side Credit Deductions
                </span>
                <p className="text-slate-400 leading-relaxed">
                  Many AI image, text, or audio apps decrement credits inside the React button handler: <code className="text-slate-300">update({'{ credits: credits - 1 }'})</code>. A single line in Chrome DevTools allows anyone to set their credits to 1,000,000.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="font-semibold text-purple-300 block mb-1">
                  4. Unverified Stripe Webhooks
                </span>
                <p className="text-slate-400 leading-relaxed">
                  AI tools often generate <code className="text-purple-300">app/api/webhooks/route.ts</code> reading raw JSON, omitting the cryptographic signature check with <code className="text-slate-300">stripe.webhooks.constructEvent()</code>. A single curl POST command grants lifetime Pro memberships for free.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/80 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">VibeGuard AI</span>
            <span>•</span>
            <span>Pre-Flight AppSec Scanner for Indie Hackers</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Client-Side Gemini 3.8 Flash Engine</span>
            <span>•</span>
            <span>Zero Third-Party Data Transmission</span>
          </div>
        </div>
      </footer>

      {/* Gemini API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveKey={handleSaveApiKey}
      />
    </div>
  );
}

export default App;
