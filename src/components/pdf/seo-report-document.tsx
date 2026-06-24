import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { FinalSEOReport } from '@/types/seo';
import { AGENT_LABELS } from '@/types/agents';

// The built-in Helvetica only embeds Latin-1, so Turkish glyphs (ı, ş, ğ, İ, ç)
// render as garbage (ı→1, ş→_, İ→0). Embed Geist (full Turkish coverage, with a
// real bold weight for headings) and use it everywhere.
Font.register({
  family: 'Geist',
  fonts: [
    { src: '/fonts/Geist-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Geist-Bold.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  document: {
    fontFamily: 'Geist',
    fontSize: 11,
  },
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    color: '#111111',
  },
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  scoreCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  urlText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 4,
  },
  metaText: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 2,
  },
  partialNote: {
    fontSize: 8,
    color: '#b45309',
    marginTop: 4,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryBox: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 10,
    color: '#374151',
    lineHeight: 1.5,
  },
  priorityTable: {
    marginBottom: 12,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },
  rankCell: {
    width: '8%',
    fontWeight: 'bold',
  },
  severityCell: {
    width: '12%',
  },
  titleCell: {
    width: '25%',
    marginRight: 8,
  },
  effortCell: {
    width: '10%',
    marginRight: 8,
  },
  recommendationCell: {
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  criticalBadge: {
    backgroundColor: '#dc2626',
  },
  warningBadge: {
    backgroundColor: '#d97706',
  },
  opportunityBadge: {
    backgroundColor: '#2563eb',
  },
  effortPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  effortHigh: {
    backgroundColor: '#ef4444',
  },
  effortMedium: {
    backgroundColor: '#f59e0b',
  },
  effortLow: {
    backgroundColor: '#10b981',
  },
  agentSection: {
    marginBottom: 20,
  },
  agentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  findingCard: {
    backgroundColor: '#f9fafb',
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  findingCardCritical: {
    borderLeftColor: '#dc2626',
  },
  findingCardWarning: {
    borderLeftColor: '#d97706',
  },
  findingCardOpportunity: {
    borderLeftColor: '#2563eb',
  },
  findingTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 6,
  },
  findingCategory: {
    fontSize: 7,
    backgroundColor: '#e5e7eb',
    color: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginBottom: 6,
  },
  findingText: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  findingLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 2,
  },
  recommendationBox: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 3,
    marginTop: 6,
  },
  evidenceList: {
    marginTop: 6,
  },
  evidenceItem: {
    fontSize: 8,
    color: '#666666',
    marginBottom: 3,
    marginLeft: 8,
  },
  blogSection: {
    marginTop: 24,
  },
  blogTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  blogContent: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
  },
  blogH2: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111111',
    marginTop: 12,
    marginBottom: 5,
  },
  blogH3: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
  },
  blogParagraph: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  blogListItem: {
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
    marginBottom: 3,
    marginLeft: 10,
  },
  noFindingsText: {
    fontSize: 9,
    color: '#999999',
    fontStyle: 'italic',
  },
});

const truncate = (text: string, maxLength: number = 500): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

const stripHtml = (html: string): string => {
  return html
    // Replace tags with a space so block elements don't fuse adjacent words
    // ("altınaHasarsızlık" → "altına Hasarsızlık").
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

type BlogBlock = { type: 'h2' | 'h3' | 'li' | 'p'; text: string };

// react-pdf has no HTML renderer, so flatten the blog HTML into ordered blocks
// (heading / list-item / paragraph) and style each one. This preserves the
// heading hierarchy that a single stripHtml() call would otherwise collapse
// into one undifferentiated blob. Defensive: any text outside a known block
// tag is emitted as a paragraph so malformed HTML never drops content.
const parseBlogHtml = (html: string): BlogBlock[] => {
  const blocks: BlogBlock[] = [];
  const tagRe = /<(h2|h3|li|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html)) !== null) {
    const type = match[1].toLowerCase() as BlogBlock['type'];
    const text = stripHtml(match[2]);
    if (text) blocks.push({ type, text });
  }
  // Fallback: no recognizable block tags (e.g. plain text) — render it whole.
  if (blocks.length === 0) {
    const text = stripHtml(html);
    if (text) blocks.push({ type: 'p', text });
  }
  return blocks;
};

const getSeverityColor = (
  severity: 'critical' | 'warning' | 'opportunity'
): string => {
  switch (severity) {
    case 'critical':
      return '#dc2626';
    case 'warning':
      return '#d97706';
    case 'opportunity':
      return '#2563eb';
    default:
      return '#2563eb';
  }
};

interface SEOReportDocumentProps {
  report: FinalSEOReport;
}

