// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

contract CollateralVault is Ownable {
    using SafeERC20 for IERC20;

    struct Vault {
        mapping(address => uint256) collateralBalances; // Token address => amount
        uint256 borrowedAmount;
        bool exists;
    }

    mapping(address => Vault) public vaults;
    mapping(address => bool) public acceptedCollateralTokens;
    uint256 public collateralRatio = 150; // 150%
    uint256 public constant RATIO_DIVISOR = 100;

    IMintableERC20 public immutable stablecoin;

    event VaultCreated(address indexed user);
    event CollateralDeposited(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event CollateralWithdrawn(
        address indexed user,
        address indexed token,
        uint256 amount
    );
    event StablecoinBorrowed(address indexed user, uint256 amount);
    event StablecoinRepaid(address indexed user, uint256 amount);
    event VaultDeleted(address indexed user);
    event CollateralTokenAdded(address indexed token);
    event CollateralTokenRemoved(address indexed token);

    constructor(address _stablecoin) Ownable(msg.sender) {
        stablecoin = IMintableERC20(_stablecoin);
    }

    // CRUD Operations
    function createVault() external {
        require(!vaults[msg.sender].exists, "Vault exists");
        vaults[msg.sender].exists = true;
        emit VaultCreated(msg.sender);
    }

    function depositCollateral(address token, uint256 amount) external {
        require(acceptedCollateralTokens[token], "Token not accepted");
        require(amount > 0, "Invalid amount");

        Vault storage vault = vaults[msg.sender];
        require(vault.exists, "Vault doesn't exist");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        vault.collateralBalances[token] += amount;

        emit CollateralDeposited(msg.sender, token, amount);
    }

    function withdrawCollateral(address token, uint256 amount) external {
        require(amount > 0, "Invalid amount");

        Vault storage vault = vaults[msg.sender];
        require(vault.exists, "Vault doesn't exist");
        require(
            vault.collateralBalances[token] >= amount,
            "Insufficient collateral"
        );

        // Check collateral ratio after withdrawal
        uint256 totalCollateralValue = calculateTotalCollateralValue(
            msg.sender
        );
        uint256 newCollateralValue = totalCollateralValue - amount;
        require(
            newCollateralValue * RATIO_DIVISOR >=
                vault.borrowedAmount * collateralRatio,
            "Insufficient collateral ratio"
        );

        vault.collateralBalances[token] -= amount;
        IERC20(token).safeTransfer(msg.sender, amount);

        emit CollateralWithdrawn(msg.sender, token, amount);
    }

    function borrowStablecoin(uint256 amount) external {
        require(amount > 0, "Invalid amount");

        Vault storage vault = vaults[msg.sender];
        require(vault.exists, "Vault doesn't exist");

        uint256 totalCollateralValue = calculateTotalCollateralValue(
            msg.sender
        );
        require(
            totalCollateralValue * RATIO_DIVISOR >=
                (vault.borrowedAmount + amount) * collateralRatio,
            "Insufficient collateral ratio"
        );

        vault.borrowedAmount += amount;
        stablecoin.mint(msg.sender, amount);

        emit StablecoinBorrowed(msg.sender, amount);
    }

    function repay(uint256 amount) external {
        require(amount > 0, "Invalid amount");

        Vault storage vault = vaults[msg.sender];
        require(vault.exists, "Vault doesn't exist");
        require(vault.borrowedAmount >= amount, "Repay amount exceeds debt");

        IERC20(address(stablecoin)).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );
        stablecoin.burn(amount);
        vault.borrowedAmount -= amount;

        emit StablecoinRepaid(msg.sender, amount);
    }

    function deleteVault() external {
        Vault storage vault = vaults[msg.sender];
        require(vault.exists, "Vault doesn't exist");
        require(vault.borrowedAmount == 0, "Outstanding debt");

        // Check all collateral balances are zero
        uint256 totalCollateral;
        for (uint256 i = 0; i < getAcceptedTokensCount(); i++) {
            address token = getAcceptedTokenAtIndex(i);
            totalCollateral += vault.collateralBalances[token];
        }
        require(totalCollateral == 0, "Collateral not cleared");

        delete vaults[msg.sender];
        emit VaultDeleted(msg.sender);
    }

    // Admin functions
    function addCollateralToken(address token) external onlyOwner {
        require(!acceptedCollateralTokens[token], "Token already accepted");
        _addCollateralToken(token); // Call internal implementation
        emit CollateralTokenAdded(token);
    }

    function removeCollateralToken(address token) external onlyOwner {
        require(acceptedCollateralTokens[token], "Token not accepted");
        _removeCollateralToken(token); // Call internal implementation
        emit CollateralTokenRemoved(token);
    }

    function setCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Ratio too low");
        collateralRatio = newRatio;
    }

    // View functions
    function getCollateralBalance(
        address user,
        address token
    ) external view returns (uint256) {
        return vaults[user].collateralBalances[token];
    }

    function getBorrowedAmount(address user) external view returns (uint256) {
        return vaults[user].borrowedAmount;
    }

    function calculateTotalCollateralValue(
        address user
    ) public view returns (uint256) {
        // In a real implementation, you would use price oracles to get token values
        // For simplicity, we assume 1:1 value here
        uint256 total;
        for (uint256 i = 0; i < getAcceptedTokensCount(); i++) {
            address token = getAcceptedTokenAtIndex(i);
            total += vaults[user].collateralBalances[token];
        }
        return total;
    }

    function calculateMaxBorrowable(
        address user
    ) external view returns (uint256) {
        uint256 totalCollateralValue = calculateTotalCollateralValue(user);
        uint256 maxBorrow = (totalCollateralValue * RATIO_DIVISOR) /
            collateralRatio;
        return
            maxBorrow > vaults[user].borrowedAmount
                ? maxBorrow - vaults[user].borrowedAmount
                : 0;
    }

    // Helper functions for iterating through accepted tokens
    address[] public acceptedTokensList;

    function getAcceptedTokensCount() public view returns (uint256) {
        return acceptedTokensList.length;
    }

    function getAcceptedTokenAtIndex(
        uint256 index
    ) public view returns (address) {
        require(index < acceptedTokensList.length, "Index out of bounds");
        return acceptedTokensList[index];
    }

    function _addCollateralToken(address token) internal {
        if (!acceptedCollateralTokens[token]) {
            acceptedCollateralTokens[token] = true;
            acceptedTokensList.push(token);
        }
    }

    function _removeCollateralToken(address token) internal {
        if (acceptedCollateralTokens[token]) {
            acceptedCollateralTokens[token] = false;
            for (uint256 i = 0; i < acceptedTokensList.length; i++) {
                if (acceptedTokensList[i] == token) {
                    acceptedTokensList[i] = acceptedTokensList[
                        acceptedTokensList.length - 1
                    ];
                    acceptedTokensList.pop();
                    break;
                }
            }
        }
    }
}
