import React from 'react';
import { Shield, Sparkles, Key, Terminal } from 'lucide-react';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  onOpenHelpModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ apiKey, onOpenApiKeyModal }) => {
  const isKeyConfigured = Boolean(apiKey && apiKey.trim());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Badge */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 shadow-inner shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-950"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                VibeGuard <span className="text-cyan-400">AI</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Vibe-Code Pre-Flight Scanner
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Pre-flight static AppSec auditor for <span className="text-slate-300 font-medium">Lovable</span>, <span className="text-slate-300 font-medium">Bolt</span>, <span className="text-slate-300 font-medium">v0</span> &amp; <span className="text-slate-300 font-medium">Cursor</span> apps
            </p>
          </div>
        </div>

        {/* Right Section: API Key configuration status & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenApiKeyModal}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isKeyConfigured
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300 hover:border-emerald-500/60 hover:bg-emerald-950/20'
                : 'bg-slate-900/90 border-amber-500/30 text-amber-300 hover:border-amber-500/60 hover:bg-amber-950/20 shadow-sm shadow-amber-500/5'
            }`}
          >
            <Key className="w-3.5 h-3.5 opacity-80 group-hover:scale-110 transition" />
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isKeyConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="hidden md:inline font-mono">
                {isKeyConfigured ? 'Gemini 3.8 Flash Connected' : 'Configure Gemini Key'}
              </span>
              <span className="md:hidden">
                {isKeyConfigured ? 'Key Set' : 'Set Key'}
              </span>
            </span>
          </button>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
            title="Pre-flight security checklist"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>v1.0.0</span>
          </a>
        </div>
      </div>
    </header>
  );
};
