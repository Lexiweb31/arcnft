"use client";
import { useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { marketplaceAbi } from "@/abis/marketplace";

export interface Listing {
  listingId: bigint;
  seller: `0x${string}`;
  nftContract: `0x${string}`;
  tokenId: bigint;
  price: bigint;
  active: boolean;
}

export function useListings() {
  const { data: count } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "activeListingsCount",
    query: { refetchInterval: 8000 },
  });

  const { data: listings, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "getActiveListings",
    args: [0n, 200n],
    query: {
      enabled: !!count,
      refetchInterval: 8000,
    },
  });

  return {
    listings: (listings ?? []) as Listing[],
    isLoading,
    refetch,
    count: count ?? 0n,
  };
}
