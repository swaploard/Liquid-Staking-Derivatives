// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "chainlink-brownie-contracts/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@redstone-finance/evm-connector/contracts/data-services/MainDemoConsumerBase.sol";

interface IMintableERC20 is IERC20 {
    function mint(address to, uint256 amount) external;
    function burn(uint256 amount) external;
}

interface IRedstoneOracle {
    function getPrice(bytes32 symbol) external view returns (uint256);
    function getPrice(
        bytes32 symbol,
        uint256 timeout
    ) external view returns (uint256);
}

contract CollateralVault is Ownable, MainDemoConsumerBase {
    using SafeERC20 for IERC20;

    struct Vault {
        mapping(address => uint256) collateralBalances;
        uint256 borrowedAmount;
        bool exists;
    }

    struct OracleConfig {
        address chainlinkAggregator;
        uint256 maxPriceAge;
        bool useRedstoneFallback;
    }

    mapping(address => Vault) public vaults;
    mapping(address => bool) public acceptedCollateralTokens;
    mapping(address => OracleConfig) public tokenOracles;
    mapping(address => bytes32) public tokenSymbols;
    uint256 public collateralRatio = 150; // 150%
    uint256 public liquidationThreshold = 120;
    uint256 public liquidationBonus = 10;
    uint256 public constant MAX_LIQUIDATION_BONUS = 20;
    uint256 public constant PRICE_IMPACT_PERCENTAGE = 2;
    uint256 public constant RATIO_DIVISOR = 100;
    address[] public acceptedTokensList;
    IMintableERC20 public immutable stablecoin;

    event OracleConfigured(
        address indexed token,
        address aggregator,
        uint256 maxAge
    );
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
    event VaultLiquidated(
        address indexed user,
        address indexed liquidator,
        address indexed token,
        uint256 debtRepaid,
        uint256 collateralLiquidated,
        uint256 bonus
    );
    event StablecoinBorrowed(address indexed user, uint256 amount);
    event StablecoinRepaid(address indexed user, uint256 amount);
    event VaultDeleted(address indexed user);
    event CollateralTokenAdded(address indexed token);
    event CollateralTokenRemoved(address indexed token);

    constructor(address _stablecoin) {
        stablecoin = IMintableERC20(_stablecoin);
    }

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

        uint256 totalCollateral;
        for (uint256 i = 0; i < getAcceptedTokensCount(); i++) {
            address token = getAcceptedTokenAtIndex(i);
            totalCollateral += vault.collateralBalances[token];
        }
        require(totalCollateral == 0, "Collateral not cleared");

        delete vaults[msg.sender];
        emit VaultDeleted(msg.sender);
    }

    function addCollateralToken(address token) external onlyOwner {
        require(!acceptedCollateralTokens[token], "Token already accepted");
        _addCollateralToken(token);
        emit CollateralTokenAdded(token);
    }

    function removeCollateralToken(address token) external onlyOwner {
        require(acceptedCollateralTokens[token], "Token not accepted");
        _removeCollateralToken(token);
        emit CollateralTokenRemoved(token);
    }

    function setCollateralRatio(uint256 newRatio) external onlyOwner {
        require(newRatio >= 100, "Ratio too low");
        collateralRatio = newRatio;
    }

    function getCollateralValueInUSD(
        address token,
        uint256 amount
    ) public view returns (uint256) {
        require(acceptedCollateralTokens[token], "Unaccepted collateral");

        OracleConfig memory config = tokenOracles[token];
        uint256 chainlinkValue = _getChainlinkPrice(token, amount, config);

        if (chainlinkValue > 0) {
            return chainlinkValue;
        }

        if (config.useRedstoneFallback) {
            return _getRedstonePrice(token, amount);
        }

        revert("Price unavailable");
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
    // returns the ratio of collateral value to borrowed amount
    // Health factor below liquidationThreshold (120%) makes the position eligible for liquidation
    function calculateHealthFactor(address user) public view returns (uint256) {
        Vault storage vault = vaults[user];
        if (vault.borrowedAmount == 0) return type(uint256).max;

        uint256 totalCollateralValueInUSD = 0;
        for (uint256 i = 0; i < getAcceptedTokensCount(); i++) {
            address token = getAcceptedTokenAtIndex(i);
            uint256 collateralAmount = vault.collateralBalances[token];
            if (collateralAmount > 0) {
                totalCollateralValueInUSD += getCollateralValueInUSD(
                    token,
                    collateralAmount
                );
            }
        }

        return
            (totalCollateralValueInUSD * RATIO_DIVISOR) / vault.borrowedAmount;
    }
    // Liquidators repay some portion of the user's debt\
    // receive collateral plus a bonus (default 10%)
    function liquidate(
        address user,
        address token,
        uint256 debtToRepay
    ) external {
        require(user != msg.sender, "Cannot liquidate own position");

        Vault storage vault = vaults[user];
        require(vault.exists, "Vault doesn't exist");
        require(debtToRepay > 0, "Invalid debt amount");
        require(debtToRepay <= vault.borrowedAmount, "Exceeds user debt");

        uint256 healthFactor = calculateHealthFactor(user);
        require(
            healthFactor < liquidationThreshold,
            "Position not liquidatable"
        );

        uint256 tokenCollateralAmount = vault.collateralBalances[token];
        require(tokenCollateralAmount > 0, "No collateral available");

        uint256 collateralValueInUSD = getCollateralValueInUSD(
            token,
            tokenCollateralAmount
        );
        uint256 baseCollateralToLiquidate = (debtToRepay *
            (RATIO_DIVISOR + liquidationBonus)) / RATIO_DIVISOR;

        uint256 priceImpact = (baseCollateralToLiquidate *
            PRICE_IMPACT_PERCENTAGE) / RATIO_DIVISOR;
        uint256 totalCollateralToLiquidate = baseCollateralToLiquidate +
            priceImpact;

        require(
            totalCollateralToLiquidate <= tokenCollateralAmount,
            "Insufficient collateral"
        );

        IERC20(address(stablecoin)).safeTransferFrom(
            msg.sender,
            address(this),
            debtToRepay
        );
        stablecoin.burn(debtToRepay);

        vault.borrowedAmount -= debtToRepay;
        vault.collateralBalances[token] -= totalCollateralToLiquidate;

        IERC20(token).safeTransfer(msg.sender, totalCollateralToLiquidate);

        emit VaultLiquidated(
            user,
            msg.sender,
            token,
            debtToRepay,
            totalCollateralToLiquidate,
            liquidationBonus
        );
    }

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

    function _getChainlinkPrice(
        address token,
        uint256 amount,
        OracleConfig memory config
    ) private view returns (uint256) {
        if (config.chainlinkAggregator == address(0)) return 0;

        AggregatorV3Interface priceFeed = AggregatorV3Interface(
            config.chainlinkAggregator
        );
        (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        require(price > 0, "Invalid price");
        require(
            block.timestamp - updatedAt <= config.maxPriceAge,
            "Stale price"
        );
        require(answeredInRound >= roundId, "Stale round");

        uint8 decimals = priceFeed.decimals();
        uint8 tokenDecimals = IERC20Metadata(token).decimals();
        uint256 totalValue = amount * uint256(price);
        uint256 normalizedPrice = totalValue / (10 ** decimals);
        return normalizedPrice / 1e18;
    }

    function setTokenSymbol(address token, bytes32 symbol) external onlyOwner {
        tokenSymbols[token] = symbol;
    }

    function setLiquidationParameters(
        uint256 newLiquidationThreshold,
        uint256 newLiquidationBonus
    ) external onlyOwner {
        require(
            newLiquidationThreshold < collateralRatio,
            "Threshold must be below collateral ratio"
        );
        require(newLiquidationThreshold >= 100, "Threshold too low");
        require(newLiquidationBonus <= MAX_LIQUIDATION_BONUS, "Bonus too high");

        liquidationThreshold = newLiquidationThreshold;
        liquidationBonus = newLiquidationBonus;
    }

    function _getRedstonePrice(
        address token,
        uint256 amount
    ) private view returns (uint256) {
        bytes32 symbol = tokenSymbols[token];
        require(symbol != bytes32(0), "Symbol not configured");

        uint256 price = getOracleNumericValueFromTxMsg(symbol);
        require(price > 0, "Invalid Redstone price");

        uint8 tokenDecimals = IERC20Metadata(token).decimals();
        return (amount * price) / (10 ** tokenDecimals);
    }

    function configureOracle(
        address token,
        address chainlinkAggregator,
        uint256 maxPriceAge,
        bool useRedstoneFallback
    ) external onlyOwner {
        tokenOracles[token] = OracleConfig({
            chainlinkAggregator: chainlinkAggregator,
            maxPriceAge: maxPriceAge,
            useRedstoneFallback: useRedstoneFallback
        });
        emit OracleConfigured(token, chainlinkAggregator, maxPriceAge);
    }
}
