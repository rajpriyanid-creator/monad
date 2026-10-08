import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Code2,
} from 'lucide-react';
import { CapabilityGrant, ExecutionGateResult } from '../core/polaris/types';

interface AuthorizationSimViewProps {
  capabilities: CapabilityGrant[];
  onRunProposal: (
    prompt: string,
    capabilityId: string,
    amount: number,
    targetContract?: string,
    functionName?: string,
    assetIn?: string,
    recipient?: string
  ) => Promise<ExecutionGateResult | undefined>;
}

export const AuthorizationSimView: React.FC<AuthorizationSimViewProps> = ({
  capabilities,
  onRunProposal,
}) => {
  const [selectedCapabilityId, setSelectedCapabilityId] = useState(
    capabilities[0]?.capabilityId || '0xroot_defi_monad_001'
  );
  const [promptText, setPromptText] = useState('Swap 300 USDC for MON on Kuru Flow DEX');
  const [amount, setAmount] = useState(300);
  const [functionName, setFunctionName] = useState('swapExactTokensForTokens');
  const [assetIn, setAssetIn] = useState('USDC');
  const [targetContract, setTargetContract] = useState('0x8004101438004101438004101438004101438004');
  const [recipient, setRecipient] = useState('0xVAULT');

  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ExecutionGateResult | null>(null);

  const selectedGrant = capabilities.find((c) => c.capabilityId === selectedCapabilityId);

  const handleSimulate = async () => {
    setIsLoading(true);
    try {
      const res = await onRunProposal(
        promptText,
        selectedCapabilityId,
        Number(amount),
        targetContract,
        functionName,
        assetIn,
        recipient
      );
      if (res) {
        setLastResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold font-display text-white">
            POLARIS Authorization Workbench
          </h1>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
            17 Security Invariants Evaluator
          </span>
        </div>
        <p className="text-xs text-slate-400">
          The agent proposes. POLARIS authorizes. The execution account enforces. Monad executes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 Cols): Proposal Constructor */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-5">
          <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <span>Construct Agent Execution Proposal</span>
          </h2>

          <div className="space-y-4 text-xs font-sans">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Select Standing Capability</label>
              <select
                value={selectedCapabilityId}
                onChange={(e) => setSelectedCapabilityId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs"
              >
                {capabilities.map((c) => (
                  <option key={c.capabilityId} value={c.capabilityId}>
                    {c.actionType} ({c.consumerType}) — Max ${c.maxPerAction}
                  </option>
                ))}
              </select>
            </div>

            {selectedGrant && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Max Per Action:</span>
                  <span className="text-white font-bold">${selectedGrant.maxPerAction}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Remaining Budget:</span>
                  <span className="text-emerald-400 font-bold">${selectedGrant.remainingBudget}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Consumer Binding:</span>
                  <span className="text-cyan-300 truncate max-w-[180px]">{selectedGrant.consumer}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Agent Prompt Intent</label>
              <input
                type="text"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Requested Amount ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Asset</label>
                <select
                  value={assetIn}
                  onChange={(e) => setAssetIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                >
                  <option value="USDC">USDC</option>
                  <option value="MON">MON</option>
                  <option value="USDT">USDT</option>
                  <option value="UNKNOWN_TOKEN">UNKNOWN_TOKEN</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Function Call Name</label>
              <select
                value={functionName}
                onChange={(e) => setFunctionName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              >
                <option value="swapExactTokensForTokens">swapExactTokensForTokens (Kuru Swap)</option>
                <option value="payInvoice">payInvoice (Payment Vault)</option>
                <option value="approve">approve (Token Approval - Malicious)</option>
                <option value="drainVault">drainVault (Unregistered)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Target Contract Address</label>
              <input
                type="text"
                value={targetContract}
                onChange={(e) => setTargetContract(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-[11px]"
              />
            </div>

            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4 text-slate-950" />
              )}
              <span>Run Execution Gate Evaluation</span>
            </button>
          </div>
        </div>

        {/* Right Column (7 Cols): Gate Evaluation Results & Invariants */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>POLARIS ExecutionGate Verdict</span>
            </h2>
            {lastResult && (
              <span
                className={`text-xs font-mono font-bold px-3 py-1 rounded-lg ${
                  lastResult.authorized
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}
              >
                {lastResult.status}
              </span>
            )}
          </div>

          {!lastResult ? (
            <div className="py-16 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl space-y-2">
              <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
              <div>Click "Run Execution Gate Evaluation" to evaluate request.</div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Verdict Summary Box */}
              <div
                className={`p-4 rounded-xl border space-y-2 ${
                  lastResult.authorized
                    ? 'bg-emerald-950/30 border-emerald-800/50'
                    : 'bg-rose-950/30 border-rose-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {lastResult.authorized ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span className="text-sm font-bold text-white font-display">
                    {lastResult.authorized
                      ? 'AUTHORIZED FOR MONAD EXECUTION'
                      : `BLOCKED: ${lastResult.errorCode}`}
                  </span>
                </div>

                {lastResult.blockReason && (
                  <p className="text-xs text-rose-300 font-sans leading-relaxed pl-7">
                    {lastResult.blockReason}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800/40 pl-7">
                  <span>Monad Gas: <strong className="text-white">{lastResult.gasLimitEstimated}</strong></span>
                  {lastResult.monadTxHash && (
                    <span>Tx Hash: <strong className="text-cyan-300">{lastResult.monadTxHash.substring(0, 16)}...</strong></span>
                  )}
                </div>
              </div>

              {/* Invariant Breakdown List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Evaluated Security Invariants ({lastResult.invariantChecks.length} Executed)
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {lastResult.invariantChecks.map((check, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-all ${
                        check.passed
                          ? 'bg-slate-950/60 border-slate-800/60'
                          : 'bg-rose-950/60 border-rose-800/80'
                      }`}
                    >
                      {check.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5">
                        <div className="font-semibold font-mono text-slate-200">
                          {check.ruleExecuted}
                        </div>
                        {check.errorMessage && (
                          <div className="text-rose-300 text-[11px] font-sans">
                            {check.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
