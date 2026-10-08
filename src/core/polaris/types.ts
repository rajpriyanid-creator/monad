/**
 * POLARIS — Portable Agent Capability & Execution Authorization
 * Core Domain Types and Data Structures
 */

export type ActionType = 'SWAP' | 'PAYMENT' | 'PERP_POSITION' | 'APPROVE' | 'TRANSFER' | 'UNKNOWN';

export type ConsumerType = 'POLARIS_KURU_CONSUMER' | 'POLARIS_PAYMENT_VAULT' | 'POLARIS_PERPL_CONSUMER' | 'UNREGISTERED_CONSUMER';

export type VerificationMode = 'NONE' | 'REQUIRED' | 'REVIEW_IF_UNKNOWN';

export interface TargetScope {
  allowedContracts: string[]; // E.g. Kuru Router, Payment Vault, Perpl
  blockedContracts?: string[];
}

export interface AssetScope {
  allowedTokens: string[]; // E.g. ['MON', 'USDC', 'USDT']
  maxAssetValues?: Record<string, number>;
}

export interface CapabilityGrant {
  capabilityId: string; // bytes32 hex
  parentCapabilityId?: string; // bytes32 hex or zero for root
  issuer: string; // EOA owner address
  agent: string; // ERC-8004 Agent ID / address
  consumer: string; // Application consumer contract address
  consumerType: ConsumerType;
  actionType: ActionType;
  
  targetScope: TargetScope;
  assetScope: AssetScope;
  
  maxPerAction: number; // Max USD / token amount per single execution
  allocatedBudget: number; // Total budget allocated to this capability
  spentBudget: number; // Currently consumed budget
  remainingBudget: number; // Remaining spendable budget
  
  validAfter: number; // Unix timestamp
  validUntil: number; // Unix timestamp
  
  nonce: number;
  revoked: boolean;
  
  verificationMode: VerificationMode;
  
  signature?: string; // EIP-712 issuer signature
  createdAt: number;
}

export interface CanonicalAction {
  actionType: ActionType;
  targetContract: string;
  targetName: string;
  assetIn: string;
  assetOut?: string;
  amount: number;
  recipient: string;
  functionSelector: string;
  functionName: string;
  rawCalldata: string;
  actionHash: string;
}

export interface ExecutionRequest {
  requestId: string;
  capabilityId: string;
  agent: string;
  consumer: string;
  canonicalAction: CanonicalAction;
  requestedAt: number;
  nonce: number;
  verificationEvidence?: {
    provider: string; // ERC-8126 provider address
    signature: string;
    score?: number;
    verifiedAt: number;
  };
}

export type InvariantErrorCode =
  | 'CAPABILITY_NOT_FOUND'
  | 'CAPABILITY_REVOKED'
  | 'CAPABILITY_EXPIRED'
  | 'CONSUMER_MISMATCH'
  | 'TARGET_NOT_ALLOWED'
  | 'ACTION_NOT_ALLOWED'
  | 'ASSET_NOT_ALLOWED'
  | 'AMOUNT_EXCEEDED'
  | 'BUDGET_EXCEEDED'
  | 'NONCE_USED'
  | 'INVALID_SIGNATURE'
  | 'CAPABILITY_ESCALATION'
  | 'UNSUPPORTED_ACTION'
  | 'VERIFICATION_REQUIRED'
  | 'UNAUTHORIZED_CALLER'
  | 'DIRECT_VAULT_BYPASS'
  | 'REPLAY_ATTACK';

export interface InvariantCheckResult {
  passed: boolean;
  errorCode?: InvariantErrorCode;
  errorMessage?: string;
  ruleExecuted: string;
  evaluatedAt: number;
  details?: Record<string, any>;
}

export interface ExecutionGateResult {
  authorized: boolean;
  status: 'AUTHORIZED' | 'BLOCKED' | 'HUMAN_REVIEW_REQUIRED';
  blockReason?: string;
  errorCode?: InvariantErrorCode;
  invariantChecks: InvariantCheckResult[];
  canonicalAction: CanonicalAction;
  capabilityUsed?: CapabilityGrant;
  gasLimitEstimated: number;
  monadTxHash?: string;
  executedAt: number;
}

export interface ProtectedVaultState {
  address: string;
  owner: string;
  gateAddress: string;
  balances: {
    MON: number;
    USDC: number;
    USDT: number;
  };
  totalValueLockedUSD: number;
  isPaused: boolean;
  noncesUsed: Record<string, boolean>;
  executedLogsCount: number;
}

export interface SecurityEventLog {
  id: string;
  timestamp: number;
  agentId: string;
  capabilityId: string;
  consumerName: string;
  actionType: ActionType;
  amount: number;
  asset: string;
  status: 'SUCCESS' | 'BLOCKED' | 'HUMAN_REVIEW';
  errorCode?: InvariantErrorCode;
  reason: string;
  txHash: string;
  blockNumber: number;
  gasUsed: number;
  adversarialAttackName?: string;
  llmExplanation?: string;
}
