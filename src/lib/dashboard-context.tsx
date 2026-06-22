'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AgentId, AgentResult, SSEEvent } from '@/types/agents';
import type { FinalSEOReport } from '@/types/seo';
import { buildPartialReport } from './build-fallback-report';
import {
  DashboardRun,
  DashboardState,
  dashboardReducer,
  makeInitialAgentStates,
  saveToStorage,
  loadFromStorage,
  ALL_AGENT_IDS,
} from './dashboard-store';

// All analysis agents (everything except the opt-in blog-writer) — the default
// when a run is started without an explicit agent selection.
const ALL_ANALYSIS_AGENTS: AgentId[] = ALL_AGENT_IDS.filter((id) => id !== 'blog-writer');

export type { DashboardRun };

interface DashboardContextValue {
  runs: DashboardRun[];
  allEvents: Array<SSEEvent & { runId: string; runUrl: string }>;
  startRun: (url: string, keyword?: string, opts?: { includeBlog?: boolean; agents?: AgentId[] }) => void;
  startAgentRun: (
    agentId: AgentId,
    url: string,
    opts?: { keyword?: string; competitorUrls?: string[]; instructions?: string }
  ) => void;
  stopRun: (id: string) => void;
  deleteRun: (id: string) => void;
  clearCompleted: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, { runs: [], loaded: false } as DashboardState);
  const abortRefs = useRef<Map<string, AbortController>>(new Map());

  useEffect(() => {
    const stored = loadFromStorage();
    dispatch({ type: 'LOAD_STORAGE', runs: stored });
  }, []);

  useEffect(() => {
    if (state.loaded) saveToStorage(state.runs);
  }, [state.runs, state.loaded]);

  const consumeSSE = useCallback(
    async (runId: string, endpoint: string, body: object, abortController: AbortController) => {
      const startedAt = Date.now();
      const { url, keyword } = body as { url: string; keyword?: string };
      // Accumulate every agent result as it lands, so that if the stream ends
      // before a `final_report`, we can still build a partial report from the
      // agents that did finish (even just one) instead of discarding the work.
      const completed = new Map<AgentId, AgentResult>();
      let gotFinalReport = false;

      // Build + dispatch a partial report from finished agents, or fail the run
      // if nothing finished. Used when the stream ends / errors without a report.
      const finishWithoutReport = (fallbackError: string) => {
        if (completed.size > 0) {
          const report = buildPartialReport({
            url, keyword,
            agentResults: [...completed.values()],
            durationMs: Date.now() - startedAt,
          });
          dispatch({ type: 'COMPLETE_RUN_PARTIAL', runId, report, completedAt: Date.now() });
        } else {
          dispatch({ type: 'FAIL_RUN', runId, error: fallbackError });
        }
      };

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          dispatch({ type: 'FAIL_RUN', runId, error: `HTTP ${response.status}` });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop()!;
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent;
              dispatch({ type: 'ADD_EVENT', runId, event });

              if (event.type === 'agent_start' && event.agentId) {
                dispatch({
                  type: 'UPDATE_AGENT', runId, agentId: event.agentId,
                  update: { status: 'running', startedAt: event.timestamp },
                });
              } else if (event.type === 'agent_complete' && event.agentId) {
                const data = event.data as { result: AgentResult; durationMs: number };
                completed.set(event.agentId, data.result);
                dispatch({
                  type: 'UPDATE_AGENT', runId, agentId: event.agentId,
                  update: { status: 'complete', completedAt: event.timestamp, result: data.result },
                });
              } else if (event.type === 'agent_error' && event.agentId) {
                const data = event.data as { message: string };
                dispatch({
                  type: 'UPDATE_AGENT', runId, agentId: event.agentId,
                  update: { status: 'error', error: data.message },
                });
              } else if (event.type === 'final_report') {
                const data = event.data as { report: FinalSEOReport };
                gotFinalReport = true;
                dispatch({ type: 'COMPLETE_RUN', runId, report: data.report, completedAt: event.timestamp });
              }
            } catch {}
          }
        }

        // Stream closed. If no `final_report` ever arrived (timeout, server
        // killed mid-run), salvage a partial report from finished agents.
        if (!gotFinalReport) finishWithoutReport('Stream ended without final report');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (!gotFinalReport) finishWithoutReport((err as Error).message);
      } finally {
        abortRefs.current.delete(runId);
      }
    },
    []
  );

  const startRun = useCallback(
    (url: string, keyword?: string, opts?: { includeBlog?: boolean; agents?: AgentId[] }) => {
      const id = crypto.randomUUID();
      // Omitted → all (backwards compatible); an explicit list (even empty) is
      // honored as-is so "blog only" works.
      const analysisAgents = opts?.agents ?? ALL_ANALYSIS_AGENTS;
      // The full set of agents this run will show (analysis + blog when opted in).
      const visibleSet: AgentId[] = [
        ...analysisAgents,
        ...(opts?.includeBlog ? (['blog-writer'] as AgentId[]) : []),
      ];
      const run: DashboardRun = {
        id, url, keyword,
        startedAt: Date.now(),
        status: 'running',
        agentStates: makeInitialAgentStates(visibleSet),
        selectedAgents: visibleSet,
        events: [],
        mode: 'full',
      };
      dispatch({ type: 'START_RUN', run });
      const ctrl = new AbortController();
      abortRefs.current.set(id, ctrl);
      consumeSSE(id, '/api/analyze', { url, keyword, includeBlog: opts?.includeBlog, agents: analysisAgents }, ctrl);
    },
    [consumeSSE]
  );

  const startAgentRun = useCallback(
    (
      agentId: AgentId,
      url: string,
      opts?: { keyword?: string; competitorUrls?: string[]; instructions?: string }
    ) => {
      const id = crypto.randomUUID();
      const agentStates = makeInitialAgentStates();
      agentStates[agentId] = { id: agentId, status: 'pending' };
      const run: DashboardRun = {
        id, url,
        keyword: opts?.keyword,
        startedAt: Date.now(),
        status: 'running',
        agentStates,
        events: [],
        mode: 'single',
        singleAgentId: agentId,
      };
      dispatch({ type: 'START_RUN', run });
      const ctrl = new AbortController();
      abortRefs.current.set(id, ctrl);
      consumeSSE(
        id,
        `/api/agent/${agentId}`,
        {
          url,
          keyword: opts?.keyword,
          competitorUrls: opts?.competitorUrls,
          instructions: opts?.instructions,
        },
        ctrl
      );
    },
    [consumeSSE]
  );

  const stopRun = useCallback((id: string) => {
    abortRefs.current.get(id)?.abort();
    abortRefs.current.delete(id);
    dispatch({ type: 'STOP_RUN', runId: id });
  }, []);

  const deleteRun = useCallback((id: string) => {
    abortRefs.current.get(id)?.abort();
    dispatch({ type: 'DELETE_RUN', runId: id });
  }, []);

  const clearCompleted = useCallback(() => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  }, []);

  const allEvents = useMemo(() =>
    state.runs
      .flatMap((r) => r.events.map((e) => ({ ...e, runId: r.id, runUrl: r.url })))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 200),
    [state.runs]
  );

  return (
    <DashboardContext.Provider value={{
      runs: state.runs,
      allEvents,
      startRun,
      startAgentRun,
      stopRun,
      deleteRun,
      clearCompleted,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}
