// ── NFT / Marketplace ─────────────────────────────────────────────────────────
export const NFT_ADDRESS         = "0xfD88BBe38f25344D9665c4b55Ffd71866555Cc59" as `0x${string}`;
export const MARKETPLACE_ADDRESS = "0xb73fa07280a9b7E10BA3665944d7940921Db1870" as `0x${string}`;
export const USDC_ADDRESS        = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const USDC_DECIMALS       = 6;

// ── ArcSwap DEX ───────────────────────────────────────────────────────────────
export const FACTORY_ADDRESS = "0x018943649337F3228fd8177F7b4BAe1DB9e65c78" as `0x${string}`;
export const ROUTER_ADDRESS  = "0xB0B2Fef2656a8fc76968F992A5673c60D844A587" as `0x${string}`;

export interface Token {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export const KNOWN_TOKENS: Token[] = [
  {
    address: "0x3600000000000000000000000000000000000000",
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  {
    address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
    symbol: "EURC",
    name: "Euro Coin",
    decimals: 6,
    logoURI: "https://cryptologos.cc/logos/euro-coin-eurc-logo.png",
  },
  {
    address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
    symbol: "USYC",
    name: "US Yield Coin",
    decimals: 6,
  },
];
