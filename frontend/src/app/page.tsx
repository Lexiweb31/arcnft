"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useListings } from "@/hooks/useListings";
import { useAllNFTs } from "@/hooks/useAllNFTs";
import { useUSDCApprove } from "@/hooks/useUSDCApprove";
import { NFTCard } from "@/components/NFTCard";
import { TokenCard } from "@/components/TokenCard";
import { useToast } from "@/components/Toast";
import { MARKETPLACE_ADDRESS, NFT_ADDRESS } from "@/lib/contracts";
import { marketplaceAbi } from "@/abis/marketplace";
import type { Listing } from "@/hooks/useListings";

type Tab = "listed" | "all";

export default function ExplorePage() {
  const { address } = useAccount();
  const { toast } = useToast();

  // Read URL ?tab param on mount
  const [tab, setTab] = useState<Tab>("listed");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    if (p === "all") setTab("all");
  }, []);

  const { listings, isLoading: listingsLoading, count } = useListings();
  const { tokens, totalSupply, isLoading: allLoading } = useAllNFTs();

  const [buyingId, setBuyingId] = useState<bigint | null>(null);
  const { needsApproval, approve, isApproving } = useUSDCApprove(
    address,
    buyingId ? (listings.find(l => l.listingId === buyingId)?.price ?? 0n) : 0n
  );

  const { writeContract, data: buyHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: buyHash });

  useEffect(() => {
    if (isSuccess) { toast("NFT purchased!", "success"); setBuyingId(null); }
  }, [isSuccess]);

  function handleBuy(listingId: bigint) {
    if (!address) { toast("Connect your wallet first", "error"); return; }
    setBuyingId(listingId);
    if (needsApproval) { approve(); return; }
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: "buy",
      args: [listingId],
    });
  }

  // Build a lookup: nftContract+tokenId → listing
  const listingMap = new Map<string, Listing>();
  for (const l of listings) {
    if (l.nftContract.toLowerCase() === NFT_ADDRESS.toLowerCase()) {
      listingMap.set(l.tokenId.toString(), l);
    }
  }

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-extrabold text-white mb-3">
          Discover{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Arc NFTs
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-lg mx-auto">
          Browse, collect, and trade unique digital assets on Arc Testnet.
        </p>
        <div className="flex gap-4 justify-center mt-6 flex-wrap">
          <a href="/drop" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors">
            Mint NFT
          </a>
          <a href="/swap" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-colors flex items-center gap-2">
            🔄 Swap Tokens
          </a>
          <a href="/profile" className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-2xl transition-colors">
            My Collection
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Minted", value: totalSupply.toString() },
          { label: "Listed for Sale", value: count.toString() },
          { label: "Marketplace Fee", value: "2.5%" },
          { label: "Payment Token", value: "USDC" },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1d27] border border-white/8 rounded-2xl px-5 py-4 text-center">
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1d27] border border-white/8 rounded-2xl p-1 mb-6 w-fit">
        {([["listed", "For Sale"], ["all", "All NFTs"]] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === t
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {label}
            <span className={`ml-2 text-xs ${tab === t ? "text-blue-200" : "text-gray-600"}`}>
              {t === "listed" ? count : totalSupply}
            </span>
          </button>
        ))}
      </div>

      {/* Grid */}
      {tab === "listed" ? (
        listingsLoading ? (
          <LoadingSkeleton />
        ) : listings.length === 0 ? (
          <EmptyState
            icon="🏷️"
            title="No listings yet"
            sub="Mint an NFT and list it for others to buy!"
            cta={{ label: "Mint & List", href: "/drop" }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {listings.map(listing => (
              <NFTCard
                key={listing.listingId.toString()}
                listing={listing}
                onBuy={listing.seller.toLowerCase() !== address?.toLowerCase() ? handleBuy : undefined}
                buying={buyingId === listing.listingId && (isPending || isWaiting || isApproving)}
              />
            ))}
          </div>
        )
      ) : (
        allLoading ? (
          <LoadingSkeleton />
        ) : tokens.length === 0 ? (
          <EmptyState
            icon="🎨"
            title="No NFTs minted yet"
            sub="Be the first to create an Arc NFT!"
            cta={{ label: "Mint Now", href: "/drop" }}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tokens.map(t => {
              const listing = listingMap.get(t.tokenId.toString());
              return (
                <TokenCard
                  key={t.tokenId.toString()}
                  tokenId={t.tokenId}
                  owner={t.owner}
                  listing={listing ? { listingId: listing.listingId, price: listing.price } : undefined}
                  onBuy={listing && listing.seller.toLowerCase() !== address?.toLowerCase() ? handleBuy : undefined}
                  buying={!!listing && buyingId === listing.listingId && (isPending || isWaiting || isApproving)}
                  connectedAddress={address}
                />
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[#1a1d27] border border-white/8 rounded-2xl aspect-square animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, sub, cta }: { icon: string; title: string; sub: string; cta: { label: string; href: string } }) {
  return (
    <div className="text-center py-24">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-gray-400 text-lg mb-2">{title}</p>
      <p className="text-gray-600 text-sm mb-6">{sub}</p>
      <a href={cta.href} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors">
        {cta.label}
      </a>
    </div>
  );
}
