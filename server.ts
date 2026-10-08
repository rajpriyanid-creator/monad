import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

import { globalCapabilityRegistry } from './src/core/polaris/capabilityRegistry';
import { globalExecutionGate } from './src/core/polaris/executionGate';
import { globalProtectedVault } from './src/core/polaris/protectedVault';
import { ActionAdapterRegistry, KNOWN_MONAD_CONTRACTS } from './src/core/polaris/actionAdapters';
import { ExecutionRequest, SecurityEventLog } from './src/core/polaris/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini SDK Server-Side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MOCK_KEY_FOR_DEV',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Audit Security Event Logs
const securityLogs: SecurityEventLog[] = [
  {
    id: 'sec_log_001',
    timestamp: Math.floor(Date.now() / 1000) - 3600,
    agentId: '0x8004000000000000000000000000000000004821',
    capabilityId: '0xroot_defi_monad_001',
    consumerName: 'Kuru Flow DEX',
    actionType: 'SWAP',
    amount: 300,
    asset: 'USDC',
    status: 'SUCCESS',
    reason: 'Authorized under Standing Capability #0xroot_defi_monad_001 ($300 <= $500 maxPerAction)',
    txHash: '0x8a92f0021c3b1014300000000000000000000000000000000000000000000001',
    blockNumber: 1482091,
    gasUsed: 84200,
  },
  {
    id: 'sec_log_002',
    timestamp: Math.floor(Date.now() / 1000) - 1800,
    agentId: '0x8004000000000000000000000000000000004821',
    capabilityId: '0xroot_defi_monad_001',
    consumerName: 'Kuru Flow DEX',
    actionType: 'APPROVE',
    amount: 1000000,
    asset: 'USDC',
    status: 'BLOCKED',
    errorCode: 'ACTION_NOT_ALLOWED',
    reason: 'Prompt Injection Attack Prevented: Agent proposed TOKEN_APPROVAL (approve) which is not permitted by SWAP capability.',
    txHash: '0xf8812c9910143000000000000000000000000000000000000000000000000002',
    blockNumber: 1482142,
    gasUsed: 21000,
    adversarialAttackName: 'Prompt Injection: Function Substitution (approve vs swap)',
    llmExplanation: 'The agent received a malicious prompt attempting to trigger an unconstrained token approval. POLARIS ExecutionGate checked the decoded canonical action (APPROVE) against the capability scope (SWAP) and rejected the transaction onchain.',
  },
];

// --- API Endpoints ---

// GET /api/polaris/state
app.get('/api/polaris/state', (req: Request, res: Response) => {
  res.json({
    capabilities: globalCapabilityRegistry.getAllCapabilities(),
    vault: globalProtectedVault.getState(),
    logs: securityLogs,
  });
});

