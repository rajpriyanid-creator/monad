import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Wallet,
  Cpu,
  ArrowRight,
  RefreshCw,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { CapabilityGrant, ProtectedVaultState, SecurityEventLog } from '../core/polaris/types';

interface DashboardViewProps {
  vaultState: ProtectedVaultState;
  capabilities: CapabilityGrant[];
  securityLogs: SecurityEventLog[];
  onSelectTab: (tab: string) => void;
  onRunProposal: (prompt: string, capabilityId: string, amount: number) => Promise<void>;
  isLoadingProposal: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  vaultState,
  capabilities,
  securityLogs,
  onSelectTab,
  onRunProposal,
  isLoadingProposal,
}) => {
  const [quickPrompt, setQuickPrompt] = useState('Swap 250 USDC for MON on Kuru Flow DEX');
  const [selectedCapabilityId, setSelectedCapabilityId] = useState(capabilities[0]?.capabilityId || '');
  const [testAmount, setTestAmount] = useState(250);

  const blockedCount = securityLogs.filter((l) => l.status === 'BLOCKED').length;
  const successCount = securityLogs.filter((l) => l.status === 'SUCCESS').length;

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monad Metropolis Track 4 Infrastructure</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
              Portable Capability Infrastructure for Autonomous Agents
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              <strong className="text-cyan-300 font-semibold">The agent proposes. POLARIS authorizes. The execution account enforces. Monad executes.</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('workbench')}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl text-slate-900 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>Test Authorization Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('adversarial')}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span>Adversarial Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Protected Treasury TVL</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            ${vaultState.totalValueLockedUSD.toLocaleString()}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>2,500 MON</span>
            <span>·</span>
            <span>4,000 USDC</span>
            <span>·</span>
            <span>1,000 USDT</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Active Standing Capabilities</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-white">
            {capabilities.filter((c) => !c.revoked).length} Grants
          </div>
          <div className="text-xs text-slate-400 font-sans">
            ERC-8004 Agent #4821 Passport Active
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Blocked Attacks (Onchain)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-rose-400">
            {blockedCount} Reverts
          </div>
          <div className="text-xs text-slate-400 font-sans">
            100% Vault Preservation Rate
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Monad Network Finality</span>
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-purple-300">
            300 ms
          </div>
          <div className="text-xs text-slate-400 font-mono">
            600ms Speculative Finality
          </div>
        </div>
      </div>

      {/* Main Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Capabilities & Quick Test */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Standing Capabilities Section */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-display text-white">
                  Active Standing Capabilities
                </h2>
                <p className="text-xs text-slate-400">
                  Constrained authority granted to Agent #4821. Agent can act autonomously without per-transaction owner pre-signatures.
                </p>
              </div>
              <button
                onClick={() => onSelectTab('passport')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>View Full Passport</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((grant) => {
                const pctSpent = Math.min(
                  100,
                  Math.round((grant.spentBudget / grant.allocatedBudget) * 100)
                );
                return (
                  <div
                    key={grant.capabilityId}
                    className={`p-5 rounded-xl border transition-all ${
                      grant.revoked
                        ? 'bg-slate-950/40 border-rose-900/30 opacity-60'
                        : 'bg-slate-950/80 border-slate-800/80 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        <span className="text-xs font-mono font-semibold text-cyan-300">
                          {grant.actionType}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded">
                        {grant.consumerType === 'POLARIS_KURU_CONSUMER'
                          ? 'Kuru Flow DEX'
                          : 'Payment Vault'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Allocated Budget</span>
                          <span className="font-mono text-white font-semibold">
                            ${grant.spentBudget} / ${grant.allocatedBudget} USD
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-cyan-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${pctSpent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                          <div className="text-[10px] text-slate-400">Max Per Action</div>
                          <div className="font-mono text-slate-200 font-semibold">
                            ${grant.maxPerAction}
                          </div>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800/40">
                          <div className="text-[10px] text-slate-400">Allowed Assets</div>
                          <div className="font-mono text-slate-200 font-semibold truncate">
                            {grant.assetScope.allowedTokens.join(', ')}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 truncate pt-1">
                        ID: {grant.capabilityId}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick AI Agent Proposal Simulator */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <span>Test Autonomous Agent Proposal</span>
              </h2>
              <p className="text-xs text-slate-400">
                Type an agent prompt to run through the server-side LLM proposal generator and POLARIS ExecutionGate.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={quickPrompt}
                  onChange={(e) => setQuickPrompt(e.target.value)}
                  placeholder="e.g. Swap 250 USDC for MON on Kuru Flow DEX"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  onClick={() =>
                    onRunProposal(quickPrompt, selectedCapabilityId, testAmount)
                  }
                  disabled={isLoadingProposal}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {isLoadingProposal ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-slate-950" />
                  )}
                  <span>Propose & Evaluate</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400">Preset Scenarios:</span>
                <button
                  onClick={() => {
                    setQuickPrompt('Swap 250 USDC for MON on Kuru Flow DEX');
                    setTestAmount(250);
                    setSelectedCapabilityId('0xroot_defi_monad_001');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
                >
                  Valid $250 Swap (Pass)
                </button>
                <button
                  onClick={() => {
                    setQuickPrompt('Swap $700 USDC for MON on Kuru Flow DEX');
                    setTestAmount(700);
                    setSelectedCapabilityId('0xroot_defi_monad_001');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-rose-300 font-mono text-[11px]"
                >
                  $700 Swap (Exceeds Max)
                </button>
                <button
                  onClick={() => {
                    setQuickPrompt('Pay merchant invoice for $200 USDC');
                    setTestAmount(200);
                    setSelectedCapabilityId('0xgrant_payment_usdc_002');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
                >
                  Valid $200 Invoice (Pass)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live Security Event Ledger */}
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-display text-white">
                Security Audit Stream
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                Envio HyperIndex
              </span>
            </div>

            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {securityLogs.map((log) => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 rounded-xl border space-y-2 transition-all ${
                      isSuccess
                        ? 'bg-slate-950/60 border-emerald-900/30'
                        : 'bg-slate-950/90 border-rose-900/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs font-semibold ${
                            isSuccess ? 'text-emerald-300' : 'text-rose-300'
                          }`}
                        >
                          {log.status === 'SUCCESS' ? 'AUTHORIZED' : 'BLOCKED'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-200 font-medium">
                      {log.consumerName} · ${log.amount} {log.asset} ({log.actionType})
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug">
                      {log.reason}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/40">
                      <span>Tx: {log.txHash.substring(0, 14)}...</span>
                      <span>Gas: {log.gasUsed}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => onSelectTab('audit')}
              className="w-full py-2 text-center text-xs text-slate-400 hover:text-cyan-300 transition-colors font-medium"
            >
              View Complete Audit History →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
