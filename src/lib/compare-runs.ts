// Deterministic "drift" diff between two runs of the same URL — no LLM. Compares
// the SEO-critical signals captured in each run's agent `raw` blocks (title,
// meta, canonical, robots, schema, status, score) and reports what changed,
// flagging likely regressions. Inspired by claude-seo's seo-drift skill, reduced
// to the fields our pipeline already records.

import type { DashboardRun } from './dashboard-store';
import type { AgentId, Finding } from '@/types/agents';

export interface DriftChange {
  field: string;
  label: string;
  before: string;
  after: string;
  severity: 'critical' | 'warning' | 'info';
  direction: 'regression' | 'improvement' | 'neutral';
}

type Raw = Record<string, unknown>;

function rawFor(run: DashboardRun, agentId: AgentId): Raw {
  const r = run.report?.agentResults.find((a) => a.agentId === agentId)?.raw;
  return (r && typeof r === 'object' ? (r as Raw) : {}) as Raw;
}

function show(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (Array.isArray(v)) return v.length ? v.join(', ') : '—';
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function eq(a: unknown, b: unknown): boolean {
  return show(a) === show(b);
}

function countFindings(run: DashboardRun, severity: Finding['severity']): number {
  return (run.report?.agentResults ?? []).reduce(
    (n, r) => n + r.findings.filter((f) => f.severity === severity).length,
    0,
  );
}

/**
 * Compare a previous run against the current one. Both must be runs of the same
 * URL with completed reports. Returns only the fields that actually changed.
 */
export function compareRuns(prev: DashboardRun, current: DashboardRun): DriftChange[] {
  const changes: DriftChange[] = [];
  const add = (c: DriftChange) => changes.push(c);

  const pTech = rawFor(prev, 'technical-auditor');
  const cTech = rawFor(current, 'technical-auditor');
  const pMeta = rawFor(prev, 'meta-optimizer');
  const cMeta = rawFor(current, 'meta-optimizer');

  // --- Overall score ---
  const pScore = prev.report?.overallScore;
  const cScore = current.report?.overallScore;
  if (typeof pScore === 'number' && typeof cScore === 'number' && pScore !== cScore) {
    add({
      field: 'overallScore', label: 'SEO Score',
      before: String(pScore), after: String(cScore),
      severity: 'info',
      direction: cScore > pScore ? 'improvement' : 'regression',
    });
  }

  // --- Meta / title ---
  const pTitle = (pMeta.title as Raw)?.text;
  const cTitle = (cMeta.title as Raw)?.text;
  if (!eq(pTitle, cTitle) && (pTitle !== undefined || cTitle !== undefined)) {
    add({ field: 'title', label: 'Title', before: show(pTitle), after: show(cTitle), severity: 'warning', direction: 'neutral' });
  }
  const pDesc = (pMeta.metaDescription as Raw)?.text;
  const cDesc = (cMeta.metaDescription as Raw)?.text;
  if (!eq(pDesc, cDesc) && (pDesc !== undefined || cDesc !== undefined)) {
    add({ field: 'metaDescription', label: 'Meta description', before: show(pDesc), after: show(cDesc), severity: 'warning', direction: 'neutral' });
  }
  if (!eq(pMeta.h1Count, cMeta.h1Count) && (pMeta.h1Count !== undefined || cMeta.h1Count !== undefined)) {
    add({ field: 'h1Count', label: 'H1 count', before: show(pMeta.h1Count), after: show(cMeta.h1Count), severity: 'warning', direction: 'neutral' });
  }
  for (const [key, label] of [['ogPresent', 'Open Graph'], ['twitterCardPresent', 'Twitter Card']] as const) {
    if (!eq(pMeta[key], cMeta[key]) && (pMeta[key] !== undefined || cMeta[key] !== undefined)) {
      add({ field: key, label, before: show(pMeta[key]), after: show(cMeta[key]), severity: 'info', direction: cMeta[key] ? 'improvement' : 'regression' });
    }
  }

  // --- Technical ---
  // noindex: false → true is a serious regression (deindexing risk).
  if (!eq(pTech.noindex, cTech.noindex) && (pTech.noindex !== undefined || cTech.noindex !== undefined)) {
    add({ field: 'noindex', label: 'noindex', before: show(pTech.noindex), after: show(cTech.noindex), severity: cTech.noindex ? 'critical' : 'info', direction: cTech.noindex ? 'regression' : 'improvement' });
  }
  // canonical target
  const pCanon = (pTech.canonical as Raw)?.url ?? (pTech.canonical as Raw)?.canonicalUrl;
  const cCanon = (cTech.canonical as Raw)?.url ?? (cTech.canonical as Raw)?.canonicalUrl;
  if (!eq(pCanon, cCanon) && (pCanon !== undefined || cCanon !== undefined)) {
    add({ field: 'canonical', label: 'Canonical URL', before: show(pCanon), after: show(cCanon), severity: 'critical', direction: 'neutral' });
  }
  // status code
  if (!eq(pTech.statusCode, cTech.statusCode) && (pTech.statusCode !== undefined || cTech.statusCode !== undefined)) {
    const cs = Number(cTech.statusCode);
    add({ field: 'statusCode', label: 'HTTP status', before: show(pTech.statusCode), after: show(cTech.statusCode), severity: cs >= 400 ? 'critical' : 'info', direction: cs >= 400 ? 'regression' : 'neutral' });
  }
  // sitemap
  if (!eq(pTech.sitemapFound, cTech.sitemapFound) && (pTech.sitemapFound !== undefined || cTech.sitemapFound !== undefined)) {
    add({ field: 'sitemapFound', label: 'Sitemap', before: show(pTech.sitemapFound), after: show(cTech.sitemapFound), severity: 'warning', direction: cTech.sitemapFound ? 'improvement' : 'regression' });
  }
  // schema types
  const pSchema = Array.isArray(pTech.schemaTypes) ? [...(pTech.schemaTypes as string[])].sort() : undefined;
  const cSchema = Array.isArray(cTech.schemaTypes) ? [...(cTech.schemaTypes as string[])].sort() : undefined;
  if (!eq(pSchema, cSchema) && (pSchema !== undefined || cSchema !== undefined)) {
    const lost = (pSchema ?? []).filter((t) => !(cSchema ?? []).includes(t)).length > 0;
    add({ field: 'schemaTypes', label: 'Schema types', before: show(pSchema), after: show(cSchema), severity: lost ? 'warning' : 'info', direction: lost ? 'regression' : 'improvement' });
  }

  // --- Finding counts ---
  for (const sev of ['critical', 'warning'] as const) {
    const p = countFindings(prev, sev);
    const c = countFindings(current, sev);
    if (p !== c) {
      add({
        field: `findings_${sev}`,
        label: sev === 'critical' ? 'Critical findings count' : 'Warning findings count',
        before: String(p), after: String(c),
        severity: sev === 'critical' ? 'critical' : 'info',
        direction: c > p ? 'regression' : 'improvement',
      });
    }
  }

  return changes;
}

/**
 * Find the most recent completed run of the same URL that started before
 * `current`, to use as the drift baseline.
 */
export function findPreviousRun(runs: DashboardRun[], current: DashboardRun): DashboardRun | undefined {
  return runs
    .filter(
      (r) =>
        r.id !== current.id &&
        r.url === current.url &&
        r.status === 'completed' &&
        !!r.report &&
        r.startedAt < current.startedAt,
    )
    .sort((a, b) => b.startedAt - a.startedAt)[0];
}
