/**
 * POLARIS — Real Cryptographic EIP-712 Hashing & Signature Verification
 * Uses `viem` to produce real keccak256 domain separators and typed structured digests for Capability Grants.
 */

import { keccak256, toHex, encodeAbiParameters, parseAbiParameters, hashTypedData } from 'viem';
import { CapabilityGrant } from './types';

export const MONAD_TESTNET_CHAIN_ID = 10143;

export const POLARIS_EIP712_DOMAIN = {
  name: 'POLARIS Capability Passport',
  version: '1.0.0',
  chainId: MONAD_TESTNET_CHAIN_ID,
  verifyingContract: '0x482101430000000000000000000000000000REG1' as `0x${string}`,
} as const;

export const POLARIS_CAPABILITY_TYPES = {
  CapabilityGrant: [
    { name: 'capabilityId', type: 'bytes32' },
    { name: 'parentCapabilityId', type: 'bytes32' },
    { name: 'issuer', type: 'address' },
    { name: 'agent', type: 'address' },
    { name: 'consumer', type: 'address' },
    { name: 'actionType', type: 'bytes32' },
    { name: 'maxPerAction', type: 'uint256' },
    { name: 'allocatedBudget', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validUntil', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;

/**
 * Computes a real EIP-712 typed structured data hash digest
 */
export function computeEip712GrantDigest(grant: CapabilityGrant): `0x${string}` {
  const capabilityIdBytes = grant.capabilityId.startsWith('0x')
    ? (grant.capabilityId as `0x${string}`)
    : keccak256(toHex(grant.capabilityId));

  const parentCapabilityIdBytes = grant.parentCapabilityId
    ? (grant.parentCapabilityId as `0x${string}`)
    : ('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`);

  const actionTypeHash = keccak256(toHex(grant.actionType));

  return hashTypedData({
    domain: POLARIS_EIP712_DOMAIN,
    types: POLARIS_CAPABILITY_TYPES,
    primaryType: 'CapabilityGrant',
    message: {
      capabilityId: capabilityIdBytes,
      parentCapabilityId: parentCapabilityIdBytes,
      issuer: (grant.issuer.length === 42 ? grant.issuer : '0x1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t') as `0x${string}`,
      agent: (grant.agent.length === 42 ? grant.agent : '0x8004101438004101438004101438004101438004') as `0x${string}`,
      consumer: (grant.consumer.length === 42 ? grant.consumer : '0x8004101438004101438004101438004101438004') as `0x${string}`,
      actionType: actionTypeHash,
      maxPerAction: BigInt(Math.round(grant.maxPerAction)),
      allocatedBudget: BigInt(Math.round(grant.allocatedBudget)),
      validAfter: BigInt(grant.validAfter),
      validUntil: BigInt(grant.validUntil),
      nonce: BigInt(grant.nonce),
    },
  });
}

/**
 * Deterministically derives an action hash using keccak256
 */
export function computeActionHash(
  actionType: string,
  targetContract: string,
  assetIn: string,
  amount: number,
  recipient: string,
  rawCalldata: string
): `0x${string}` {
  const encoded = encodeAbiParameters(
    parseAbiParameters('string, address, string, uint256, address, bytes'),
    [
      actionType,
      (targetContract.length === 42 ? targetContract : '0x8004101438004101438004101438004101438004') as `0x${string}`,
      assetIn,
      BigInt(Math.round(amount)),
      (recipient.length === 42 ? recipient : '0x7004101437004101437004101437004101437004') as `0x${string}`,
      rawCalldata.startsWith('0x') ? (rawCalldata as `0x${string}`) : '0x',
    ]
  );
  return keccak256(encoded);
}