export function SEOReportDocument({ report }: SEOReportDocumentProps) {
  const scoreColor = getSeverityColor(
    report.overallScore >= 80
      ? 'opportunity'
      : report.overallScore >= 50
        ? 'warning'
        : 'critical'
  );

  const formattedDate = new Date(report.analyzedAt).toLocaleString('en-US');
  const durationSec = Math.round(report.totalDurationMs / 1000);

  return (
    <Document style={styles.document}>
      <Page style={styles.page} size="A4">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.appName}>SEO Optimizer</Text>
            <View
              style={[
                styles.scoreCircle,
                { borderColor: scoreColor, backgroundColor: `${scoreColor}15` },
              ]}
            >
              <Text style={[styles.scoreText, { color: scoreColor }]}>
                {report.overallScore}
              </Text>
            </View>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.urlText}>{report.url}</Text>
            {report.keyword && (
              <Text style={styles.metaText}>
                Target Keyword: {report.keyword}
              </Text>
            )}
            <Text style={styles.metaText}>Analysis Date: {formattedDate}</Text>
            <Text style={styles.metaText}>Total Duration: {durationSec}s</Text>
            {report.partial && (
              <Text style={styles.partialNote}>
                Partial report — some agents did not finish; results were collected only from the
                completed agents.
              </Text>
            )}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryText}>{report.summary}</Text>
          </View>
        </View>

        {/* Priority Actions */}
        {report.priorityActions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Priority Actions</Text>
            <View style={styles.priorityTable}>
              {report.priorityActions.slice(0, 10).map((action) => (
                <View key={action.rank} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.rankCell]}>
                    {action.rank}
                  </Text>
                  <View style={styles.severityCell}>
                    <View
                      style={[
                        styles.severityBadge,
                        action.severity === 'critical'
                          ? styles.criticalBadge
                          : action.severity === 'warning'
                            ? styles.warningBadge
                            : styles.opportunityBadge,
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          fontWeight: 'bold',
                          color: '#ffffff',
                        }}
                      >
                        {action.severity === 'critical'
                          ? 'Critical'
                          : action.severity === 'warning'
                            ? 'Warning'
                            : 'Opportunity'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.titleCell,
                      { fontWeight: 'bold' },
                    ]}
                  >
                    {action.title}
                  </Text>
                  <View style={styles.effortCell}>
                    <View
                      style={[
                        styles.effortPill,
                        action.effort === 'high'
                          ? styles.effortHigh
                          : action.effort === 'medium'
                            ? styles.effortMedium
                            : styles.effortLow,
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 7,
                          fontWeight: 'bold',
                          color: '#ffffff',
                        }}
                      >
                        {action.effort === 'high'
                          ? 'High'
                          : action.effort === 'medium'
                            ? 'Medium'
                            : 'Low'}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.tableCell, styles.recommendationCell]}
                  >
                    {action.recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Detailed Findings by Agent */}
        {report.agentResults
          .filter((r) => r.agentId !== 'blog-writer' && r.findings.length > 0)
          .map((agentResult) => (
            <View key={agentResult.agentId} style={styles.agentSection}>
              <Text style={styles.agentTitle}>
                {AGENT_LABELS[agentResult.agentId]}
              </Text>
              {agentResult.findings.map((finding) => (
                <View
                  key={finding.id}
                  style={[
                    styles.findingCard,
                    finding.severity === 'critical'
                      ? styles.findingCardCritical
                      : finding.severity === 'warning'
                        ? styles.findingCardWarning
                        : styles.findingCardOpportunity,
                  ]}
                >
                  <Text style={styles.findingTitle}>{finding.title}</Text>
                  <Text style={styles.findingCategory}>{finding.category}</Text>
                  <Text style={styles.findingText}>
                    {finding.description}
                  </Text>
                  <Text style={styles.findingLabel}>Recommendation:</Text>
                  <View style={styles.recommendationBox}>
                    <Text style={styles.findingText}>
                      {finding.recommendation}
                    </Text>
                  </View>
                  {Array.isArray(finding.evidence) && finding.evidence.length > 0 && (
                    <View style={styles.evidenceList}>
                      <Text style={styles.findingLabel}>Evidence:</Text>
                      {finding.evidence.slice(0, 5).map((ev, idx) => (
                        <Text key={idx} style={styles.evidenceItem}>
                          • {truncate(typeof ev === 'string' ? ev : String(ev), 80)}
                        </Text>
                      ))}
                    </View>
                  )}
                  {finding.falsifiability && (
                    <Text style={styles.findingText}>
                      How we&apos;d know it failed: {finding.falsifiability}
                    </Text>
                  )}
                  {finding.leadingIndicator && (
                    <Text style={styles.findingText}>
                      Leading indicator: {finding.leadingIndicator}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))}

        {/* Blog Article (if present) */}
        {report.blog_article && (
          <View style={styles.blogSection}>
            <Text style={styles.blogTitle}>Blog Content (Preview)</Text>
            {parseBlogHtml(report.blog_article.html).map((block, i) => (
              <Text
                key={i}
                style={
                  block.type === 'h2'
                    ? styles.blogH2
                    : block.type === 'h3'
                      ? styles.blogH3
                      : block.type === 'li'
                        ? styles.blogListItem
                        : styles.blogParagraph
                }
              >
                {block.type === 'li' ? `• ${block.text}` : block.text}
              </Text>
            ))}
          </View>
        )}

        {/* Footer with page numbers */}
        <Text
          style={styles.pageFooter}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}
