import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Copy,
  Layers,
  Shield,
  Zap,
} from 'lucide-react';
import {
  SOLIDITY_CAPABILITY_REGISTRY,
  SOLIDITY_EXECUTION_GATE,
  FOUNDRY_SECURITY_TEST,
} from '../core/monad/contractsCode';
import monadDeployment from '../../deployments/monad-testnet.json';

export const MonadEvidenceView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'registry' | 'gate' | 'foundry'>('gate');

  const getActiveCode = () => {
    switch (activeCodeTab) {
      case 'registry':
        return SOLIDITY_CAPABILITY_REGISTRY;
      case 'gate':
        return SOLIDITY_EXECUTION_GATE;
      case 'foundry':
        return FOUNDRY_SECURITY_TEST;
      default:
        return SOLIDITY_EXECUTION_GATE;
    }
  };

  const deployedContracts = Object.entries(monadDeployment.contracts).map(([key, val]) => ({
    name: `${key}.sol`,
    address: val.address,
    network: monadDeployment.network,
    status: val.verified ? 'VERIFIED ON MONAD TESTNET' : 'LOCAL BUILD',
    sourcePath: val.sourcePath,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <Code2 className="w-6 h-6 text-cyan-400" />
          <h1 className="text-xl font-bold font-display text-white">
            Monad Smart Contracts & Foundry Evidence
          </h1>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
            Foundry v1.8.0+ {monadDeployment.network}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Solidity 0.8.31 EVM Osaka implementation deployed and verified on {monadDeployment.network} (Chain ID {monadDeployment.chainId}).
        </p>
      </div>

      {/* Deployed Contracts Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold font-display text-white">
          Verified Deployed Contracts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deployedContracts.map((c, i) => (
            <div key={i} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-cyan-300">{c.name}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/50">
                  {c.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{c.sourcePath}</p>
              <div className="text-[11px] font-mono text-slate-300 pt-1 border-t border-slate-800/60 truncate">
                Address: {c.address}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Viewer & Foundry Test Suite */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between bg-slate-950 px-6 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold font-mono text-white">Contract Source Explorer</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveCodeTab('gate')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeCodeTab === 'gate'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ExecutionGate.sol
            </button>
            <button
              onClick={() => setActiveCodeTab('registry')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeCodeTab === 'registry'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              CapabilityRegistry.sol
            </button>
            <button
              onClick={() => setActiveCodeTab('foundry')}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
                activeCodeTab === 'foundry'
                  ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PolarisSecurityTest.t.sol (Forge)
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-950/90 font-mono text-xs text-cyan-200 overflow-x-auto max-h-[500px]">
          <pre>{getActiveCode()}</pre>
        </div>
      </div>
    </div>
  );
};
