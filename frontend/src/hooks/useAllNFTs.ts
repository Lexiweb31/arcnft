"use client";
import { useReadContract, useReadContracts } from "wagmi";
import { arcNFTAbi } from "@/abis/arcNFT";
import { NFT_ADDRESS } from "@/lib/contracts";

export interface NFTToken {
  tokenId: bigint;
  owner: string;
}

export function useAllNFTs() {
  // Step 1: read total supply
  const { data: supplyData, isLoading: supplyLoading, refetch } = useReadContract({
    address: NFT_ADDRESS,
    abi: arcNFTAbi,
    functionName: "totalSupply",
    query: { refetchInterval: 12000 },
  });

  const totalSupply = supplyData ? Number(supplyData) : 0;

  // Step 2: batch-read ownerOf for each tokenId (cap at 200 most recent)
  const start = Math.max(0, totalSupply - 200);
  const tokenIds = Array.from({ length: totalSupply - start }, (_, i) => BigInt(start + i));

  const { data: ownersData, isLoading: ownersLoading } = useReadContracts({
    contracts: tokenIds.map(id => ({
      address: NFT_ADDRESS as `0x${string}`,
      abi: arcNFTAbi,
      functionName: "ownerOf" as const,
      args: [id] as const,
    })),
    query: { enabled: tokenIds.length > 0, refetchInterval: 12000 },
  });

  const tokens: NFTToken[] = tokenIds
    .map((id, i) => ({
      tokenId: id,
      owner: (ownersData?.[i]?.result as string | undefined) ?? "",
    }))
    .filter(t => t.owner !== "")
    .reverse(); // newest first

  return {
    tokens,
    totalSupply,
    isLoading: supplyLoading || (tokenIds.length > 0 && ownersLoading),
    refetch,
  };
}
