export const marketplaceAbi = [
  {
    inputs: [{ name: "_usdc", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  // ── Write ──────────────────────────────────────────────────────────────────
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId",     type: "uint256" },
      { name: "price",       type: "uint256" },
    ],
    name: "list",
    outputs: [{ name: "listingId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }],
    name: "buy",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }],
    name: "cancel",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }, { name: "newPrice", type: "uint256" }],
    name: "updatePrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ── View ───────────────────────────────────────────────────────────────────
  {
    inputs: [],
    name: "activeListingsCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit",  type: "uint256" },
    ],
    name: "getActiveListings",
    outputs: [
      {
        components: [
          { name: "listingId",   type: "uint256" },
          { name: "seller",      type: "address" },
          { name: "nftContract", type: "address" },
          { name: "tokenId",     type: "uint256" },
          { name: "price",       type: "uint256" },
          { name: "active",      type: "bool"    },
        ],
        name: "result",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "listingId", type: "uint256" }],
    name: "listings",
    outputs: [
      { name: "listingId",   type: "uint256" },
      { name: "seller",      type: "address" },
      { name: "nftContract", type: "address" },
      { name: "tokenId",     type: "uint256" },
      { name: "price",       type: "uint256" },
      { name: "active",      type: "bool"    },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "nftContract", type: "address" },
      { name: "tokenId",     type: "uint256" },
    ],
    name: "activeListing",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "seller", type: "address" }],
    name: "listingsBySeller",
    outputs: [{ name: "ids", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "listingCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ── Events ─────────────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "listingId",   type: "uint256" },
      { indexed: true,  name: "seller",      type: "address" },
      { indexed: true,  name: "nftContract", type: "address" },
      { indexed: false, name: "tokenId",     type: "uint256" },
      { indexed: false, name: "price",       type: "uint256" },
    ],
    name: "Listed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "listingId", type: "uint256" },
      { indexed: true,  name: "buyer",     type: "address" },
      { indexed: false, name: "price",     type: "uint256" },
    ],
    name: "Sold",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "listingId", type: "uint256" }],
    name: "Cancelled",
    type: "event",
  },
] as const;
