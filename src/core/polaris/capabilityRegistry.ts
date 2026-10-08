/**
 * POLARIS — Capability Registry & Attenuation Engine
 * Manages capability grants, EIP-712 hashing, parent-child budget partitioning, and attenuation rules.
 */

import { CapabilityGrant, ActionType, ConsumerType, VerificationMode } from './types';
import { computeEip712GrantDigest } from './cryptoEip712';

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityGrant> = new Map();

  constructor() {
    this.seedDefaultCapabilities();
  }

  /**
   * Initialize standard demonstration capabilities for Monad Metropolis
   */
  public seedDefaultCapabilities() {
    const now = Math.floor(Date.now() / 1000);
    const TWELVE_HOURS = 12 * 3600;

    // Root DeFi Capability
    const rootGrant: CapabilityGrant = {
      capabilityId: '0xroot_defi_monad_001',
      issuer: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
      agent: '0x8004101438004101438004101438004101438004', // ERC-8004 Agent ID
      consumer: '0x8004101438004101438004101438004101438004', // Kuru Consumer
      consumerType: 'POLARIS_KURU_CONSUMER',
      actionType: 'SWAP',
      targetScope: {
        allowedContracts: ['0x8004101438004101438004101438004101438004'],
      },
      assetScope: {
        allowedTokens: ['MON', 'USDC', 'USDT'],
      },
      maxPerAction: 500, // Max $500 per swap
      allocatedBudget: 1000, // Total $1000 budget
      spentBudget: 0,
      remainingBudget: 1000,
      validAfter: now - 60,
      validUntil: now + TWELVE_HOURS,
      nonce: 1,
      revoked: false,
      verificationMode: 'NONE',
      createdAt: now,
    };

    rootGrant.signature = computeEip712GrantDigest(rootGrant);

    // Payment Capability
    const paymentGrant: CapabilityGrant = {
      capabilityId: '0xgrant_payment_usdc_002',
      issuer: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
      agent: '0x8004101438004101438004101438004101438004',
      consumer: '0x7004101437004101437004101437004101437004', // Payment Vault
      consumerType: 'POLARIS_PAYMENT_VAULT',
      actionType: 'PAYMENT',
      targetScope: {
        allowedContracts: ['0x7004101437004101437004101437004101437004'],
      },
      assetScope: {
        allowedTokens: ['USDC'],
      },
      maxPerAction: 300,
      allocatedBudget: 700,
      spentBudget: 0,
      remainingBudget: 700,
      validAfter: now - 60,
      validUntil: now + TWELVE_HOURS,
      nonce: 1,
      revoked: false,
      verificationMode: 'NONE',
      createdAt: now,
    };

    paymentGrant.signature = computeEip712GrantDigest(paymentGrant);

    this.capabilities.set(rootGrant.capabilityId, rootGrant);
    this.capabilities.set(paymentGrant.capabilityId, paymentGrant);
  }

  public getCapability(capabilityId: string): CapabilityGrant | undefined {
    return this.capabilities.get(capabilityId);
  }

  public getAllCapabilities(): CapabilityGrant[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Creates a new root or child capability with strict attenuation checks
   */
  public grantCapability(params: {
    capabilityId: string;
    parentCapabilityId?: string;
    issuer: string;
    agent: string;
    consumer: string;
    consumerType: ConsumerType;
    actionType: ActionType;
    targetScope: { allowedContracts: string[] };
    assetScope: { allowedTokens: string[] };
    maxPerAction: number;
    allocatedBudget: number;
    validUntil: number;
    verificationMode: VerificationMode;
  }): { success: boolean; grant?: CapabilityGrant; error?: string } {
    const now = Math.floor(Date.now() / 1000);

    // If child capability, enforce Attenuation Invariants
    if (params.parentCapabilityId) {
      const parent = this.getCapability(params.parentCapabilityId);
      if (!parent) {
        return { success: false, error: 'PARENT_CAPABILITY_NOT_FOUND' };
      }
      if (parent.revoked) {
        return { success: false, error: 'PARENT_CAPABILITY_REVOKED' };
      }
      if (params.maxPerAction > parent.maxPerAction) {
        return { success: false, error: 'CAPABILITY_ESCALATION: maxPerAction exceeds parent' };
      }
      if (params.allocatedBudget > parent.remainingBudget) {
        return { success: false, error: 'PARENT_BUDGET_EXCEEDED: child allocation exceeds remaining parent budget' };
      }
      if (params.validUntil > parent.validUntil) {
        return { success: false, error: 'EXPIRY_ESCALATION: validUntil exceeds parent validity window' };
      }
      // Check assets subset
      const parentTokens = new Set(parent.assetScope.allowedTokens);
      for (const token of params.assetScope.allowedTokens) {
        if (!parentTokens.has(token)) {
          return { success: false, error: `ASSET_ESCALATION: token ${token} is not in parent asset scope` };
        }
      }

      // Deduct budget partition from parent so budget cannot be double-spent
      parent.remainingBudget -= params.allocatedBudget;
    }

    const newGrant: CapabilityGrant = {
      capabilityId: params.capabilityId,
      parentCapabilityId: params.parentCapabilityId,
      issuer: params.issuer,
      agent: params.agent,
      consumer: params.consumer,
      consumerType: params.consumerType,
      actionType: params.actionType,
      targetScope: params.targetScope,
      assetScope: params.assetScope,
      maxPerAction: params.maxPerAction,
      allocatedBudget: params.allocatedBudget,
      spentBudget: 0,
      remainingBudget: params.allocatedBudget,
      validAfter: now - 10,
      validUntil: params.validUntil,
      nonce: 1,
      revoked: false,
      verificationMode: params.verificationMode,
      createdAt: now,
    };

    newGrant.signature = computeEip712GrantDigest(newGrant);

    this.capabilities.set(newGrant.capabilityId, newGrant);
    return { success: true, grant: newGrant };
  }

  /**
   * Deducts budget from a capability upon successful execution
   */
  public consumeBudget(capabilityId: string, amount: number): boolean {
    const grant = this.capabilities.get(capabilityId);
    if (!grant) return false;
    if (grant.remainingBudget < amount) return false;

    grant.spentBudget += amount;
    grant.remainingBudget -= amount;
    grant.nonce += 1;
    return true;
  }

  /**
   * Revokes a capability onchain
   */
  public revokeCapability(capabilityId: string): boolean {
    const grant = this.capabilities.get(capabilityId);
    if (!grant) return false;
    grant.revoked = true;
    return true;
  }
}

export const globalCapabilityRegistry = new CapabilityRegistry();
