'use client';

import { cn } from '@/lib/utils';

type Severity = 'critical' | 'warning' | 'opportunity';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-400/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  opportunity: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
};

const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  opportunity: 'Opportunity',
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border',
        SEVERITY_STYLES[severity],
        className
      )}
    >
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
