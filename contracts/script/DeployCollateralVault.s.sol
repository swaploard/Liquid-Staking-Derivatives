// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "../src/CollateralVault.sol";
import "../test/collateralvault.sol";

contract DeployCollateralVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy mock stablecoin for testing
        // In production, replace this with your actual stablecoin address
        MockMintableERC20 stablecoin = new MockMintableERC20();
        
        // Deploy CollateralVault
        CollateralVault vault = new CollateralVault(address(stablecoin));
        
        // Optional: Add initial accepted collateral tokens
        // vault.addCollateralToken(address(0x...)); // Add your token addresses

        vm.stopBroadcast();

        console.log("Stablecoin deployed to:", address(stablecoin));
        console.log("CollateralVault deployed to:", address(vault));
    }
}