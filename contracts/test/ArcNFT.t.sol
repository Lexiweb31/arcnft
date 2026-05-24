// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ArcNFT.sol";
import "../src/ArcMarketplace.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowance[from][msg.sender] >= amount, "allowance");
        require(balanceOf[from] >= amount, "balance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract ArcNFTTest is Test {
    ArcNFT      nft;
    ArcMarketplace market;
    MockERC20   usdc;

    address alice = address(0xA11CE);
    address bob   = address(0xB0B);
    address owner = address(this);

    function setUp() public {
        usdc   = new MockERC20();
        nft    = new ArcNFT("Arc NFT", "ARCNFT");
        market = new ArcMarketplace(address(usdc));

        // Fund bob for buying
        usdc.mint(bob, 1000e6);
    }

    function test_Mint() public {
        vm.prank(alice);
        uint256 id = nft.mint(alice, "ipfs://Qm...");
        assertEq(id, 0);
        assertEq(nft.ownerOf(0), alice);
        assertEq(nft.totalSupply(), 1);
    }

    function test_TokensOfOwner() public {
        vm.startPrank(alice);
        nft.mint(alice, "ipfs://1");
        nft.mint(alice, "ipfs://2");
        nft.mint(alice, "ipfs://3");
        vm.stopPrank();

        uint256[] memory tokens = nft.tokensOfOwner(alice);
        assertEq(tokens.length, 3);
    }

    function test_ListAndBuy() public {
        // Alice mints and lists
        vm.startPrank(alice);
        nft.mint(alice, "ipfs://Qm...");
        nft.setApprovalForAll(address(market), true);
        uint256 listingId = market.list(address(nft), 0, 100e6); // 100 USDC
        vm.stopPrank();

        assertEq(listingId, 1);
        assertEq(market.activeListingsCount(), 1);

        // Bob approves and buys
        vm.startPrank(bob);
        usdc.approve(address(market), 100e6);
        market.buy(listingId);
        vm.stopPrank();

        assertEq(nft.ownerOf(0), bob);
        assertEq(market.activeListingsCount(), 0);

        // Alice received 97.5 USDC, owner received 2.5 USDC fee
        assertEq(usdc.balanceOf(alice), 97_500_000);
        assertEq(usdc.balanceOf(owner), 2_500_000);
    }

    function test_Cancel() public {
        vm.startPrank(alice);
        nft.mint(alice, "ipfs://Qm...");
        nft.setApprovalForAll(address(market), true);
        uint256 listingId = market.list(address(nft), 0, 50e6);
        market.cancel(listingId);
        vm.stopPrank();

        assertEq(market.activeListingsCount(), 0);
        (,,,,,bool active) = market.listings(listingId);
        assertFalse(active);
    }

    function test_UpdatePrice() public {
        vm.startPrank(alice);
        nft.mint(alice, "ipfs://Qm...");
        nft.setApprovalForAll(address(market), true);
        uint256 listingId = market.list(address(nft), 0, 50e6);
        market.updatePrice(listingId, 75e6);
        vm.stopPrank();

        (,,,, uint256 price,) = market.listings(listingId);
        assertEq(price, 75e6);
    }

    function test_CannotBuyOwnListing() public {
        vm.startPrank(alice);
        nft.mint(alice, "ipfs://Qm...");
        nft.setApprovalForAll(address(market), true);
        uint256 listingId = market.list(address(nft), 0, 50e6);
        usdc.mint(alice, 50e6);
        usdc.approve(address(market), 50e6);
        vm.expectRevert("Cannot buy own listing");
        market.buy(listingId);
        vm.stopPrank();
    }
}
