'use client';

import { useEffect, useRef } from 'react';
import { useDashboard } from '@/lib/dashboard-context';
import { AGENT_LABELS, type SSEEventType } from '@/types/agents';

const EVENT_STYLES: Record<SSEEventType, { label: string; className: string }> = {
  agent_start: { label: 'started', className: 'bg-blue-500/15 text-blue-300' },
  agent_complete: { label: 'completed', className: 'bg-green-500/15 text-green-300' },
  agent_error: { label: 'error', className: 'bg-red-500/15 text-red-300' },
  orchestrator_thinking: { label: 'thinking', className: 'bg-gray-500/15 text-gray-400' },
  final_report: { label: 'report ready', className: 'bg-purple-500/15 text-purple-300' },
};

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return `${Math.floor(diff / 3600)}h`;
}

export function ActivityLog() {
  const { allEvents } = useDashboard();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
    if (isAtBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allEvents.length]);

  return (
    <aside className="flex-shrink-0 w-[260px] border-l border-white/[0.06] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300 uppercase tracking-widest">Activity</span>
        <span className="text-xs text-gray-600 border border-white/[0.06] px-1.5 py-0.5 rounded">
          {allEvents.length}
        </span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto py-2 space-y-px">
        {allEvents.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-600 text-xs">
            No activity yet
          </div>
        ) : (
          allEvents.map((event, i) => {
            const style = EVENT_STYLES[event.type] ?? EVENT_STYLES.orchestrator_thinking;
            const hostname = (() => {
              try { return new URL(event.runUrl).hostname.replace('www.', ''); } catch { return event.runUrl.slice(0, 20); }
            })();
            return (
              <div
                key={`${event.runId}-${event.timestamp}-${i}`}
                className="px-3 py-2 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${style.className}`}>
                      {style.label}
                    </span>
                    {event.agentId && (
                      <span className="text-xs text-gray-400 truncate">
                        {AGENT_LABELS[event.agentId]}
                      </span>
                    )}
                    {event.type === 'final_report' && (
                      <span className="text-xs text-gray-400">report</span>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-gray-600">
                    {timeAgo(event.timestamp)}
                  </span>
                </div>
                <p className="text-[10px] text-gray-600 truncate">{hostname}</p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </aside>
  );
}
