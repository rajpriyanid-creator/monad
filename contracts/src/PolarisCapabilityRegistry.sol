// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/**
 * @title PolarisCapabilityRegistry
 * @notice Onchain Passport & Capability Grant Registry with EIP-712 Verification & Attenuation on Monad
 * @dev Monad Testnet Chain ID 10143 / Mainnet Chain ID 143
 */
contract PolarisCapabilityRegistry {
    struct CapabilityGrant {
        bytes32 capabilityId;
        bytes32 parentCapabilityId;
        address issuer;
        address agent;
        address consumer;
        bytes32 actionType;
        address targetContract;
        address assetToken;
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
        "CapabilityGrant(bytes32 capabilityId,bytes32 parentCapabilityId,address issuer,address agent,address consumer,bytes32 actionType,address targetContract,address assetToken,uint256 maxPerAction,uint256 allocatedBudget,uint256 validAfter,uint256 validUntil,uint256 nonce)"
    );

    bytes32 public immutable DOMAIN_SEPARATOR;

    mapping(bytes32 => CapabilityGrant) public capabilities;
    mapping(address => uint256) public issuerNonces;

    event CapabilityGranted(
        bytes32 indexed capabilityId,
        bytes32 indexed parentCapabilityId,
        address indexed issuer,
        address agent,
        address consumer,
        uint256 allocatedBudget
    );
    event CapabilityRevoked(bytes32 indexed capabilityId, address indexed issuer);
    event BudgetConsumed(bytes32 indexed capabilityId, uint256 amountSpent, uint256 remainingBudget);

    error ParentCapabilityNotFound();
    error ParentCapabilityRevoked();
    error CapabilityEscalationAmount();
    error ParentBudgetExceeded();
    error ExpiryEscalation();
    error InvalidIssuerSignature();
    error CapabilityAlreadyExists();
    error UnauthorizedRevocation();

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("POLARIS Capability Passport")),
                keccak256(bytes("1.0.0")),
                block.chainid,
                address(this)
            )
        );
    }

    function getGrantDigest(
        bytes32 capabilityId,
        bytes32 parentCapabilityId,
        address issuer,
        address agent,
        address consumer,
        bytes32 actionType,
        address targetContract,
        address assetToken,
        uint256 maxPerAction,
        uint256 allocatedBudget,
        uint256 validAfter,
        uint256 validUntil,
        uint256 nonce
    ) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                CAPABILITY_TYPEHASH,
                capabilityId,
                parentCapabilityId,
                issuer,
                agent,
                consumer,
                actionType,
                targetContract,
                assetToken,
                maxPerAction,
                allocatedBudget,
                validAfter,
                validUntil,
                nonce
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function grantCapability(
        bytes32 capabilityId,
        bytes32 parentCapabilityId,
        address issuer,
        address agent,
        address consumer,
        bytes32 actionType,
        address targetContract,
        address assetToken,
        uint256 maxPerAction,
        uint256 allocatedBudget,
        uint256 validAfter,
        uint256 validUntil,
        uint8 verificationMode,
        bytes memory signature
    ) external returns (bytes32) {
        if (capabilities[capabilityId].issuer != address(0)) revert CapabilityAlreadyExists();

        // If parent capability exists, enforce attenuation checks
        if (parentCapabilityId != bytes32(0)) {
            CapabilityGrant storage parent = capabilities[parentCapabilityId];
            if (parent.issuer == address(0)) revert ParentCapabilityNotFound();
            if (parent.revoked) revert ParentCapabilityRevoked();
            if (maxPerAction > parent.maxPerAction) revert CapabilityEscalationAmount();
            if (allocatedBudget > parent.remainingBudget) revert ParentBudgetExceeded();
            if (validUntil > parent.validUntil) revert ExpiryEscalation();

            // Deduct allocated child budget from parent's spendable balance to prevent double spending
            parent.remainingBudget -= allocatedBudget;
        }

        // Verify EIP-712 Issuer Signature if signature is provided
        if (signature.length == 65) {
            bytes32 digest = getGrantDigest(
                capabilityId,
                parentCapabilityId,
                issuer,
                agent,
                consumer,
                actionType,
                targetContract,
                assetToken,
                maxPerAction,
                allocatedBudget,
                validAfter,
                validUntil,
                issuerNonces[issuer] + 1
            );
            address recovered = recoverSigner(digest, signature);
            if (recovered != issuer) revert InvalidIssuerSignature();
            issuerNonces[issuer] += 1;
        }

        capabilities[capabilityId] = CapabilityGrant({
            capabilityId: capabilityId,
            parentCapabilityId: parentCapabilityId,
            issuer: issuer,
            agent: agent,
            consumer: consumer,
            actionType: actionType,
            targetContract: targetContract,
            assetToken: assetToken,
            maxPerAction: maxPerAction,
            allocatedBudget: allocatedBudget,
            spentBudget: 0,
            remainingBudget: allocatedBudget,
            validAfter: validAfter,
            validUntil: validUntil,
            nonce: 1,
            revoked: false,
            verificationMode: verificationMode
        });

        emit CapabilityGranted(capabilityId, parentCapabilityId, issuer, agent, consumer, allocatedBudget);
        return capabilityId;
    }

    function consumeBudget(bytes32 capabilityId, uint256 amount) external {
        CapabilityGrant storage grant = capabilities[capabilityId];
        require(grant.remainingBudget >= amount, "BUDGET_EXCEEDED");
        grant.spentBudget += amount;
        grant.remainingBudget -= amount;
        grant.nonce += 1;
        emit BudgetConsumed(capabilityId, amount, grant.remainingBudget);
    }

    function revokeCapability(bytes32 capabilityId) external {
        CapabilityGrant storage grant = capabilities[capabilityId];
        if (grant.issuer != msg.sender) revert UnauthorizedRevocation();
        grant.revoked = true;
        emit CapabilityRevoked(capabilityId, msg.sender);
    }

    function recoverSigner(bytes32 digest, bytes memory sig) public pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        return ecrecover(digest, v, r, s);
    }
}
