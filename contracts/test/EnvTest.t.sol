// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";

contract EnvTest is Test {
    function setUp() public {}

    function testEnvVariables() public {
        // Read string value
        string memory rpcUrl = vm.envString("SEPOLIA_RPC_URL");
        
        assertEq(rpcUrl, "https://sepolia.infura.io/v3/32de3b626ccc4976bfc4955df17c3921");
        // Read ETH price
        uint256 ethPrice = vm.envUint("ETH_PRICE");
        assertEq(ethPrice, 2000);
    }
}