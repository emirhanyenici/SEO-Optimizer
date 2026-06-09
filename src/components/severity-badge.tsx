'use client';

import { cn } from '@/lib/utils';

type Severity = 'critical' | 'warning' | 'opportunity';

const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  opportunity: 'bg-blue-100 text-blue-700 border-blue-200',
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
