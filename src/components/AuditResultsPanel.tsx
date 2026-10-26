import React, { useState } from 'react';
import type {
  SecurityAuditResult,
  VulnerabilitySeverity,
  VulnerabilityCategory
} from '../types/security';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileCode,
  KeyRound,
  Database,
  CreditCard,
  Lock,
  Filter,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';


interface AuditResultsPanelProps {
  audit: SecurityAuditResult;
  onRerunAudit: () => void;
}

export const AuditResultsPanel: React.FC<AuditResultsPanelProps> = ({ audit, onRerunAudit }) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [copiedPatchId, setCopiedPatchId] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // Initialize all cards expanded by default
  React.useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    audit.vulnerabilities.forEach((v) => {
      initialMap[v.id] = true;
    });
    setExpandedCards(initialMap);
  }, [audit]);

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const nextMap: Record<string, boolean> = {};
    audit.vulnerabilities.forEach((v) => {
      nextMap[v.id] = true;
    });
    setExpandedCards(nextMap);
  };

  const collapseAll = () => {
    setExpandedCards({});
  };

  const handleCopyPatch = (patch: string, id: string) => {
    navigator.clipboard.writeText(patch);
    setCopiedPatchId(id);
    setTimeout(() => setCopiedPatchId(null), 2000);
  };

  // Score styling logic (0-40 Red, 41-79 Amber, 80-100 Emerald)
  const score = Math.max(0, Math.min(100, audit.security_score));
  let scoreColor = 'text-emerald-400';
  let scoreBg = 'bg-emerald-950/30 border-emerald-500/30';
  let scoreStroke = '#10b981'; // emerald-500
  let statusText = 'SECURE';
  let statusBadgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80';

  if (score <= 40) {
    scoreColor = 'text-rose-400';
    scoreBg = 'bg-rose-950/30 border-rose-500/30';
    scoreStroke = '#f43f5e'; // rose-500
    statusText = 'CRITICAL RISKS DETECTED';
    statusBadgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800/80';
  } else if (score <= 79) {
    scoreColor = 'text-amber-400';
    scoreBg = 'bg-amber-950/30 border-amber-500/30';
    scoreStroke = '#f59e0b'; // amber-500
    statusText = 'ACTION REQUIRED';
    statusBadgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800/80';
  }

  // Filter vulnerabilities
  const filteredVulnerabilities = audit.vulnerabilities.filter((v) => {
    const matchesSeverity = selectedSeverity === 'ALL' || v.severity === selectedSeverity;
    const matchesCategory = selectedCategory === 'ALL' || v.category === selectedCategory;
    return matchesSeverity && matchesCategory;
  });

  const criticalCount = audit.vulnerabilities.filter((v) => v.severity === 'CRITICAL').length;
  const highCount = audit.vulnerabilities.filter((v) => v.severity === 'HIGH').length;
  const mediumCount = audit.vulnerabilities.filter((v) => v.severity === 'MEDIUM').length;

  // Category Icon helper
  const getCategoryIcon = (category: VulnerabilityCategory) => {
    switch (category) {
      case 'SECRETS':
        return <KeyRound className="w-3.5 h-3.5 text-amber-400" />;
      case 'DATABASE_RLS':
        return <Database className="w-3.5 h-3.5 text-rose-400" />;
      case 'PAYMENTS':
        return <CreditCard className="w-3.5 h-3.5 text-cyan-400" />;
      case 'AUTH':
        return <Lock className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  // Severity Badge helper
  const getSeverityBadge = (severity: VulnerabilitySeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950/80 border border-rose-800/80 text-rose-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/80 border border-amber-800/80 text-amber-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950/80 border border-blue-800/80 text-blue-300 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            MEDIUM
          </span>
        );
    }
  };

  // Generate markdown report for export
  const generateMarkdownReport = (): string => {
    return `# VibeGuard AI — Pre-Flight Security Audit Report

**Date:** ${audit.analyzed_at || new Date().toISOString()}
**Overall Security Score:** ${audit.security_score}/100 (${audit.status})
**Vulnerabilities Found:** ${audit.vulnerabilities.length} (Critical: ${criticalCount}, High: ${highCount}, Medium: ${mediumCount})

---

## Executive Summary (For Founders)
${audit.executive_summary}

---

## Identified Vulnerabilities & Remediation Patches

${audit.vulnerabilities
  .map(
    (v, i) => `### [${i + 1}] ${v.title}
- **Vulnerability ID:** ${v.id}
- **Category:** ${v.category}
- **Severity:** ${v.severity}

#### Why this is dangerous
${v.description}

#### Vulnerable Code
\`\`\`ts
${v.vulnerable_snippet}
\`\`\`

#### Remediation Patch (Copy-Paste Fix)
\`\`\`ts
${v.remediation_patch}
\`\`\`

---`
  )
  .join('\n\n')}

