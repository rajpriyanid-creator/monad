// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "./PolarisCapabilityRegistry.sol";

/**
 * @title PolarisExecutionGate
 * @notice Onchain Security Gate enforcing the 14 Invariants for Autonomous Agent Execution on Monad
 */
contract PolarisExecutionGate {
    PolarisCapabilityRegistry public immutable registry;
    address public immutable protectedVault;

    mapping(bytes32 => bool) public consumedNonces;

    event ExecutionAuthorized(
        bytes32 indexed capabilityId,
        address indexed agent,
        address indexed consumer,
        uint256 amount,
        bytes32 txHash
    );

    error DirectVaultBypassProhibited();
    error CapabilityNotFound();
    error CapabilityRevoked();
    error CapabilityExpired();
    error UnauthorizedAgent();
    error ConsumerMismatch();
    error TargetNotAllowed();
    error ActionNotAllowed();
    error AssetNotAllowed();
    error AmountExceeded();
    error BudgetExceeded();
    error NonceReplayed();

    constructor(address _registry, address _vault) {
        registry = PolarisCapabilityRegistry(_registry);
        protectedVault = _vault;
    }

    function verifyAndAuthorize(
        bytes32 capabilityId,
        address agent,
        address consumer,
        address targetContract,
        address assetToken,
        bytes32 actionType,
        uint256 amount,
        uint256 nonce
    ) external returns (bool) {
        // Invariant 1: Caller cannot be the raw EOA agent bypassing consumer application gate
        if (msg.sender == agent) revert DirectVaultBypassProhibited();

        // Invariant 2: Capability existence check
        (
            bytes32 capId,
            bytes32 parentCapId,
            address issuer,
            address boundAgent,
            address boundConsumer,
            bytes32 boundActionType,
            address boundTarget,
            address boundAsset,
            uint256 maxPerAction,
            uint256 allocatedBudget,
            uint256 spentBudget,
            uint256 remainingBudget,
            uint256 validAfter,
            uint256 validUntil,
            uint256 currentNonce,
            bool revoked,
            uint8 verificationMode
        ) = registry.capabilities(capabilityId);

        if (issuer == address(0)) revert CapabilityNotFound();

        // Invariant 3: Revocation check
        if (revoked) revert CapabilityRevoked();

        // Invariant 4: Expiry check
        if (block.timestamp > validUntil || block.timestamp < validAfter) revert CapabilityExpired();

        // Invariant 5: Agent identity check
        if (boundAgent != agent) revert UnauthorizedAgent();

        // Invariant 6: Consumer binding check (cross-app replay prevention)
        if (boundConsumer != consumer || msg.sender != consumer) revert ConsumerMismatch();

        // Invariant 7: Target contract scope check
        if (boundTarget != address(0) && boundTarget != targetContract) revert TargetNotAllowed();

        // Invariant 8: Action type scope check
        if (boundActionType != actionType) revert ActionNotAllowed();

        // Invariant 9: Asset scope check
        if (boundAsset != address(0) && boundAsset != assetToken) revert AssetNotAllowed();

        // Invariant 10: Single action amount cap check
        if (amount > maxPerAction) revert AmountExceeded();

        // Invariant 11: Remaining budget allocation check
        if (amount > remainingBudget) revert BudgetExceeded();

        // Invariant 12: Cryptographic nonce replay check
        bytes32 nonceKey = keccak256(abi.encodePacked(capabilityId, nonce));
        if (consumedNonces[nonceKey]) revert NonceReplayed();

        // Mark nonce as consumed & deduct remaining budget in capability registry
        consumedNonces[nonceKey] = true;
        registry.consumeBudget(capabilityId, amount);

        emit ExecutionAuthorized(
            capabilityId,
            agent,
            consumer,
            amount,
            keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))
        );

        return true;
    }
}
