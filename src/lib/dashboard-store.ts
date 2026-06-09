import type { AgentId, AgentState, AgentResult, SSEEvent } from '@/types/agents';
import type { FinalSEOReport } from '@/types/seo';

export const ALL_AGENT_IDS: AgentId[] = [
  'technical-auditor', 'page-speed', 'meta-optimizer', 'ai-visibility', 'company-intelligence',
  'internal-link', 'semantic-content',
  'cannibalization', 'competitor-gap', 'feedback-analyzer',
  'blog-writer',
];

export function makeInitialAgentStates(): Record<AgentId, AgentState> {
  return Object.fromEntries(
    ALL_AGENT_IDS.map((id) => [id, { id, status: 'pending' as const }])
  ) as Record<AgentId, AgentState>;
}

export interface DashboardRun {
  id: string;
  url: string;
  keyword?: string;
  startedAt: number;
  completedAt?: number;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  agentStates: Record<AgentId, AgentState>;
  report?: FinalSEOReport;
  events: SSEEvent[];
  error?: string;
  mode: 'full' | 'single';
  singleAgentId?: AgentId;
}

export type DashboardAction =
  | { type: 'LOAD_STORAGE'; runs: DashboardRun[] }
  | { type: 'START_RUN'; run: DashboardRun }
  | { type: 'UPDATE_AGENT'; runId: string; agentId: AgentId; update: Partial<AgentState> }
  | { type: 'ADD_EVENT'; runId: string; event: SSEEvent }
  | { type: 'COMPLETE_RUN'; runId: string; report: FinalSEOReport; completedAt: number }
  | { type: 'FAIL_RUN'; runId: string; error: string }
  | { type: 'STOP_RUN'; runId: string }
  | { type: 'DELETE_RUN'; runId: string }
  | { type: 'CLEAR_COMPLETED' };

export interface DashboardState {
  runs: DashboardRun[];
  loaded: boolean;
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'LOAD_STORAGE':
      return { ...state, runs: action.runs, loaded: true };

    case 'START_RUN':
      return { ...state, runs: [action.run, ...state.runs] };

    case 'UPDATE_AGENT':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id !== action.runId ? r : {
            ...r,
            agentStates: {
              ...r.agentStates,
              [action.agentId]: { ...r.agentStates[action.agentId], ...action.update },
            },
          }
        ),
      };

    case 'ADD_EVENT':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id !== action.runId ? r : {
            ...r,
            events: [...r.events, action.event].slice(-200),
          }
        ),
      };

    case 'COMPLETE_RUN':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id !== action.runId ? r : {
            ...r, status: 'completed', report: action.report, completedAt: action.completedAt,
          }
        ),
      };

    case 'FAIL_RUN':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id !== action.runId || r.status !== 'running' ? r : { ...r, status: 'failed', error: action.error },
        ),
      };

    case 'STOP_RUN':
      return {
        ...state,
        runs: state.runs.map((r) =>
          r.id !== action.runId ? r : { ...r, status: 'stopped' },
        ),
      };

    case 'DELETE_RUN':
      return { ...state, runs: state.runs.filter((r) => r.id !== action.runId) };

    case 'CLEAR_COMPLETED':
      return { ...state, runs: state.runs.filter((r) => r.status !== 'completed') };

    default:
      return state;
  }
}

const STORAGE_KEY = 'seo-dashboard-runs';

export function saveToStorage(runs: DashboardRun[]) {
  try {
    const saveable = runs.filter((r) => r.status !== 'running').slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveable));
  } catch {}
}

export function loadFromStorage(): DashboardRun[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DashboardRun[];
  } catch {
    return [];
  }
}
