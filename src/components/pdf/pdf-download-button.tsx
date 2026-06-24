'use client';

import { useState, useCallback } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { FinalSEOReport } from '@/types/seo';

interface Props {
  report: FinalSEOReport;
  className?: string;
}

export function PdfDownloadButton({ report, className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    try {
      const { pdf } = await import('@react-pdf/renderer');
      const { SEOReportDocument } = await import('./seo-report-document');

      const React = (await import('react')).default;
      const docElement = React.createElement(SEOReportDocument, { report });
      const pdfDoc = pdf(docElement as any);
      const blob = await pdfDoc.toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      try {
        const hostname = new URL(report.url).hostname.replace(/\./g, '-');
        const date = new Date(report.analyzedAt).toISOString().slice(0, 10);
        a.download = `seo-report-${hostname}-${date}.pdf`;
      } catch {
        a.download = `seo-report-${new Date().toISOString().slice(0, 10)}.pdf`;
      }

      a.href = url;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setLoading(false);
    }
  }, [report]);

  const defaultClassName =
    'flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      aria-label="Download PDF report"
      className={className || defaultClassName}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Download className="h-3 w-3" />
      )}
      {loading ? 'Preparing…' : 'Download Report'}
    </button>
  );
}
