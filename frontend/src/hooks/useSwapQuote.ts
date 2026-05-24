"use client";
import { useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { routerAbi } from "@/abis/router";
import { ROUTER_ADDRESS } from "@/lib/contracts";

export function useSwapQuote(
  amountIn: string,
  path: `0x${string}`[],
  decimalsIn: number,
  decimalsOut: number
) {
  const enabled = !!amountIn && parseFloat(amountIn) > 0 && path.length >= 2;
  const parsedAmountIn = enabled ? parseUnits(amountIn, decimalsIn) : 0n;

  const { data, isLoading, error } = useReadContract({
    address: ROUTER_ADDRESS,
    abi: routerAbi,
    functionName: "getAmountsOut",
    args: enabled ? [parsedAmountIn, path] : undefined,
    query: { enabled, refetchInterval: 5000 },
  });

  const amountOut = data ? data[data.length - 1] : 0n;
  return {
    amountOut,
    amountOutFormatted: amountOut ? formatUnits(amountOut, decimalsOut) : "",
    isLoading,
    error,
  };
}
