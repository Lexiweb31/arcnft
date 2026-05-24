"use client";
import { useEffect, useState } from "react";
import { useReadContract } from "wagmi";
import { arcNFTAbi } from "@/abis/arcNFT";
import { ipfsToHttp } from "@/lib/pinata";

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

export function useNFTMetadata(
  nftContract: `0x${string}` | undefined,
  tokenId: bigint | undefined
) {
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: tokenURI } = useReadContract({
    address: nftContract,
    abi: arcNFTAbi,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
    query: { enabled: !!nftContract && tokenId !== undefined },
  });

  useEffect(() => {
    if (!tokenURI) return;
    setLoading(true);

    async function fetchMeta() {
      try {
        const url = ipfsToHttp(tokenURI as string);
        const res = await fetch(url);
        const json = await res.json();
        setMetadata({
          name:        json.name ?? "Unnamed",
          description: json.description ?? "",
          image:       ipfsToHttp(json.image ?? ""),
        });
      } catch {
        setMetadata({ name: "Unnamed", description: "", image: "" });
      } finally {
        setLoading(false);
      }
    }

    fetchMeta();
  }, [tokenURI]);

  return { metadata, loading, tokenURI };
}
