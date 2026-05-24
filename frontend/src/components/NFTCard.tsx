"use client";
import Link from "next/link";
import { formatUnits } from "viem";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { USDC_DECIMALS } from "@/lib/contracts";
import type { Listing } from "@/hooks/useListings";

interface Props {
  listing: Listing;
  onBuy?: (listingId: bigint) => void;
  buying?: boolean;
}

export function NFTCard({ listing, onBuy, buying }: Props) {
  const { metadata, loading } = useNFTMetadata(listing.nftContract, listing.tokenId);

  const priceFormatted = parseFloat(formatUnits(listing.price, USDC_DECIMALS)).toFixed(2);

  return (
    <div className="bg-[#1a1d27] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
      {/* Image */}
      <Link href={`/nft/${listing.nftContract}/${listing.tokenId.toString()}`}>
        <div className="aspect-square bg-[#0f1117] relative overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 animate-pulse" />
          ) : metadata?.image ? (
            <img
              src={metadata.image}
              alt={metadata.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center">
              <svg className="w-12 h-12 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-0.5">#{listing.tokenId.toString()}</p>
          <p className="font-bold text-white truncate">{loading ? "Loading..." : (metadata?.name ?? "Unnamed NFT")}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-gray-500">Price</p>
            <p className="font-bold text-emerald-400">{priceFormatted} USDC</p>
          </div>
          {onBuy && (
            <button
              onClick={() => onBuy(listing.listingId)}
              disabled={buying}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {buying ? "..." : "Buy"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
