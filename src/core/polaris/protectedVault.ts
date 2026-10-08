/**
 * POLARIS — Protected Vault
 * Holds agent treasury assets on Monad.
 * Strictly enforces that funds can ONLY move via the ExecutionGate.
 * Reverts any direct agent call to `withdraw()` or `transfer()`.
 */

import { CanonicalAction, ProtectedVaultState } from './types';

export class ProtectedVault {
  private state: ProtectedVaultState = {
    address: '0xVAULT_MONAD_METROPOLIS_TRACK4_001',
    owner: '0x1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t',
    gateAddress: '0xEXECUTION_GATE_MONAD_10143',
    balances: {
      MON: 2500, // 2500 MON (~$5,000 USD value)
      USDC: 4000,
      USDT: 1000,
    },
    totalValueLockedUSD: 10000,
    isPaused: false,
    noncesUsed: {},
    executedLogsCount: 2,
  };

  public getState(): ProtectedVaultState {
    return { ...this.state };
  }

  /**
   * Directly attempts an agent withdrawal without going through ExecutionGate.
   * MUST fail with DIRECT_VAULT_BYPASS EVM Revert!
   */
  public directWithdraw(agentAddress: string, amount: number, asset: 'MON' | 'USDC' | 'USDT'): {
    success: boolean;
    revertReason: string;
    txHash: string;
  } {
    return {
      success: false,
      revertReason: 'EVM Revert: UNAUTHORIZED_CALLER. Direct call to ProtectedVault.withdraw() is prohibited. All fund movement MUST route through ExecutionGate.',
      txHash: `0xrevert_direct_bypass_${Math.random().toString(16).substring(2, 10)}`,
    };
  }

  /**
   * Executes authorized action routed via ExecutionGate
   */
  public executeVaultAction(action: CanonicalAction): boolean {
    const assetKey = action.assetIn as keyof typeof this.state.balances;
    if (this.state.balances[assetKey] !== undefined) {
      this.state.balances[assetKey] = Math.max(0, this.state.balances[assetKey] - action.amount);
    }
    this.state.totalValueLockedUSD = Math.max(0, this.state.totalValueLockedUSD - action.amount);
    this.state.executedLogsCount += 1;
    return true;
  }
}

export const globalProtectedVault = new ProtectedVault();