*Generated automatically by VibeGuard AI Pre-Flight Scanner (Powered by Google Gemini 3.8 Flash)*
`;
  };

  const handleDownloadReport = () => {
    const md = generateMarkdownReport();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vibeguard-security-report-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Radial progress calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Banner: Score Gauge + Executive Summary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Security Score Badge Card */}
        <div
          className={`lg:col-span-4 rounded-2xl border p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl ${scoreBg}`}
        >
          <div className="relative mb-3 flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#1e293b"
                strokeWidth="8"
                fill="transparent"
              />
              {/* Animated Progress fill */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={scoreStroke}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-4xl font-extrabold tracking-tight ${scoreColor}`}>
                {score}
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                / 100
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border mb-2 ${statusBadgeColor}`}
          >
            {score <= 40 ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : score <= 79 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            {statusText}
          </span>

          <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">
            {score <= 40
              ? 'Immediate launch blocker. High risk of database compromise or payment bypass.'
              : score <= 79
              ? 'Security gaps found. Apply remediation patches before accepting live users.'
              : 'Strong security posture. Application is ready for public deployment.'}
          </p>
        </div>

        {/* Executive Summary Card for Non-Technical Founders */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Executive Risk Assessment</h3>
                  <span className="text-[11px] text-slate-400">Plain-English summary for founders &amp; product owners</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-rose-950/60 border border-rose-800/60 text-rose-300">
                  {criticalCount} Critical
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 border border-amber-800/60 text-amber-300">
                  {highCount} High
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-950/60 border border-blue-800/60 text-blue-300">
                  {mediumCount} Medium
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mb-4">
              {audit.executive_summary}
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Review each vulnerability below and click <span className="text-cyan-300 font-medium">Copy Patch</span> to fix.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition"
                title="Copy Markdown report to clipboard"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Report Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/80 border border-cyan-700/60 hover:bg-cyan-900/80 text-cyan-200 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download Report (.md)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl px-4 py-3">
        {/* Severity Filters */}
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-400 font-medium mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" /> Filter:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => {
            const isActive = selectedSeverity === sev;
            return (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {sev}
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1 text-xs">
          {['ALL', 'SECRETS', 'DATABASE_RLS', 'PAYMENTS', 'AUTH'].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                  isActive
                    ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat === 'DATABASE_RLS' ? 'RLS' : cat}
              </button>
            );
          })}
        </div>

        {/* Expand / Collapse All */}
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            Expand All
          </button>
          <span className="text-slate-700">•</span>
          <button
            onClick={collapseAll}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Vulnerabilities List */}
      <div className="space-y-4">
        {filteredVulnerabilities.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-slate-400">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-200">No vulnerabilities match the selected filter criteria.</p>
            <button
              onClick={() => {
                setSelectedSeverity('ALL');
                setSelectedCategory('ALL');
              }}
              className="mt-2 text-xs text-cyan-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          filteredVulnerabilities.map((vuln, index) => {
            const isExpanded = expandedCards[vuln.id] ?? true;
            const isPatchCopied = copiedPatchId === vuln.id;

            return (
              <div
                key={vuln.id || index}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl overflow-hidden shadow-xl transition-all"
              >
                {/* Vulnerability Header */}
                <div
                  onClick={() => toggleExpand(vuln.id)}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-850/50 select-none transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {getCategoryIcon(vuln.category)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-slate-400 font-semibold">
                          [{vuln.id || `VIBE-00${index + 1}`}]
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{vuln.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Category: {vuln.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getSeverityBadge(vuln.severity)}
                    <button className="text-slate-400 hover:text-slate-200 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Collapsible Card Body */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-slate-800/80 bg-slate-950/40 space-y-4">
                    {/* Exploit Risk Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="font-semibold text-rose-400 block mb-1">
                        ⚠️ Exploit Scenario:
                      </span>
                      {vuln.description}
                    </div>

                    {/* Side-by-Side or Stacked Code Comparison */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Vulnerable Code */}
                      <div className="flex flex-col rounded-xl overflow-hidden border border-rose-900/40 bg-slate-950">
                        <div className="flex items-center justify-between px-3 py-2 bg-rose-950/30 border-b border-rose-900/40">
                          <span className="text-[11px] font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Vulnerable Code Snippet
                          </span>
                        </div>
                        <div className="p-3 font-mono text-xs text-rose-200/90 overflow-x-auto leading-relaxed max-h-60">
                          <pre>{vuln.vulnerable_snippet}</pre>
                        </div>
                      </div>

                      {/* Remediation Patch */}
                      <div className="flex flex-col rounded-xl overflow-hidden border border-emerald-900/40 bg-slate-950">
                        <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border-b border-emerald-900/40">
                          <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Remediation Patch (Fix)
                          </span>
                          <button
                            onClick={() => handleCopyPatch(vuln.remediation_patch, vuln.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80 transition"
                            title="Copy patch to clipboard"
                          >
                            {isPatchCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Patch</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-3 font-mono text-xs text-emerald-200/90 overflow-x-auto leading-relaxed max-h-60">
                          <pre>{vuln.remediation_patch}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Re-scan Callout */}
      <div className="flex items-center justify-between p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <div className="text-xs text-slate-400">
          Fixed the issues? Update your input code above and re-scan anytime.
        </div>
        <button
          onClick={onRerunAudit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Re-Run Audit</span>
        </button>
      </div>
    </div>
  );
};
