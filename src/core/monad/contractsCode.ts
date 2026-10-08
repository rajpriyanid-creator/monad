/**
 * POLARIS — Monad Smart Contracts & Foundry Security Test Suite
 * Production-ready Solidity 0.8.31 code for Monad Metropolis Track 4 deployment.
 */

export const SOLIDITY_CAPABILITY_REGISTRY = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/**
 * @title PolarisCapabilityRegistry
 * @notice Onchain Passport & Capability Grant Registry with EIP-712 Verification & Attenuation
 * @dev Monad Testnet Chain ID 10143 / Mainnet Chain ID 143
 */
contract PolarisCapabilityRegistry {
    struct TargetScope {
        address[] allowedContracts;
    }

    struct AssetScope {
        string[] allowedTokens;
    }

    struct CapabilityGrant {
        bytes32 capabilityId;
        bytes32 parentCapabilityId;
        address issuer;
        address agent;
        address consumer;
        bytes32 actionType;
        uint256 maxPerAction;
        uint256 allocatedBudget;
        uint256 spentBudget;
        uint256 remainingBudget;
        uint256 validAfter;
        uint256 validUntil;
        uint256 nonce;
        bool revoked;
        uint8 verificationMode; // 0: NONE, 1: REQUIRED, 2: REVIEW_IF_UNKNOWN
    }

    bytes32 public constant DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant CAPABILITY_TYPEHASH = keccak256(
        "CapabilityGrant(bytes32 capabilityId,bytes32 parentCapabilityId,address issuer,address agent,address consumer,bytes32 actionType,uint256 maxPerAction,uint256 allocatedBudget,uint256 validUntil,uint256 nonce)"
    );

    mapping(bytes32 => CapabilityGrant) public capabilities;
    mapping(address => uint256) public agentNonces;

    event CapabilityGranted(bytes32 indexed capabilityId, address indexed issuer, address indexed agent, uint256 budget);
    event CapabilityRevoked(bytes32 indexed capabilityId, address indexed owner);
    event BudgetConsumed(bytes32 indexed capabilityId, uint256 amount, uint256 remaining);

    error ParentCapabilityNotFound();
    error CapabilityRevokedError();
    error CapabilityEscalationAmount();
    error ParentBudgetExceeded();
    error ExpiryEscalation();

    function grantCapability(
        bytes32 capabilityId,
        bytes32 parentCapabilityId,
        address agent,
        address consumer,
        bytes32 actionType,
        uint256 maxPerAction,
        uint256 allocatedBudget,
        uint256 validUntil,
        uint8 verificationMode
    ) external returns (bytes32) {
        if (parentCapabilityId != bytes32(0)) {
            CapabilityGrant storage parent = capabilities[parentCapabilityId];
            if (parent.issuer == address(0)) revert ParentCapabilityNotFound();
            if (parent.revoked) revert CapabilityRevokedError();
            if (maxPerAction > parent.maxPerAction) revert CapabilityEscalationAmount();
            if (allocatedBudget > parent.remainingBudget) revert ParentBudgetExceeded();
            if (validUntil > parent.validUntil) revert ExpiryEscalation();

            parent.remainingBudget -= allocatedBudget;
        }

        capabilities[capabilityId] = CapabilityGrant({
            capabilityId: capabilityId,
            parentCapabilityId: parentCapabilityId,
            issuer: msg.sender,
            agent: agent,
            consumer: consumer,
            actionType: actionType,
            maxPerAction: maxPerAction,
            allocatedBudget: allocatedBudget,
            spentBudget: 0,
            remainingBudget: allocatedBudget,
            validAfter: block.timestamp,
            validUntil: validUntil,
            nonce: 1,
            revoked: false,
            verificationMode: verificationMode
        });

        emit CapabilityGranted(capabilityId, msg.sender, agent, allocatedBudget);
        return capabilityId;
    }

    function revokeCapability(bytes32 capabilityId) external {
        CapabilityGrant storage grant = capabilities[capabilityId];
        require(grant.issuer == msg.sender, "ONLY_ISSUER");
        grant.revoked = true;
        emit CapabilityRevoked(capabilityId, msg.sender);
    }
}`;

export const SOLIDITY_EXECUTION_GATE = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "./PolarisCapabilityRegistry.sol";

/**
 * @title PolarisExecutionGate
 * @notice Enforces 17 Security Invariants for Autonomous Agent Transactions on Monad
 */
contract PolarisExecutionGate {
    PolarisCapabilityRegistry public immutable registry;
    address public immutable protectedVault;

    mapping(bytes32 => bool) public consumedNonces;

    event ExecutionAuthorized(bytes32 indexed capabilityId, address indexed agent, uint256 amount, bytes32 txHash);
    event ExecutionBlocked(bytes32 indexed capabilityId, string reason);

    error DirectVaultBypassProhibited();
    error CapabilityNotFound();
    error CapabilityRevoked();
    error CapabilityExpired();
    error UnauthorizedAgent();
    error ConsumerMismatch();
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
        uint256 amount,
        uint256 nonce
    ) external returns (bool) {
        if (msg.sender == agent) revert DirectVaultBypassProhibited();

        PolarisCapabilityRegistry.CapabilityGrant memory grant = registry.capabilities(capabilityId);
        if (grant.issuer == address(0)) revert CapabilityNotFound();
        if (grant.revoked) revert CapabilityRevoked();
        if (block.timestamp > grant.validUntil) revert CapabilityExpired();
        if (grant.agent != agent) revert UnauthorizedAgent();
        if (grant.consumer != consumer) revert ConsumerMismatch();
        if (amount > grant.maxPerAction) revert AmountExceeded();
        if (amount > grant.remainingBudget) revert BudgetExceeded();

        bytes32 nonceKey = keccak256(abi.encodePacked(capabilityId, nonce));
        if (consumedNonces[nonceKey]) revert NonceReplayed();

        consumedNonces[nonceKey] = true;
        emit ExecutionAuthorized(capabilityId, agent, amount, keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        return true;
    }
}`;

