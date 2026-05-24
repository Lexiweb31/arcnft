// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/// @title ArcNFT
/// @notice Permissionless ERC-721 collection — anyone can mint with a custom tokenURI.
///         Deploy this contract to create your own collection on Arc Testnet.
contract ArcNFT is ERC721URIStorage {
    uint256 private _nextTokenId;

    event Minted(address indexed to, uint256 indexed tokenId, string tokenURI);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    /// @notice Mint a new token. tokenURI_ should be an IPFS URI pointing to ERC-721 metadata JSON.
    function mint(address to, string calldata tokenURI_) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        emit Minted(to, tokenId, tokenURI_);
    }

    /// @notice Total number of tokens ever minted (not accounting for burns).
    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    /// @notice Returns all tokenIds currently owned by `owner`.
    ///         Linear scan — fine for testnet scale.
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 total = _nextTokenId;
        uint256 balance = balanceOf(owner);
        uint256[] memory tokens = new uint256[](balance);
        uint256 idx = 0;
        for (uint256 i = 0; i < total && idx < balance; i++) {
            if (_ownerOf(i) == owner) {
                tokens[idx++] = i;
            }
        }
        return tokens;
    }
}
