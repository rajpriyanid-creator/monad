import React, { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  GitFork,
  CheckCircle2,
  AlertTriangle,
  Key,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { CapabilityGrant, ConsumerType, ActionType } from '../core/polaris/types';

interface AgentPassportViewProps {
  capabilities: CapabilityGrant[];
  onGrantCapability: (params: {
    capabilityId: string;
    parentCapabilityId?: string;
    consumer: string;
    consumerType: ConsumerType;
    actionType: ActionType;
    maxPerAction: number;
    allocatedBudget: number;
    validHours: number;
    allowedTokens: string[];
  }) => Promise<void>;
  onRevokeCapability: (capabilityId: string) => Promise<void>;
}

export const AgentPassportView: React.FC<AgentPassportViewProps> = ({
  capabilities,
  onGrantCapability,
  onRevokeCapability,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // New Grant Form State
  const [parentCapabilityId, setParentCapabilityId] = useState('');
  const [consumerType, setConsumerType] = useState<ConsumerType>('POLARIS_KURU_CONSUMER');
  const [actionType, setActionType] = useState<ActionType>('SWAP');
  const [maxPerAction, setMaxPerAction] = useState(250);
  const [allocatedBudget, setAllocatedBudget] = useState(500);
  const [validHours, setValidHours] = useState(12);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const consumer =
        consumerType === 'POLARIS_KURU_CONSUMER'
          ? '0x8004101438004101438004101438004101438004'
          : '0x7004101437004101437004101437004101437004';

      await onGrantCapability({
        capabilityId: `0xgrant_${Math.random().toString(16).substring(2, 8)}`,
        parentCapabilityId: parentCapabilityId || undefined,
        consumer,
        consumerType,
        actionType,
        maxPerAction: Number(maxPerAction),
        allocatedBudget: Number(allocatedBudget),
        validHours: Number(validHours),
        allowedTokens: actionType === 'SWAP' ? ['MON', 'USDC'] : ['USDC'],
      });

      setShowModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to grant capability due to attenuation rules');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-white">
              Agent Identity & Capability Passport
            </h1>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
              ERC-8004 Bound
            </span>
          </div>
          <p className="text-xs text-slate-400">
            One Agent. One Capability Passport. Many Applications. EIP-712 Structured Grants on Monad.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Issue New Capability Grant</span>
        </button>
      </div>

      {/* ERC-8004 Agent Identity Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/30 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-lg shrink-0">
              #4821
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-display text-white">
                  TreasuryBot Alpha
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                  Identity Registered
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Agent ID: 0x8004_AGENT_4821_TREASURY_BOT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Owner / Issuer</span>
              <span className="text-slate-200">0x1A2b...R9S0</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Monad Chain</span>
              <span className="text-cyan-300">Testnet 10143</span>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active Grants</span>
              <span className="text-emerald-400">{capabilities.filter((c) => !c.revoked).length} Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Parent-Child Capability Hierarchy Tree */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-cyan-400" />
            <span>Capability Partitioning & Attenuation Tree</span>
          </h2>
          <p className="text-xs text-slate-400">
            Child capabilities inherit parent constraints and deduct budget partitions to prevent cross-consumer double spending.
          </p>
        </div>

        <div className="space-y-4">
          {capabilities.map((grant) => {
            const isChild = !!grant.parentCapabilityId;
            return (
              <div
                key={grant.capabilityId}
                className={`p-5 rounded-xl border transition-all ${
                  isChild ? 'ml-0 md:ml-8 border-cyan-800/40 bg-slate-950/90' : 'border-slate-800 bg-slate-950/60'
                } ${grant.revoked ? 'opacity-50' : ''}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          isChild
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                            : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                        }`}
                      >
                        {isChild ? 'CHILD ATTENUATED GRANT' : 'ROOT STANDING GRANT'}
                      </span>
                      <span className="text-xs font-semibold text-white font-mono">
                        {grant.actionType}
                      </span>
                      {grant.revoked && (
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 border border-rose-800/50 px-2 py-0.5 rounded">
                          REVOKED ONCHAIN
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-300 font-sans">
                      Consumer Target: <strong className="text-cyan-300">{grant.consumerType}</strong> ({grant.consumer})
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                      <span>Max/Action: <strong className="text-white">${grant.maxPerAction}</strong></span>
                      <span>Total Budget: <strong className="text-white">${grant.allocatedBudget}</strong></span>
                      <span>Remaining: <strong className="text-emerald-400">${grant.remainingBudget}</strong></span>
                      <span>Nonce: <strong className="text-white">{grant.nonce}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!grant.revoked && (
                      <button
                        onClick={() => onRevokeCapability(grant.capabilityId)}
                        className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke Grant</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grant Capability Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <span>Issue EIP-712 Capability Grant</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleGrantSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Parent Capability (Optional Attenuation)</label>
                <select
                  value={parentCapabilityId}
                  onChange={(e) => setParentCapabilityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="">None (Root Capability)</option>
                  {capabilities.map((c) => (
                    <option key={c.capabilityId} value={c.capabilityId}>
                      {c.capabilityId} (${c.remainingBudget} remaining)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Consumer Application</label>
                  <select
                    value={consumerType}
                    onChange={(e) =>
                      setConsumerType(e.target.value as ConsumerType)
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="POLARIS_KURU_CONSUMER">Kuru Flow DEX</option>
                    <option value="POLARIS_PAYMENT_VAULT">Polaris Payment Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value as ActionType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="SWAP">SWAP</option>
                    <option value="PAYMENT">PAYMENT</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Max Per Action ($)</label>
                  <input
                    type="number"
                    value={maxPerAction}
                    onChange={(e) => setMaxPerAction(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Total Budget ($)</label>
                  <input
                    type="number"
                    value={allocatedBudget}
                    onChange={(e) => setAllocatedBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Validity Window (Hours)</label>
                <input
                  type="number"
                  value={validHours}
                  onChange={(e) => setValidHours(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                <div className="text-cyan-400 font-semibold">EIP-712 Signature Preview:</div>
                <div>Domain: PolarisCapabilityRegistry (Monad #10143)</div>
                <div>Issuer: 0x1A2b...R9S0</div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing & Granting...' : 'Sign & Issue Grant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
