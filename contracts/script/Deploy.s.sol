// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ArcNFT.sol";
import "../src/ArcMarketplace.sol";

contract Deploy is Script {
    // Arc Testnet USDC (native gas token contract)
    address constant USDC = 0x3600000000000000000000000000000000000000;

    function run() external {
        vm.startBroadcast();

        ArcNFT nft = new ArcNFT("Arc NFT", "ARCNFT");
        ArcMarketplace marketplace = new ArcMarketplace(USDC);

        console.log("ArcNFT deployed at:        ", address(nft));
        console.log("ArcMarketplace deployed at:", address(marketplace));

        vm.stopBroadcast();
    }
}
