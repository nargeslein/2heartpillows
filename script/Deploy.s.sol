// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HeartPillowNFT} from "../src/HeartPillowNFT.sol";

contract DeployHeartPillowNFT is Script {
    function run() external returns (HeartPillowNFT deployed) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);
        deployed = new HeartPillowNFT("2heartpillows", "HEART");
        vm.stopBroadcast();
    }
}

