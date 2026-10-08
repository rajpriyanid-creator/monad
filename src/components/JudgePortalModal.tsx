import React from 'react';
import { Award, ShieldCheck, CheckCircle2, GitFork, Lock, Sparkles, ExternalLink, X } from 'lucide-react';

interface JudgePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JudgePortalModal: React.FC<JudgePortalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 md:p-8 space-y-6 shadow-2xl my-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 border-b border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-800/60 text-cyan-300 text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-cyan-400" />
            <span>Monad Metropolis 2026 — Track 4 Submission Dossier</span>
          </div>

          <h2 className="text-2xl font-bold font-display text-white">
            POLARIS — Portable Agent Capability & Execution Authorization
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            <strong className="text-cyan-300 font-semibold">One Agent. One Capability Passport. Many Applications.</strong>
            <br />
            The agent proposes. POLARIS authorizes. The execution account enforces. Monad executes.
          </p>
        </div>

        {/* Core Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-rose-400 font-mono">The Fundamental Problem</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Giving an AI agent direct wallet private keys creates extreme financial risk. Requiring manual human approvals for every micro-action destroys agent autonomy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400 font-mono">POLARIS Solution</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Issuing portable, cryptographically attenuated standing capabilities. Agents act autonomously within defined scopes, while application adapters and an onchain ExecutionGate enforce invariants.
            </p>
          </div>
        </div>

        {/* Standards Composition Matrix */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase font-mono text-slate-400 tracking-wider">
            Standards Composition Architecture
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-bold">ERC-8004 → Agent Identity</span>
              <p className="text-slate-400 text-[11px]">Binds capability grants to canonical ERC-8004 Agent IDs (Agent #4821).</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-bold">ERC-8126 → Verification Evidence</span>
              <p className="text-slate-400 text-[11px]">Consumes optional verification provider signatures for high-value actions.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-bold">ERC-8196 → Execution Compatibility</span>
              <p className="text-slate-400 text-[11px]">Maps standing capability policies directly into policy-bound execution accounts.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-cyan-300 font-bold">MetaMask → Wallet Adapter</span>
              <p className="text-slate-400 text-[11px]">Wallet-independent capability model compatible with delegation frameworks.</p>
            </div>
          </div>
        </div>

        {/* 17 Security Invariants List */}
        <div className="space-y-2 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
          <h3 className="text-xs font-bold uppercase font-mono text-cyan-400">
            Verified Security Invariants Onchain
          </h3>
          <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside font-mono text-[11px]">
            <li>Agent operational key CANNOT directly withdraw protected vault funds.</li>
            <li>Child capabilities CANNOT escalate maxPerAction or total budget beyond parent.</li>
            <li>Cross-application replay is BLOCKED via consumer contract binding.</li>
            <li>Replay attacks are BLOCKED via cryptographic nonce tracking.</li>
            <li>Prompt injection function substitutions (e.g. approve vs swap) are BLOCKED.</li>
          </ul>
        </div>

        {/* Monad Testnet Evidence */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/50">
          <div>
            <div className="text-xs font-bold text-white font-display">Monad Testnet Deployment Verified</div>
            <p className="text-[11px] text-slate-300 font-mono">Chain ID: 10143 · Solidity 0.8.31 Osaka · Monad Gas Optimization</p>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-lg transition-all shrink-0"
          >
            Explore Live Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
