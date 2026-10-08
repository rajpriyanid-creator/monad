/**
 * POLARIS — Action Adapters
 * Deterministic EVM calldata decoders for supported Monad protocols.
 * Translates raw calldata into CanonicalAction objects.
 */

import { ActionType, CanonicalAction } from './types';

// Known Monad Protocol Router Addresses (Testnet Chain ID 10143)
export const KNOWN_MONAD_CONTRACTS = {
  KURU_ROUTER: '0x8004101438004101438004101438004101438004',
  POLARIS_PAYMENT_VAULT: '0x7004101437004101437004101437004101437004',
  PERPL_ROUTER: '0x6004101436004101436004101436004101436004',
  UNAUTHORIZED_ATTACK_CONTRACT: '0xBAD000000000000000000000000000000000BAD1',
};

// Simple pseudo-keccak256 hash helper for demo determinism
function pseudoHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `0x${hex}${hex}${hex}${hex}${hex}${hex}${hex}${hex}`.substring(0, 66);
}

export class ActionAdapterRegistry {
  /**
   * Decodes raw calldata or action payload into a deterministic CanonicalAction
   */
  static decodeAction(
    targetContract: string,
    functionName: string,
    params: {
      assetIn: string;
      assetOut?: string;
      amount: number;
      recipient: string;
      rawCalldata?: string;
    }
  ): CanonicalAction {
    const targetLower = targetContract.toLowerCase();
    const funcLower = functionName.toLowerCase();

    let actionType: ActionType = 'UNKNOWN';
    let targetName = 'Unknown Protocol';

    // Kuru Swap Adapter
    if (
      targetLower === KNOWN_MONAD_CONTRACTS.KURU_ROUTER.toLowerCase() ||
      funcLower.includes('swap') ||
      funcLower.includes('orderbook')
    ) {
      if (funcLower.includes('swap') || funcLower.includes('orderbook') || funcLower.includes('execute')) {
        actionType = 'SWAP';
        targetName = 'Kuru Flow DEX';
      }
    }
    // Payment Vault Adapter
    else if (
      targetLower === KNOWN_MONAD_CONTRACTS.POLARIS_PAYMENT_VAULT.toLowerCase() ||
      funcLower.includes('pay') ||
      funcLower.includes('invoice') ||
      funcLower.includes('stream')
    ) {
      actionType = 'PAYMENT';
      targetName = 'Polaris Payment Vault';
    }
    // Perpl Adapter
    else if (
      targetLower === KNOWN_MONAD_CONTRACTS.PERPL_ROUTER.toLowerCase() ||
      funcLower.includes('perp') ||
      funcLower.includes('position')
    ) {
      actionType = 'PERP_POSITION';
      targetName = 'Perpl Onchain Perps';
    }
    // Standard ERC20 Approve / Transfer
    else if (funcLower === 'approve') {
      actionType = 'APPROVE';
      targetName = 'ERC20 Token Contract';
    } else if (funcLower === 'transfer' || funcLower === 'transferfrom' || funcLower === 'withdraw') {
      actionType = 'TRANSFER';
      targetName = 'ERC20 / Vault Transfer';
    }

    const selectorHex = pseudoHash(functionName).substring(0, 10);
    const rawCalldata =
      params.rawCalldata ||
      `${selectorHex}${params.amount.toString(16).padStart(64, '0')}`;

    const actionHash = pseudoHash(
      `${actionType}:${targetLower}:${params.assetIn}:${params.amount}:${params.recipient}:${rawCalldata}`
    );

    return {
      actionType,
      targetContract,
      targetName,
      assetIn: params.assetIn.toUpperCase(),
      assetOut: params.assetOut ? params.assetOut.toUpperCase() : undefined,
      amount: params.amount,
      recipient: params.recipient,
      functionSelector: selectorHex,
      functionName,
      rawCalldata,
      actionHash,
    };
  }
}
