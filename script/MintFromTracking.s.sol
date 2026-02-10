// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {HeartPillowNFT} from "../src/HeartPillowNFT.sol";

contract MintFromTracking is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("NFT_CONTRACT_ADDRESS");
        address to = vm.envAddress("MINT_TO");
        string memory pillowId = vm.envString("PILLOW_ID");
        string memory tokenUri = vm.envString("TOKEN_URI");

        vm.startBroadcast(deployerKey);
        HeartPillowNFT(contractAddress).mintToOwner(to, pillowId, tokenUri);
        vm.stopBroadcast();
    }
}

