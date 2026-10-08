import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { SecurityEventLog } from '../core/polaris/types';

interface SecurityEventsViewProps {
  logs: SecurityEventLog[];
}

export const SecurityEventsView: React.FC<SecurityEventsViewProps> = ({ logs }) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'SUCCESS' && log.status === 'SUCCESS') ||
      (filterStatus === 'BLOCKED' && log.status === 'BLOCKED');

    const matchesSearch =
      searchQuery === '' ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.errorCode && log.errorCode.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold font-display text-white">
            Security Audit Stream & Revert Receipts
          </h1>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded">
            Envio HyperIndex Pattern
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Machine-readable security events indexed directly from Monad smart contract logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, txHash, error code..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'SUCCESS', 'BLOCKED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filterStatus === st
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action / Consumer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Security Reason / Error Code</th>
                <th className="px-4 py-3">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-mono">
                    No security events found matching filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold ${
                            isSuccess
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          <span>{log.status === 'SUCCESS' ? 'AUTHORIZED' : 'BLOCKED'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.consumerName}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{log.actionType}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-white whitespace-nowrap font-bold">
                        ${log.amount} {log.asset}
                      </td>
                      <td className="px-4 py-3 max-w-xs leading-snug">
                        <div className="text-slate-300 truncate">{log.reason}</div>
                        {log.errorCode && (
                          <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-900/40">
                            {log.errorCode}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                        {log.txHash.substring(0, 14)}...
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
