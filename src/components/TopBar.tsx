import React from 'react';
import { Shield, Cpu, ExternalLink, Award, Activity } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenJudgeModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ activeTab, setActiveTab, onOpenJudgeModal }) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'passport', label: 'Agent Passport' },
    { id: 'workbench', label: 'Authorization Workbench' },
    { id: 'adversarial', label: 'Adversarial Arena' },
    { id: 'audit', label: 'Security Audit Logs' },
    { id: 'contracts', label: 'Monad Contracts' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold font-display tracking-tight text-white">
                POLARIS
              </span>
              <span className="text-xs font-mono text-cyan-400/90 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
                TRACK 4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
              Portable Agent Capability Infrastructure
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Network Status & Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Monad Testnet Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>Monad Testnet</span>
            <span className="text-slate-500 text-[10px]">#10143</span>
          </div>

          {/* Judge / Hackathon Submission Button */}
          <button
            onClick={onOpenJudgeModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 rounded-lg shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] whitespace-nowrap"
          >
            <Award className="w-4 h-4 text-slate-900" />
            <span>Judge Dossier</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex items-center gap-1 mt-3 pt-2 border-t border-slate-800/60 overflow-x-auto pb-1 no-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 ${
              activeTab === item.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 bg-slate-900/40'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
