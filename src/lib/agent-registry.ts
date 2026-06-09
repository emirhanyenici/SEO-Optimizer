import type { AgentId } from '@/types/agents';

import { TECHNICAL_AUDITOR_SYSTEM_PROMPT } from '@/agents/technical-auditor/system-prompt';
import { PAGE_SPEED_SYSTEM_PROMPT } from '@/agents/page-speed/system-prompt';
import { META_OPTIMIZER_SYSTEM_PROMPT } from '@/agents/meta-optimizer/system-prompt';
import { INTERNAL_LINK_SYSTEM_PROMPT } from '@/agents/internal-link/system-prompt';
import { SEMANTIC_CONTENT_SYSTEM_PROMPT } from '@/agents/semantic-content/system-prompt';
import { CANNIBALIZATION_SYSTEM_PROMPT } from '@/agents/cannibalization/system-prompt';
import { COMPETITOR_GAP_SYSTEM_PROMPT } from '@/agents/competitor-gap/system-prompt';
import { AI_VISIBILITY_SYSTEM_PROMPT } from '@/agents/ai-visibility/system-prompt';
import { COMPANY_INTELLIGENCE_SYSTEM_PROMPT } from '@/agents/company-intelligence/system-prompt';
import { FEEDBACK_ANALYZER_SYSTEM_PROMPT } from '@/agents/feedback-analyzer/system-prompt';
import { BLOG_WRITER_SYSTEM_PROMPT } from '@/agents/blog-writer/system-prompt';

const SYSTEM_PROMPTS: Record<AgentId, string> = {
  'technical-auditor': TECHNICAL_AUDITOR_SYSTEM_PROMPT,
  'page-speed': PAGE_SPEED_SYSTEM_PROMPT,
  'meta-optimizer': META_OPTIMIZER_SYSTEM_PROMPT,
  'internal-link': INTERNAL_LINK_SYSTEM_PROMPT,
  'semantic-content': SEMANTIC_CONTENT_SYSTEM_PROMPT,
  'cannibalization': CANNIBALIZATION_SYSTEM_PROMPT,
  'competitor-gap': COMPETITOR_GAP_SYSTEM_PROMPT,
  'ai-visibility': AI_VISIBILITY_SYSTEM_PROMPT,
  'company-intelligence': COMPANY_INTELLIGENCE_SYSTEM_PROMPT,
  'feedback-analyzer': FEEDBACK_ANALYZER_SYSTEM_PROMPT,
  'blog-writer': BLOG_WRITER_SYSTEM_PROMPT,
};

export function getAgentSystemPrompt(agentId: AgentId): string {
  return SYSTEM_PROMPTS[agentId];
}