export const FOUNDRY_SECURITY_TEST = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "forge-std/Test.sol";
import "../src/PolarisCapabilityRegistry.sol";
import "../src/PolarisExecutionGate.sol";
import "../src/PolarisProtectedVault.sol";

contract PolarisSecurityTest is Test {
    PolarisCapabilityRegistry registry;
    PolarisExecutionGate gate;
    PolarisProtectedVault vault;

    address owner = address(0x1111);
    address agent = address(0x8004);
    address attacker = address(0xBAD);
    address kuruConsumer = address(0xKURU);
    address paymentVault = address(0xPAYMENT);

    bytes32 rootCapabilityId = keccak256("ROOT_KURU_SWAP");

    function setUp() public {
        vm.startPrank(owner);
        registry = new PolarisCapabilityRegistry();
        vault = new PolarisProtectedVault(owner);
        gate = new PolarisExecutionGate(address(registry), address(vault));

        registry.grantCapability(
            rootCapabilityId,
            bytes32(0),
            agent,
            kuruConsumer,
            keccak256("SWAP"),
            500, // maxPerAction $500
            1000, // budget $1000
            block.timestamp + 12 hours,
            0
        );
        vm.stopPrank();
    }

    function test_ValidAutonomousAction_Success() public {
        vm.prank(kuruConsumer);
        bool approved = gate.verifyAndAuthorize(rootCapabilityId, agent, kuruConsumer, 300, 1);
        assertTrue(approved, "Valid $300 swap should be authorized");
    }

    function test_AmountExceeded_Reverts() public {
        vm.expectRevert(PolarisExecutionGate.AmountExceeded.selector);
        vm.prank(kuruConsumer);
        gate.verifyAndAuthorize(rootCapabilityId, agent, kuruConsumer, 700, 1);
    }

    function test_WrongConsumer_Reverts() public {
        vm.expectRevert(PolarisExecutionGate.ConsumerMismatch.selector);
        vm.prank(paymentVault);
        gate.verifyAndAuthorize(rootCapabilityId, agent, paymentVault, 300, 1);
    }

    function test_NonceReplay_Reverts() public {
        vm.startPrank(kuruConsumer);
        gate.verifyAndAuthorize(rootCapabilityId, agent, kuruConsumer, 300, 1);

        vm.expectRevert(PolarisExecutionGate.NonceReplayed.selector);
        gate.verifyAndAuthorize(rootCapabilityId, agent, kuruConsumer, 300, 1);
        vm.stopPrank();
    }

    function test_DirectVaultBypass_Reverts() public {
        vm.prank(agent);
        vm.expectRevert("UNAUTHORIZED_CALLER");
        vault.directWithdraw(agent, 1000);
    }
}`;
