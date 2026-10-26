import React from 'react';
import type { CodeTab, CodePayload } from '../types/security';
import {
  FileCode,
  Server,
  Database,
  Play,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { SAMPLE_VULNERABLE_APP, SAMPLE_HARDENED_APP } from '../data/samplePresets';

interface CodeInputSectionProps {
  code: CodePayload;
  onChangeCode: (tab: CodeTab, value: string) => void;
  activeTab: CodeTab;
  onSelectTab: (tab: CodeTab) => void;
  onRunAudit: () => void;
  isLoading: boolean;
  onLoadPreset: (payload: CodePayload, name: string) => void;
  hasApiKey: boolean;
  onOpenApiKeyModal: () => void;
}

export const CodeInputSection: React.FC<CodeInputSectionProps> = ({
  code,
  onChangeCode,
  activeTab,
  onSelectTab,
  onRunAudit,
  isLoading,
  onLoadPreset,
  hasApiKey,
  onOpenApiKeyModal,
}) => {
  const [copiedTab, setCopiedTab] = React.useState(false);

  const tabs: { id: CodeTab; label: string; icon: React.ElementType; ext: string; placeholder: string }[] = [
    {
      id: 'frontend',
      label: 'Frontend Code',
      icon: FileCode,
      ext: 'App.tsx / page.tsx',
      placeholder: `// Paste your React, Next.js, or HTML frontend code here...
// e.g., components calling Supabase, Stripe Checkout, or OpenAI/Anthropic APIs`
    },
    {
      id: 'backend',
      label: 'Backend / API Routes',
      icon: Server,
      ext: 'api/webhooks/route.ts',
      placeholder: `// Paste your Backend Routes, Next.js Server Actions, or Edge Functions here...
// e.g., /api/webhooks/stripe, /api/generate, or /api/auth handlers`
    },
    {
      id: 'supabase',
      label: 'Supabase SQL Schema',
      icon: Database,
      ext: 'schema.sql / migrations',
      placeholder: `-- Paste your Supabase / PostgreSQL database tables and RLS policies here...
-- e.g., CREATE TABLE profiles (...); CREATE POLICY ... ON profiles;`
    }
  ];

  const currentTabConfig = tabs.find((t) => t.id === activeTab) || tabs[0];
  const currentCode = code[activeTab];
  const lineCount = currentCode ? currentCode.split('\n').length : 0;
  const charCount = currentCode.length;

  const totalLines =
    (code.frontend ? code.frontend.split('\n').length : 0) +
    (code.backend ? code.backend.split('\n').length : 0) +
    (code.supabase ? code.supabase.split('\n').length : 0);

  const handleCopyCurrent = () => {
    if (!currentCode) return;
    navigator.clipboard.writeText(currentCode);
    setCopiedTab(true);
    setTimeout(() => setCopiedTab(false), 1500);
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all input code in all tabs?')) {
      onLoadPreset({ frontend: '', backend: '', supabase: '' }, 'Empty');
    }
  };

  return (
    <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Top Toolbar: Quick-load sample presets */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-3 bg-slate-950/70 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Target Codebase:</span>
          <span className="text-xs text-slate-500 font-mono">
            {totalLines} lines across 3 tabs
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onLoadPreset(SAMPLE_VULNERABLE_APP, 'Vulnerable')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/50 hover:border-rose-500/60 transition shadow-sm"
            title="Load realistic vibe-coded sample app with leaked Stripe secret, missing RLS, and unsigned webhooks"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Load Sample Vulnerable App</span>
          </button>

          <button
            type="button"
            onClick={() => onLoadPreset(SAMPLE_HARDENED_APP, 'Hardened')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/40 hover:border-emerald-500/60 transition"
            title="Load hardened security baseline with strict RLS and cryptographically verified webhooks"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Clean App</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
            title="Clear all tabs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40 px-2 pt-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const hasContent = Boolean(code[tab.id]?.trim());

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-cyan-300 border-t border-x border-slate-800 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {hasContent && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-cyan-400' : 'bg-slate-500'
                    }`}
                  />
                )}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Code stats & copy */}
        <div className="flex items-center gap-2 pr-3 py-1 text-slate-500 text-[11px] font-mono">
          <span className="hidden sm:inline text-slate-600">{currentTabConfig.ext}</span>
          <span className="hidden sm:inline">•</span>
          <span>{lineCount} lines</span>
          <span>({charCount} chars)</span>
          <button
            type="button"
            onClick={handleCopyCurrent}
            className="p-1 hover:text-slate-200 transition"
            title="Copy current tab code"
          >
            {copiedTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Textarea Editor Area */}
      <div className="relative flex-1 min-h-[340px] sm:min-h-[420px] bg-slate-950 font-mono text-xs sm:text-sm">
        <textarea
          value={currentCode}
          onChange={(e) => onChangeCode(activeTab, e.target.value)}
          placeholder={currentTabConfig.placeholder}
          spellCheck={false}
          className="w-full h-full min-h-[340px] sm:min-h-[420px] p-4 bg-transparent text-slate-200 font-mono text-xs sm:text-sm leading-relaxed placeholder:text-slate-700 outline-none resize-none focus:ring-0 selection:bg-cyan-500/25 selection:text-cyan-200"
        />

        {/* Empty state hint overlay if completely blank */}
        {!currentCode && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center text-slate-600 bg-slate-950/40">
            <p className="text-xs mb-2">Paste your vibe-coded {currentTabConfig.label.toLowerCase()} or click</p>
            <button
              type="button"
              onClick={() => onLoadPreset(SAMPLE_VULNERABLE_APP, 'Vulnerable')}
              className="pointer-events-auto px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs hover:bg-rose-900/50 transition"
            >
              Load Sample Vulnerable Vibe-Coded App
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Footer with prominent Audit CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-950/90 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-cyan-400/80"></span>
            Gemini 3.8 Flash Engine: Direct Client Fetch
          </div>
          {!hasApiKey && (
            <button
              onClick={onOpenApiKeyModal}
              className="text-amber-400 hover:text-amber-300 text-xs underline underline-offset-2 ml-1"
            >
              (No key set? Click here or run instant demo)
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRunAudit}
            disabled={isLoading || totalLines === 0}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-xl ${
              isLoading || totalLines === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98] border border-cyan-400/40'
            }`}
          >
            <Play className={`w-4 h-4 fill-current ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Scanning Codebase...' : '⚡ Run Pre-Flight Security Audit'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
