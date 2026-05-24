import { defineChain } from "viem";
import { createConfig, http } from "wagmi";
import { metaMask, injected } from "wagmi/connectors";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
});

export const wagmiConfig = createConfig({
  ssr: true,
  chains: [arcTestnet],
  connectors: [injected(), metaMask()],
  transports: { [arcTestnet.id]: http() },
});
