"use client";
import { useReadContract } from "wagmi";
import { erc20Abi } from "@/abis/erc20";
import { formatUnits } from "viem";

export function useTokenBalance(
  tokenAddress: `0x${string}` | undefined,
  account: `0x${string}` | undefined,
  decimals = 6
) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!tokenAddress && !!account, refetchInterval: 10000 },
  });

  return {
    raw: data ?? 0n,
    formatted: data ? formatUnits(data, decimals) : "0",
    isLoading,
    refetch,
  };
}
