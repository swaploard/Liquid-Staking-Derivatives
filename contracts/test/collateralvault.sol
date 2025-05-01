// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../src/CollateralVault.sol";

contract MockERC20 is IERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to, uint256 amount) public virtual {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function burn(uint256 amount) public virtual {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
    }

    function approve(address spender, uint256 amount) public returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool) {
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract MockMintableERC20 is MockERC20, IMintableERC20 {
    constructor() MockERC20("Stablecoin", "STBL") {}

    function mint(address to, uint256 amount) public override(MockERC20, IMintableERC20) {
        super.mint(to, amount);
    }

    function burn(uint256 amount) public override(MockERC20, IMintableERC20) {
        super.burn(amount);
    }
}

contract CollateralVaultTest is Test {
    CollateralVault vault;
    MockMintableERC20 stablecoin;
    MockERC20 lsdToken;
    address owner = address(1);
    address user = address(2);
    address token3 = address(3);

    function setUp() public {
        vm.startPrank(owner);  // Start acting as owner before contract deployment
        stablecoin = new MockMintableERC20();
        lsdToken = new MockERC20("LSD Token", "LSD");
        vault = new CollateralVault(address(stablecoin));
        vault.addCollateralToken(address(lsdToken));
        vm.stopPrank();

        // Fund user with LSD tokens
        lsdToken.mint(user, 1000 ether);
        vm.prank(user);
        lsdToken.approve(address(vault), type(uint256).max);
    }

    function testCreateVault() public {
        vm.prank(user);
        vault.createVault();
        
        (, bool exists) = vault.vaults(user);
        assertTrue(exists);
    }

    function testDeleteVault() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 100 ether);
        
        // Withdraw all collateral
        vault.withdrawCollateral(address(lsdToken), 100 ether);
        vault.deleteVault();
        
        (, bool exists) = vault.vaults(user);
        assertFalse(exists);
        vm.stopPrank();
    }

    function testCannotCreateDuplicateVault() public {
        vm.startPrank(user);
        vault.createVault();
        vm.expectRevert("Vault exists");
        vault.createVault();
        vm.stopPrank();
    }

    function testDepositCollateral() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 100 ether);
        
        uint256 balance = vault.getCollateralBalance(user, address(lsdToken));
        assertEq(balance, 100 ether);
        vm.stopPrank();
    }

    function testWithdrawCollateral() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 100 ether);
        vault.withdrawCollateral(address(lsdToken), 50 ether);
        
        uint256 balance = vault.getCollateralBalance(user, address(lsdToken));
        assertEq(balance, 50 ether);
        assertEq(lsdToken.balanceOf(user), 950 ether);
        vm.stopPrank();
    }

    function testBorrowAndRepay() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 150 ether);
        
        // Borrow maximum
        uint256 maxBorrow = vault.calculateMaxBorrowable(user);
        vault.borrowStablecoin(maxBorrow);
        
        assertEq(stablecoin.balanceOf(user), maxBorrow);
        assertEq(vault.getBorrowedAmount(user), maxBorrow);
        
        // Repay
        stablecoin.approve(address(vault), maxBorrow);
        vault.repay(maxBorrow);
        
        assertEq(vault.getBorrowedAmount(user), 0);
        vm.stopPrank();
    }

    function testCannotWithdrawBelowCollateralRatio() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 150 ether);
        vault.borrowStablecoin(100 ether);
        
        // Try to withdraw too much
        vm.expectRevert("Insufficient collateral ratio");
        vault.withdrawCollateral(address(lsdToken), 50 ether);
        vm.stopPrank();
    }

    function testAdminFunctions() public {
        // Test add collateral token
        vm.prank(owner);
        vault.addCollateralToken(token3);
        assertTrue(vault.acceptedCollateralTokens(token3));

        // Test remove collateral token
        vm.prank(owner);
        vault.removeCollateralToken(token3);
        assertFalse(vault.acceptedCollateralTokens(token3));

        // Test set collateral ratio
        vm.prank(owner);
        vault.setCollateralRatio(200);
        assertEq(vault.collateralRatio(), 200);
    }

    function testNonOwnerCannotChangeSettings() public {
        vm.prank(user);
        vm.expectRevert();
        vault.addCollateralToken(token3);

        vm.prank(user);
        vm.expectRevert();
        vault.setCollateralRatio(200);
    }

    function testCollateralValueCalculation() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 100 ether);
        
        uint256 collateralValue = vault.calculateTotalCollateralValue(user);
        assertEq(collateralValue, 100 ether);
        vm.stopPrank();
    }

    function testMaxBorrowableCalculation() public {
        vm.startPrank(user);
        vault.createVault();
        vault.depositCollateral(address(lsdToken), 150 ether);
        
        uint256 maxBorrow = vault.calculateMaxBorrowable(user);
        assertEq(maxBorrow, (150 ether * 100) / 150); // 100 ether
        vm.stopPrank();
    }
}