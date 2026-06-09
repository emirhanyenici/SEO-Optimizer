'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import type { AgentId, AgentResult, SSEEvent } from '@/types/agents';
import type { FinalSEOReport } from '@/types/seo';
import {
  DashboardRun,
  DashboardState,
  dashboardReducer,
  makeInitialAgentStates,
  saveToStorage,
  loadFromStorage,
} from './dashboard-store';

export type { DashboardRun };

interface DashboardContextValue {
  runs: DashboardRun[];
  allEvents: Array<SSEEvent & { runId: string; runUrl: string }>;
  startRun: (url: string, keyword?: string) => void;
  startAgentRun: (agentId: AgentId, url: string, instructions?: string) => void;
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
                dispatch({ type: 'COMPLETE_RUN', runId, report: data.report, completedAt: event.timestamp });
              }
            } catch {}
          }
        }

        dispatch({ type: 'FAIL_RUN', runId, error: 'Stream ended without final report' });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        dispatch({ type: 'FAIL_RUN', runId, error: (err as Error).message });
      } finally {
        abortRefs.current.delete(runId);
      }
    },
    []
  );

  const startRun = useCallback(
    (url: string, keyword?: string) => {
      const id = crypto.randomUUID();
      const run: DashboardRun = {
        id, url, keyword,
        startedAt: Date.now(),
        status: 'running',
        agentStates: makeInitialAgentStates(),
        events: [],
        mode: 'full',
      };
      dispatch({ type: 'START_RUN', run });
      const ctrl = new AbortController();
      abortRefs.current.set(id, ctrl);
      consumeSSE(id, '/api/analyze', { url, keyword }, ctrl);
    },
    [consumeSSE]
  );

  const startAgentRun = useCallback(
    (agentId: AgentId, url: string, instructions?: string) => {
      const id = crypto.randomUUID();
      const agentStates = makeInitialAgentStates();
      agentStates[agentId] = { id: agentId, status: 'pending' };
      const run: DashboardRun = {
        id, url,
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
      consumeSSE(id, `/api/agent/${agentId}`, { url, instructions }, ctrl);
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
