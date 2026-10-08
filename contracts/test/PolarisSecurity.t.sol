// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

import "../src/PolarisCapabilityRegistry.sol";
import "../src/PolarisExecutionGate.sol";
import "../src/PolarisProtectedVault.sol";
import "../src/PolarisKuruConsumer.sol";
import "../src/PolarisPaymentConsumer.sol";

/**
 * @title PolarisSecurityTest
 * @notice Comprehensive Foundry Security Test Suite for POLARIS on Monad
 */
contract PolarisSecurityTest {
    PolarisCapabilityRegistry registry;
    PolarisExecutionGate gate;
    PolarisProtectedVault vault;
    PolarisKuruConsumer kuruConsumer;
    PolarisPaymentConsumer paymentConsumer;

    address owner = address(0x1111);
    address agent = address(0x8004);
    address attacker = address(0xBAD);
    address kuruRouter = address(0x8004101438004101438004101438004101438004);
    address usdcToken = address(0x10143_USDC);

    bytes32 rootCapabilityId = keccak256("ROOT_KURU_SWAP_001");
    bytes32 childCapabilityId = keccak256("CHILD_KURU_SWAP_002");

    function setUp() public {
        registry = new PolarisCapabilityRegistry();
        vault = new PolarisProtectedVault(owner);
        gate = new PolarisExecutionGate(address(registry), address(vault));

        kuruConsumer = new PolarisKuruConsumer(address(gate), address(vault), kuruRouter);
        paymentConsumer = new PolarisPaymentConsumer(address(gate), address(vault));

        vault.setExecutionGate(address(gate));

        // Grant root capability ($500 maxPerAction, $1,000 allocated budget)
        registry.grantCapability(
            rootCapabilityId,
            bytes32(0),
            owner,
            agent,
            address(kuruConsumer),
            keccak256("SWAP"),
            kuruRouter,
            usdcToken,
            500, // maxPerAction
            1000, // allocatedBudget
            block.timestamp,
            block.timestamp + 12 hours,
            0,
            ""
        );
    }

    function test_ValidAutonomousAction_Success() public returns (bool) {
        bool success = kuruConsumer.executeKuruSwap(rootCapabilityId, agent, usdcToken, 300, 1);
        require(success, "Valid 300 swap should succeed");
        return true;
    }

    function test_AmountExceeded_Reverts() public returns (bool) {
        try kuruConsumer.executeKuruSwap(rootCapabilityId, agent, usdcToken, 700, 1) {
            revert("SHOULD_HAVE_REVERTED");
        } catch {
            return true; // Correctly reverted!
        }
    }

    function test_WrongConsumer_Reverts() public returns (bool) {
        try paymentConsumer.executeInvoicePayment(rootCapabilityId, agent, attacker, usdcToken, 300, 1) {
            revert("SHOULD_HAVE_REVERTED");
        } catch {
            return true; // Correctly reverted with ConsumerMismatch!
        }
    }

    function test_NonceReplay_Reverts() public returns (bool) {
        kuruConsumer.executeKuruSwap(rootCapabilityId, agent, usdcToken, 300, 1);

        try kuruConsumer.executeKuruSwap(rootCapabilityId, agent, usdcToken, 300, 1) {
            revert("SHOULD_HAVE_REVERTED");
        } catch {
            return true; // Correctly reverted with NonceReplayed!
        }
    }

    function test_DirectVaultBypass_Reverts() public returns (bool) {
        try vault.directWithdraw(usdcToken, 1000) {
            revert("SHOULD_HAVE_REVERTED");
        } catch {
            return true; // Correctly reverted with UnauthorizedCaller!
        }
    }
}