// POST /api/agent/propose (AI Agent Proposal Generator + POLARIS Gate Evaluation)
app.post('/api/agent/propose', async (req: Request, res: Response) => {
  try {
    const { prompt, capabilityId, amount, targetContract, functionName, assetIn, recipient } = req.body;

    const chosenCapabilityId = capabilityId || '0xroot_defi_monad_001';
    const grant = globalCapabilityRegistry.getCapability(chosenCapabilityId);

    const target = targetContract || (grant ? grant.consumer : KNOWN_MONAD_CONTRACTS.KURU_ROUTER);
    const func = functionName || (grant ? (grant.actionType === 'SWAP' ? 'swapExactTokensForTokens' : 'payInvoice') : 'swapExactTokensForTokens');
    const amt = typeof amount === 'number' ? amount : 200;
    const asset = assetIn || (grant ? grant.assetScope.allowedTokens[0] : 'USDC');
    const rec = recipient || (grant ? grant.consumer : '0xVAULT');

    // Decode into Canonical Action
    const canonicalAction = ActionAdapterRegistry.decodeAction(target, func, {
      assetIn: asset,
      amount: amt,
      recipient: rec,
    });

    // Construct Execution Request
    const execRequest: ExecutionRequest = {
      requestId: `req_${Math.random().toString(16).substring(2, 8)}`,
      capabilityId: chosenCapabilityId,
      agent: grant ? grant.agent : '0x8004000000000000000000000000000000004821',
      consumer: target,
      canonicalAction,
      requestedAt: Math.floor(Date.now() / 1000),
      nonce: grant ? grant.nonce : 1,
    };

    // Evaluate in ExecutionGate
    const gateResult = globalExecutionGate.evaluateAndExecute(execRequest);

    // Optional: Generate Gemini Explanation for the Gate Decision
    let llmExplanation = '';
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MOCK_KEY_FOR_DEV') {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: `Analyze this agent transaction proposal and POLARIS ExecutionGate decision:
Proposal: ${prompt || func}
Action Decoded: ${canonicalAction.actionType} for $${canonicalAction.amount} ${canonicalAction.assetIn}
Gate Decision: ${gateResult.status}
Block Reason: ${gateResult.blockReason || 'None (Authorized)'}

Provide a concise 2-sentence security summary explaining why POLARIS ${gateResult.authorized ? 'authorized' : 'blocked'} this transaction based on capability scoping.`,
        });
        llmExplanation = response.text || '';
      } catch (err) {
        llmExplanation = `POLARIS Engine evaluated proposal against capability #${chosenCapabilityId}. Result: ${gateResult.status}`;
      }
    } else {
      llmExplanation = `POLARIS Engine evaluated proposal against capability #${chosenCapabilityId}. Result: ${gateResult.status}`;
    }

    // Log security event
    const logEntry: SecurityEventLog = {
      id: `sec_log_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      agentId: execRequest.agent,
      capabilityId: chosenCapabilityId,
      consumerName: canonicalAction.targetName,
      actionType: canonicalAction.actionType,
      amount: canonicalAction.amount,
      asset: canonicalAction.assetIn,
      status: gateResult.authorized ? 'SUCCESS' : 'BLOCKED',
      errorCode: gateResult.errorCode,
      reason: gateResult.blockReason || 'Authorized under standing capability.',
      txHash: gateResult.monadTxHash || `0xrevert_${Math.random().toString(16).substring(2, 10)}`,
      blockNumber: 1482200 + Math.floor(Math.random() * 100),
      gasUsed: gateResult.gasLimitEstimated,
      llmExplanation,
    };

    securityLogs.unshift(logEntry);

    res.json({
      success: true,
      gateResult,
      llmExplanation,
      updatedVaultState: globalProtectedVault.getState(),
      updatedCapabilities: globalCapabilityRegistry.getAllCapabilities(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error processing proposal' });
  }
});

// POST /api/agent/adversarial-attack (Demonstrates Specific Attacks & Onchain Reverts)
app.post('/api/agent/adversarial-attack', (req: Request, res: Response) => {
  const { attackType } = req.body;

  let request: ExecutionRequest;
  let attackName = '';

  const now = Math.floor(Date.now() / 1000);

  if (attackType === 'FUNCTION_SUBSTITUTION') {
    attackName = 'Prompt Injection: Function Substitution (approve vs swap)';
    const canonicalAction = ActionAdapterRegistry.decodeAction(
      KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      'approve',
      { assetIn: 'USDC', amount: 1000000, recipient: KNOWN_MONAD_CONTRACTS.UNAUTHORIZED_ATTACK_CONTRACT }
    );
    request = {
      requestId: 'attack_01',
      capabilityId: '0xroot_defi_monad_001',
      agent: '0x8004000000000000000000000000000000004821',
      consumer: KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      canonicalAction,
      requestedAt: now,
      nonce: 2,
    };
  } else if (attackType === 'AMOUNT_EXCEEDED') {
    attackName = 'Malicious Proposal: Amount Exceeded ($700 vs $500 maxPerAction)';
    const canonicalAction = ActionAdapterRegistry.decodeAction(
      KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      'swapExactTokensForTokens',
      { assetIn: 'USDC', amount: 700, recipient: '0x4821014300000000000000000000000000000003' }
    );
    request = {
      requestId: 'attack_02',
      capabilityId: '0xroot_defi_monad_001',
      agent: '0x8004000000000000000000000000000000004821',
      consumer: KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      canonicalAction,
      requestedAt: now,
      nonce: 2,
    };
  } else if (attackType === 'WRONG_CONSUMER') {
    attackName = 'Cross-Application Replay: Kuru Capability used against Payment Vault';
    const canonicalAction = ActionAdapterRegistry.decodeAction(
      KNOWN_MONAD_CONTRACTS.POLARIS_PAYMENT_VAULT,
      'payInvoice',
      { assetIn: 'USDC', amount: 200, recipient: '0x7004101437004101437004101437004101437004' }
    );
    request = {
      requestId: 'attack_03',
      capabilityId: '0xroot_defi_monad_001', // Kuru Capability
      agent: '0x8004000000000000000000000000000000004821',
      consumer: KNOWN_MONAD_CONTRACTS.POLARIS_PAYMENT_VAULT, // Payment Vault Consumer
      canonicalAction,
      requestedAt: now,
      nonce: 2,
    };
  } else if (attackType === 'NONCE_REPLAY') {
    attackName = 'Cryptographic Replay: Re-submitting already consumed nonce #1';
    const canonicalAction = ActionAdapterRegistry.decodeAction(
      KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      'swapExactTokensForTokens',
      { assetIn: 'USDC', amount: 300, recipient: '0x4821014300000000000000000000000000000003' }
    );
    // Nonce 1 was consumed in seed default log
    request = {
      requestId: 'attack_04',
      capabilityId: '0xroot_defi_monad_001',
      agent: '0x8004000000000000000000000000000000004821',
      consumer: KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
      canonicalAction,
      requestedAt: now,
      nonce: 1, // Reused nonce!
    };
  } else {
    // Default Target Substitution Attack
    attackName = 'Target Substitution Attack: Attempting to call Unregistered Contract';
    const canonicalAction = ActionAdapterRegistry.decodeAction(
      KNOWN_MONAD_CONTRACTS.UNAUTHORIZED_ATTACK_CONTRACT,
      'drainVault',
      { assetIn: 'USDC', amount: 500, recipient: KNOWN_MONAD_CONTRACTS.UNAUTHORIZED_ATTACK_CONTRACT }
    );
    request = {
      requestId: 'attack_05',
      capabilityId: '0xroot_defi_monad_001',
      agent: '0x8004000000000000000000000000000000004821',
      consumer: KNOWN_MONAD_CONTRACTS.UNAUTHORIZED_ATTACK_CONTRACT,
      canonicalAction,
      requestedAt: now,
      nonce: 2,
    };
  }

  const gateResult = globalExecutionGate.evaluateAndExecute(request);

  const logEntry: SecurityEventLog = {
    id: `sec_log_attack_${Date.now()}`,
    timestamp: now,
    agentId: request.agent,
    capabilityId: request.capabilityId,
    consumerName: request.canonicalAction.targetName,
    actionType: request.canonicalAction.actionType,
    amount: request.canonicalAction.amount,
    asset: request.canonicalAction.assetIn,
    status: 'BLOCKED',
    errorCode: gateResult.errorCode,
    reason: gateResult.blockReason || 'Blocked by POLARIS ExecutionGate',
    txHash: `0xrevert_attack_${Math.random().toString(16).substring(2, 10)}10143`,
    blockNumber: 1482250,
    gasUsed: 21000,
    adversarialAttackName: attackName,
    llmExplanation: `Security Invariant Enforced: POLARIS blocked this adversarial action (${gateResult.errorCode}). Protected Vault funds remained completely secure.`,
  };

  securityLogs.unshift(logEntry);

  res.json({
    success: true,
    attackName,
    gateResult,
    logEntry,
  });
});

// POST /api/agent/direct-bypass (Direct Call to Vault.withdraw)
app.post('/api/agent/direct-bypass', (req: Request, res: Response) => {
  const result = globalProtectedVault.directWithdraw('0x8004000000000000000000000000000000004821', 1000, 'USDC');
  
  const now = Math.floor(Date.now() / 1000);
  const logEntry: SecurityEventLog = {
    id: `sec_log_bypass_${Date.now()}`,
    timestamp: now,
    agentId: '0x8004000000000000000000000000000000004821',
    capabilityId: 'NONE (DIRECT VAULT CALL)',
    consumerName: 'Protected Vault (Direct Call)',
    actionType: 'TRANSFER',
    amount: 1000,
    asset: 'USDC',
    status: 'BLOCKED',
    errorCode: 'DIRECT_VAULT_BYPASS',
    reason: result.revertReason,
    txHash: result.txHash,
    blockNumber: 1482260,
    gasUsed: 21000,
    adversarialAttackName: 'Direct Vault Bypass Attack: Agent calling Vault.withdraw() directly',
    llmExplanation: 'The agent attempted to bypass the ExecutionGate and withdraw directly from the ProtectedVault. The smart contract reverted with UNAUTHORIZED_CALLER.',
  };

  securityLogs.unshift(logEntry);

  res.json({
    success: false,
    bypassBlocked: true,
    result,
    logEntry,
  });
});

// POST /api/polaris/grant (Grant Capability with Attenuation)
app.post('/api/polaris/grant', (req: Request, res: Response) => {
  const {
    capabilityId,
    parentCapabilityId,
    consumer,
    consumerType,
    actionType,
    maxPerAction,
    allocatedBudget,
    validHours,
    allowedTokens,
  } = req.body;

  const validUntil = Math.floor(Date.now() / 1000) + (validHours || 12) * 3600;

  const result = globalCapabilityRegistry.grantCapability({
    capabilityId: capabilityId || `0xgrant_${Math.random().toString(16).substring(2, 8)}`,
    parentCapabilityId,
    issuer: '0x1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
    agent: '0x8004000000000000000000000000000000004821',
    consumer: consumer || KNOWN_MONAD_CONTRACTS.KURU_ROUTER,
    consumerType: consumerType || 'POLARIS_KURU_CONSUMER',
    actionType: actionType || 'SWAP',
    targetScope: { allowedContracts: [consumer || KNOWN_MONAD_CONTRACTS.KURU_ROUTER] },
    assetScope: { allowedTokens: allowedTokens || ['MON', 'USDC'] },
    maxPerAction: maxPerAction || 250,
    allocatedBudget: allocatedBudget || 500,
    validUntil,
    verificationMode: 'NONE',
  });

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }

  res.json({
    success: true,
    grant: result.grant,
    capabilities: globalCapabilityRegistry.getAllCapabilities(),
  });
});

// POST /api/polaris/revoke
app.post('/api/polaris/revoke', (req: Request, res: Response) => {
  const { capabilityId } = req.body;
  const success = globalCapabilityRegistry.revokeCapability(capabilityId);
  res.json({
    success,
    capabilities: globalCapabilityRegistry.getAllCapabilities(),
  });
});

// Mount Vite in Dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        const indexPath = path.resolve(__dirname, 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[POLARIS Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
