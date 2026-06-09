'use client';

import { useState } from 'react';
import { DashboardProvider, useDashboard, type DashboardRun } from '@/lib/dashboard-context';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { AgentSidebar } from '@/components/dashboard/agent-sidebar';
import { RunsBoard } from '@/components/dashboard/runs-board';
import { ActivityLog } from '@/components/dashboard/activity-log';
import { NewRunModal } from '@/components/dashboard/new-run-modal';
import { AgentRunModal } from '@/components/dashboard/agent-run-modal';
import { RunDetailModal } from '@/components/dashboard/run-detail-modal';
import type { AgentId } from '@/types/agents';

function DashboardInner() {
  const [showNewRun, setShowNewRun] = useState(false);
  const [agentModal, setAgentModal] = useState<AgentId | null>(null);
  const [detailRun, setDetailRun] = useState<DashboardRun | null>(null);

  const handleAgentClick = (id: AgentId | 'orchestrator') => {
    if (id === 'orchestrator') {
      setShowNewRun(true);
    } else {
      setAgentModal(id as AgentId);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020202] text-white overflow-hidden">
      <DashboardNav onNewRun={() => setShowNewRun(true)} />

      <div className="flex-1 flex overflow-hidden">
        <AgentSidebar onAgentClick={handleAgentClick} />
        <RunsBoard onViewDetails={setDetailRun} />
        <ActivityLog />
      </div>

      {showNewRun && <NewRunModal onClose={() => setShowNewRun(false)} />}
      {agentModal && <AgentRunModal agentId={agentModal} onClose={() => setAgentModal(null)} />}
      {detailRun && <RunDetailModal run={detailRun} onClose={() => setDetailRun(null)} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardInner />
    </DashboardProvider>
  );
}
