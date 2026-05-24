"use client";
import { useReadContract } from "wagmi";
import { NFT_ADDRESS } from "@/lib/contracts";
import { arcNFTAbi } from "@/abis/arcNFT";

export function useOwnedNFTs(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: NFT_ADDRESS,
    abi: arcNFTAbi,
    functionName: "tokensOfOwner",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 10000,
    },
  });

  return {
    tokenIds: (data ?? []) as bigint[],
    isLoading,
    refetch,
  };
}
