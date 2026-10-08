import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { AgentPassportView } from './components/AgentPassportView';
import { AuthorizationSimView } from './components/AuthorizationSimView';
import { PromptInjectionDemoView } from './components/PromptInjectionDemoView';
import { SecurityEventsView } from './components/SecurityEventsView';
import { MonadEvidenceView } from './components/MonadEvidenceView';
import { JudgePortalModal } from './components/JudgePortalModal';

import { CapabilityGrant, ProtectedVaultState, SecurityEventLog, ConsumerType, ActionType } from './core/polaris/types';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);

  const [capabilities, setCapabilities] = useState<CapabilityGrant[]>([]);
  const [vaultState, setVaultState] = useState<ProtectedVaultState>({
    address: '0xVAULT_MONAD_METROPOLIS_TRACK4_001',
    owner: '0x1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t',
    gateAddress: '0xEXECUTION_GATE_MONAD_10143',
    balances: { MON: 2500, USDC: 4000, USDT: 1000 },
    totalValueLockedUSD: 10000,
    isPaused: false,
    noncesUsed: {},
    executedLogsCount: 2,
  });
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>([]);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);

  // Fetch state on mount
  const fetchState = async () => {
    try {
      const res = await fetch('/api/polaris/state');
      const data = await res.json();
      if (data) {
        if (data.capabilities) setCapabilities(data.capabilities);
        if (data.vault) setVaultState(data.vault);
        if (data.logs) setSecurityLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching POLARIS state:', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Run proposal
  const handleRunProposal = async (
    prompt: string,
    capabilityId: string,
    amount: number,
    targetContract?: string,
    functionName?: string,
    assetIn?: string,
    recipient?: string
  ) => {
    setIsLoadingProposal(true);
    try {
      const response = await fetch('/api/agent/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          capabilityId,
          amount,
          targetContract,
          functionName,
          assetIn,
          recipient,
        }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.updatedVaultState) setVaultState(data.updatedVaultState);
        if (data.updatedCapabilities) setCapabilities(data.updatedCapabilities);
        fetchState(); // Refresh security logs
        return data.gateResult;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProposal(false);
    }
  };

  // Grant Capability
  const handleGrantCapability = async (params: {
    capabilityId: string;
    parentCapabilityId?: string;
    consumer: string;
    consumerType: ConsumerType;
    actionType: ActionType;
    maxPerAction: number;
    allocatedBudget: number;
    validHours: number;
    allowedTokens: string[];
  }) => {
    const response = await fetch('/api/polaris/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to grant capability');
    }
    if (data.capabilities) setCapabilities(data.capabilities);
  };

  // Revoke Capability
  const handleRevokeCapability = async (capabilityId: string) => {
    const response = await fetch('/api/polaris/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capabilityId }),
    });
    const data = await response.json();
    if (data.capabilities) setCapabilities(data.capabilities);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenJudgeModal={() => setIsJudgeModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
        {activeTab === 'overview' && (
          <DashboardView
            vaultState={vaultState}
            capabilities={capabilities}
            securityLogs={securityLogs}
            onSelectTab={setActiveTab}
            onRunProposal={async (p, c, a) => {
              await handleRunProposal(p, c, a);
            }}
            isLoadingProposal={isLoadingProposal}
          />
        )}

        {activeTab === 'passport' && (
          <AgentPassportView
            capabilities={capabilities}
            onGrantCapability={handleGrantCapability}
            onRevokeCapability={handleRevokeCapability}
          />
        )}

        {activeTab === 'workbench' && (
          <AuthorizationSimView
            capabilities={capabilities}
            onRunProposal={handleRunProposal}
          />
        )}

        {activeTab === 'adversarial' && <PromptInjectionDemoView />}

        {activeTab === 'audit' && <SecurityEventsView logs={securityLogs} />}

        {activeTab === 'contracts' && <MonadEvidenceView />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 md:px-8 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>POLARIS v1.0.0 — Monad Metropolis Track 4 Submission</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsJudgeModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Judge Dossier
            </button>
            <span>·</span>
            <a
              href="https://docs.monad.xyz"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200"
            >
              Monad Docs
            </a>
          </div>
        </div>
      </footer>

      <JudgePortalModal
        isOpen={isJudgeModalOpen}
        onClose={() => setIsJudgeModalOpen(false)}
      />
    </div>
  );
}
