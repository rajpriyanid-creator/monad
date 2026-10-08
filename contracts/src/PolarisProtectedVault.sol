// SPDX-License-Identifier: MIT
pragma solidity 0.8.31;

/**
 * @title PolarisProtectedVault
 * @notice Protected Treasury Vault on Monad
 * @dev Direct withdrawal calls from agent EOAs REVERT with UNAUTHORIZED_CALLER.
 * Funds can only move when authorized by PolarisExecutionGate.
 */
contract PolarisProtectedVault {
    address public immutable owner;
    address public executionGate;
    bool public isPaused;

    mapping(address => uint256) public tokenBalances;

    event FundsWithdrawn(address indexed recipient, address indexed token, uint256 amount);
    event ExecutionGateUpdated(address indexed newGate);

    error UnauthorizedCaller();
    error VaultIsPaused();
    error InsufficientVaultBalance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert UnauthorizedCaller();
        _;
    }

    modifier onlyGate() {
        if (msg.sender != executionGate) revert UnauthorizedCaller();
        _;
    }

    constructor(address _owner) {
        owner = _owner;
        // Seed initial demo balances (e.g. 10,000 USDC)
        tokenBalances[address(0x10143_USDC)] = 10000 * 1e6;
    }

    function setExecutionGate(address _gate) external onlyOwner {
        executionGate = _gate;
        emit ExecutionGateUpdated(_gate);
    }

    /**
     * @notice Direct agent withdrawal call. MUST REVERT with UnauthorizedCaller.
     */
    function directWithdraw(address token, uint256 amount) external pure {
        // Direct call from EOA or agent without routing through ExecutionGate ALWAYS REVERTS!
        revert UnauthorizedCaller();
    }

    /**
     * @notice Execute authorized transfer. Can ONLY be called by PolarisExecutionGate.
     */
    function executeAuthorizedTransfer(
        address token,
        address recipient,
        uint256 amount
    ) external onlyGate returns (bool) {
        if (isPaused) revert VaultIsPaused();
        if (tokenBalances[token] < amount) revert InsufficientVaultBalance();

        tokenBalances[token] -= amount;
        emit FundsWithdrawn(recipient, token, amount);
        return true;
    }

    function pauseVault(bool _paused) external onlyOwner {
        isPaused = _paused;
    }
}
