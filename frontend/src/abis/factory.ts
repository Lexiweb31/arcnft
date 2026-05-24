export const factoryAbi = [
  {
    inputs: [{ name: "tokenA", type: "address" }, { name: "tokenB", type: "address" }],
    name: "getPool",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
