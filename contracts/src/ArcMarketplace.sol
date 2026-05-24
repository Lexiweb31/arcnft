// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ArcMarketplace
/// @notice Open NFT marketplace — list and trade any ERC-721 for USDC.
///         2.5% fee on each sale goes to the contract owner.
contract ArcMarketplace is Ownable, ReentrancyGuard {
    IERC20 public immutable usdc;
    uint256 public constant FEE_BPS = 250;  // 2.5%
    uint256 public constant BPS = 10_000;

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;  // USDC amount, 6 decimals
        bool    active;
    }

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    /// @dev nftContract => tokenId => active listingId (0 = none)
    mapping(address => mapping(uint256 => uint256)) public activeListing;

    // Active listing ID array for enumeration (swap-and-pop removal)
    uint256[] private _activeIds;
    mapping(uint256 => uint256) private _activeIdIndex;

    // ── Events ──────────────────────────────────────────────────────────────
    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    event Sold(uint256 indexed listingId, address indexed buyer, uint256 price);
    event Cancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 newPrice);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    // ── Write ────────────────────────────────────────────────────────────────

    function list(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external returns (uint256 listingId) {
        require(price > 0, "Price must be > 0");
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, "Not owner");
        require(
            IERC721(nftContract).isApprovedForAll(msg.sender, address(this)) ||
            IERC721(nftContract).getApproved(tokenId) == address(this),
            "Not approved"
        );
        require(activeListing[nftContract][tokenId] == 0, "Already listed");

        listingId = ++listingCount;
        listings[listingId] = Listing({
            listingId:   listingId,
            seller:      msg.sender,
            nftContract: nftContract,
            tokenId:     tokenId,
            price:       price,
            active:      true
        });
        activeListing[nftContract][tokenId] = listingId;

        _activeIdIndex[listingId] = _activeIds.length;
        _activeIds.push(listingId);

        emit Listed(listingId, msg.sender, nftContract, tokenId, price);
    }

    function buy(uint256 listingId) external nonReentrant {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(l.seller != msg.sender, "Cannot buy own listing");

        uint256 fee          = (l.price * FEE_BPS) / BPS;
        uint256 sellerAmount = l.price - fee;

        l.active = false;
        _removeActive(listingId);
        activeListing[l.nftContract][l.tokenId] = 0;

        usdc.transferFrom(msg.sender, l.seller, sellerAmount);
        if (fee > 0) usdc.transferFrom(msg.sender, owner(), fee);
        IERC721(l.nftContract).safeTransferFrom(l.seller, msg.sender, l.tokenId);

        emit Sold(listingId, msg.sender, l.price);
    }

    function cancel(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(l.seller == msg.sender, "Not seller");

        l.active = false;
        _removeActive(listingId);
        activeListing[l.nftContract][l.tokenId] = 0;

        emit Cancelled(listingId);
    }

    function updatePrice(uint256 listingId, uint256 newPrice) external {
        require(newPrice > 0, "Price must be > 0");
        Listing storage l = listings[listingId];
        require(l.active, "Not active");
        require(l.seller == msg.sender, "Not seller");

        l.price = newPrice;
        emit PriceUpdated(listingId, newPrice);
    }

    // ── View ─────────────────────────────────────────────────────────────────

    function activeListingsCount() external view returns (uint256) {
        return _activeIds.length;
    }

    function getActiveListings(uint256 offset, uint256 limit)
        external
        view
        returns (Listing[] memory result)
    {
        uint256 total = _activeIds.length;
        if (offset >= total) return new Listing[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        result = new Listing[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = listings[_activeIds[i]];
        }
    }

    /// @notice Returns all active listing IDs for a specific seller.
    function listingsBySeller(address seller)
        external
        view
        returns (uint256[] memory ids)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < _activeIds.length; i++) {
            if (listings[_activeIds[i]].seller == seller) count++;
        }
        ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < _activeIds.length; i++) {
            if (listings[_activeIds[i]].seller == seller) ids[idx++] = _activeIds[i];
        }
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _removeActive(uint256 listingId) internal {
        uint256 idx  = _activeIdIndex[listingId];
        uint256 last = _activeIds[_activeIds.length - 1];
        _activeIds[idx]       = last;
        _activeIdIndex[last]  = idx;
        _activeIds.pop();
        delete _activeIdIndex[listingId];
    }
}
