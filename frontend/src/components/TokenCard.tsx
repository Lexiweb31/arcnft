"use client";
import Link from "next/link";
import { formatUnits } from "viem";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { NFT_ADDRESS, USDC_DECIMALS } from "@/lib/contracts";

interface Props {
  tokenId: bigint;
  owner: string;
  listing?: { listingId: bigint; price: bigint };
  onBuy?: (listingId: bigint) => void;
  buying?: boolean;
  connectedAddress?: string;
}

export function TokenCard({ tokenId, owner, listing, onBuy, buying, connectedAddress }: Props) {
  const { metadata, loading } = useNFTMetadata(NFT_ADDRESS, tokenId);
  const isOwner = !!connectedAddress && owner.toLowerCase() === connectedAddress.toLowerCase();

  return (
    <div className="bg-[#1a1d27] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all group">
      {/* Image */}
      <Link href={`/nft/${NFT_ADDRESS}/${tokenId.toString()}`}>
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

          {/* Listed badge */}
          {listing && (
            <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur">
              For Sale
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-0.5">#{tokenId.toString()}</p>
        <p className="font-bold text-white truncate text-sm">{loading ? "Loading..." : (metadata?.name ?? "Unnamed NFT")}</p>
        <p className="text-xs text-gray-600 truncate mt-0.5">
          {isOwner ? (
            <span className="text-blue-400">You own this</span>
          ) : (
            owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "—"
          )}
        </p>

        {listing ? (
          <div className="flex items-center justify-between gap-2 mt-2">
            <p className="font-bold text-emerald-400 text-sm">
              {parseFloat(formatUnits(listing.price, USDC_DECIMALS)).toFixed(2)} USDC
            </p>
            {onBuy && !isOwner && (
              <button
                onClick={() => onBuy(listing.listingId)}
                disabled={buying}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {buying ? "..." : "Buy"}
              </button>
            )}
          </div>
        ) : (
          <Link
            href={`/nft/${NFT_ADDRESS}/${tokenId.toString()}`}
            className="block mt-2 text-xs text-gray-500 hover:text-blue-400 transition-colors"
          >
            View →
          </Link>
        )}
      </div>
    </div>
  );
}
