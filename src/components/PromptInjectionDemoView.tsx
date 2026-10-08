import React, { useState } from 'react';
import {
  ShieldAlert,
  Zap,
  XCircle,
  AlertTriangle,
  Play,
  RefreshCw,
  Terminal,
  Lock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface AttackResult {
  attackName: string;
  gateResult: any;
  logEntry: any;
}

export const PromptInjectionDemoView: React.FC = () => {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);

  const attacks = [
    {
      id: 'FUNCTION_SUBSTITUTION',
      title: 'Prompt Injection: Function Substitution',
      promptUsed: 'User says: "Rebalance portfolio". Malicious context tricks LLM into generating approve(0xMalicious, infinity) instead of swap().',
      attackPayload: 'Action: APPROVE | Target: ERC20 | Amount: 1,000,000 USDC',
      capabilityAllowed: 'Capability #0xroot_defi_monad_001 allows ONLY SWAP',
      expectedOutcome: 'EVM Revert: ACTION_NOT_ALLOWED',
    },
    {
      id: 'AMOUNT_EXCEEDED',
      title: 'Malicious Proposal: Amount Exceeded',
      promptUsed: 'Prompt injection tricks agent into executing a $700 swap on Kuru Flow DEX.',
      attackPayload: 'Action: SWAP | Amount: $700 USDC',
      capabilityAllowed: 'Capability #0xroot_defi_monad_001 caps maxPerAction at $500',
      expectedOutcome: 'EVM Revert: AMOUNT_EXCEEDED',
    },
    {
      id: 'WRONG_CONSUMER',
      title: 'Cross-Application Replay Attack',
      promptUsed: 'Attacker takes Kuru DEX capability signature and submits it to Payment Vault.',
      attackPayload: 'Target: Polaris Payment Vault | Capability: Kuru Swap Grant',
      capabilityAllowed: 'Capability #0xroot_defi_monad_001 bound ONLY to Kuru Router',
      expectedOutcome: 'EVM Revert: CONSUMER_MISMATCH',
    },
    {
      id: 'NONCE_REPLAY',
      title: 'Cryptographic Nonce Replay Attack',
      promptUsed: 'Attacker intercepts previous successful $300 swap tx and replays nonce #1.',
      attackPayload: 'Nonce: 1 (Already consumed in previous transaction)',
      capabilityAllowed: 'ExecutionGate requires unique unused nonce',
      expectedOutcome: 'EVM Revert: NONCE_USED',
    },
    {
      id: 'TARGET_SUBSTITUTION',
      title: 'Target Substitution Attack',
      promptUsed: 'Adversary injects malicious contract address 0xBAD000... into agent tools.',
      attackPayload: 'Target Contract: 0xBAD000000000000000000000000000000000BAD1',
      capabilityAllowed: 'Target Scope restricts calls to registered Monad routers',
      expectedOutcome: 'EVM Revert: TARGET_NOT_ALLOWED',
    },
  ];

  const handleRunAttack = async (attackId: string) => {
    setActiveAttack(attackId);
    setIsRunning(true);
    setAttackResult(null);

    try {
      const response = await fetch('/api/agent/adversarial-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attackType: attackId }),
      });
      const data = await response.json();
      setAttackResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-900/40 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
          <h1 className="text-xl font-bold font-display text-white">
            Adversarial Attack & Prompt Injection Arena
          </h1>
          <span className="text-xs font-mono text-rose-300 bg-rose-950 border border-rose-800/60 px-2 py-0.5 rounded">
            Live Revert Demonstrations
          </span>
        </div>
        <p className="text-xs text-slate-300">
          Even if an AI agent is completely compromised by prompt injection, POLARIS ExecutionGate rejects unauthorized transactions onchain before funds move.
        </p>
      </div>

      {/* Attack Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {attacks.map((att) => {
          const isSelected = activeAttack === att.id;
          return (
            <div
              key={att.id}
              className={`p-5 rounded-xl border transition-all space-y-3 flex flex-col justify-between ${
                isSelected
                  ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-rose-900/40'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-white">
                    {att.title}
                  </span>
                  <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-900/40">
                    ADVERSARIAL
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-snug">
                  {att.promptUsed}
                </p>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
                  <div className="text-rose-300 font-semibold truncate">{att.attackPayload}</div>
                  <div className="text-slate-400 text-[10px]">{att.capabilityAllowed}</div>
                </div>
              </div>

              <button
                onClick={() => handleRunAttack(att.id)}
                disabled={isRunning}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-50"
              >
                {isRunning && activeAttack === att.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
                )}
                <span>Launch Attack Scenario</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Attack Execution Result Output */}
      {attackResult && (
        <div className="bg-slate-900/80 border border-rose-900/50 rounded-2xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold font-display text-white">
                  {attackResult.attackName}
                </h2>
                <span className="text-xs font-mono text-rose-400">
                  Status: REVERTED ONCHAIN ({attackResult.gateResult.errorCode})
                </span>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div>Monad Gas Used: 21,000</div>
              <div className="text-cyan-400">{attackResult.gateResult.monadTxHash || '0xrevert_tx_10143'}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold font-mono text-rose-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                <span>Onchain EVM Revert Reason</span>
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">
                {attackResult.gateResult.blockReason}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold font-mono text-cyan-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Gemini Security Explanation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {attackResult.logEntry.llmExplanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
