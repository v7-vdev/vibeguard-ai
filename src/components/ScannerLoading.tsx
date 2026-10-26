import React, { useEffect, useState } from 'react';
import { Shield, Sparkles, Terminal, CheckCircle2, Loader2, KeyRound, Database, CreditCard } from 'lucide-react';

interface ScannerLoadingProps {
  filesCount: number;
  linesCount: number;
}

export const ScannerLoading: React.FC<ScannerLoadingProps> = ({ filesCount, linesCount }) => {
  const steps = [
    { id: 1, label: 'Parsing frontend AST & environment variable bindings...', icon: KeyRound },
    { id: 2, label: 'Deep bundle scan: searching for leaked sk_live & service role keys...', icon: KeyRound },
    { id: 3, label: 'PostgreSQL static analysis: auditing Supabase RLS policies & recursive loops...', icon: Database },
    { id: 4, label: 'Payment integrity check: validating Stripe webhook HMAC signatures & client-side credit logic...', icon: CreditCard },
    { id: 5, label: 'Gemini 3.8 Flash AppSec engine: synthesizing executive risk summary & copy-paste remediation patches...', icon: Sparkles }
  ];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="relative w-full bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 sm:p-8 text-slate-200">
      {/* High-Tech Animated Radar Sweep Bar */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-radar-sweep pointer-events-none opacity-80" />

      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
        {/* Pulsing Scanner HUD Orb */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Shield className="w-10 h-10 animate-pulse text-cyan-400" />
          </div>
          <div className="absolute -inset-2 rounded-full border border-cyan-500/20 animate-ping opacity-40 pointer-events-none" />
          <div className="absolute -bottom-1 -right-1 bg-blue-600 p-1.5 rounded-full text-white shadow-md">
            <Loader2 className="w-4 h-4 animate-spin" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
          <span>Running Pre-Flight Security Audit</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">
          Evaluating {filesCount} files ({linesCount} lines) across 4 high-risk attack vectors
        </p>

        {/* Security Audit Progress Steps */}
        <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-xl p-4 text-left space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              STATIC_ANALYSIS_PROGRESS
            </span>
            <span>{Math.min(100, Math.round(((currentStepIndex + 1) / steps.length) * 100))}%</span>
          </div>

          <div className="space-y-2.5">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;


              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-2.5 transition-all duration-300 ${
                    isCurrent
                      ? 'text-cyan-300 font-semibold pl-1 border-l-2 border-cyan-400'
                      : isCompleted
                      ? 'text-slate-400 opacity-90'
                      : 'text-slate-600'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-700" />
                    )}
                  </div>
                  <span className="text-[11px] leading-tight flex-1">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Gemini 3.8 Flash API connection streaming</span>
        </div>
      </div>
    </div>
  );
};
