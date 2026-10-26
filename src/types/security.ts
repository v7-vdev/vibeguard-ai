export type VulnerabilityCategory = 'SECRETS' | 'DATABASE_RLS' | 'PAYMENTS' | 'AUTH';

export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM';

export type AuditStatus = 'CRITICAL' | 'WARNING' | 'SECURE';

export interface Vulnerability {
  id: string;
  category: VulnerabilityCategory;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  vulnerable_snippet: string;
  remediation_patch: string;
}

export interface SecurityAuditResult {
  security_score: number;
  status: AuditStatus;
  executive_summary: string;
  vulnerabilities: Vulnerability[];
  analyzed_at?: string;
  meta?: {
    files_scanned: number;
    lines_scanned: number;
    detected_frameworks?: string[];
  };
}

export type CodeTab = 'frontend' | 'backend' | 'supabase';

export interface CodePayload {
  frontend: string;
  backend: string;
  supabase: string;
}
