// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "./PolarisExecutionGate.sol";
import "./PolarisProtectedVault.sol";

/**
 * @title PolarisKuruConsumer
 * @notice Reference Application Consumer for Kuru Flow DEX Spot Swaps
 */
contract PolarisKuruConsumer {
    PolarisExecutionGate public immutable executionGate;
    PolarisProtectedVault public immutable protectedVault;
    address public immutable kuruRouter;

    bytes32 public constant ACTION_SWAP = keccak256("SWAP");

    event KuruSwapExecuted(bytes32 indexed capabilityId, address indexed agent, uint256 amount);

    constructor(address _gate, address _vault, address _kuruRouter) {
        executionGate = PolarisExecutionGate(_gate);
        protectedVault = PolarisProtectedVault(_vault);
        kuruRouter = _kuruRouter;
    }

    function executeKuruSwap(
        bytes32 capabilityId,
        address agent,
        address assetIn,
        uint256 amount,
        uint256 nonce
    ) external returns (bool) {
        // Route through POLARIS ExecutionGate to verify all invariants
        bool authorized = executionGate.verifyAndAuthorize(
            capabilityId,
            agent,
            address(this), // consumer binding must match this contract
            kuruRouter,
            assetIn,
            ACTION_SWAP,
            amount,
            nonce
        );

        require(authorized, "GATE_AUTHORIZATION_FAILED");

        // Execute vault transfer for swap
        protectedVault.executeAuthorizedTransfer(assetIn, kuruRouter, amount);

        emit KuruSwapExecuted(capabilityId, agent, amount);
        return true;
    }
}
