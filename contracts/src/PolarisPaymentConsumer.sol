// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "./PolarisExecutionGate.sol";
import "./PolarisProtectedVault.sol";

/**
 * @title PolarisPaymentConsumer
 * @notice Reference Application Consumer for USDC Invoice Payments & Streams
 */
contract PolarisPaymentConsumer {
    PolarisExecutionGate public immutable executionGate;
    PolarisProtectedVault public immutable protectedVault;

    bytes32 public constant ACTION_PAYMENT = keccak256("PAYMENT");

    event InvoicePaid(bytes32 indexed capabilityId, address indexed merchant, uint256 amount);

    constructor(address _gate, address _vault) {
        executionGate = PolarisExecutionGate(_gate);
        protectedVault = PolarisProtectedVault(_vault);
    }

    function executeInvoicePayment(
        bytes32 capabilityId,
        address agent,
        address merchant,
        address usdcToken,
        uint256 amount,
        uint256 nonce
    ) external returns (bool) {
        // Route through POLARIS ExecutionGate to verify all invariants
        bool authorized = executionGate.verifyAndAuthorize(
            capabilityId,
            agent,
            address(this), // consumer binding must match this contract
            address(this),
            usdcToken,
            ACTION_PAYMENT,
            amount,
            nonce
        );

        require(authorized, "GATE_AUTHORIZATION_FAILED");

        // Execute vault transfer to merchant
        protectedVault.executeAuthorizedTransfer(usdcToken, merchant, amount);

        emit InvoicePaid(capabilityId, merchant, amount);
        return true;
    }
}
