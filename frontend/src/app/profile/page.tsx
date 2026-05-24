"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { parseUnits } from "viem";
import { useOwnedNFTs } from "@/hooks/useOwnedNFTs";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { useListings } from "@/hooks/useListings";
import { useToast } from "@/components/Toast";
import { NFT_ADDRESS, MARKETPLACE_ADDRESS, USDC_DECIMALS } from "@/lib/contracts";
import { arcNFTAbi } from "@/abis/arcNFT";
import { marketplaceAbi } from "@/abis/marketplace";

const approveAbi = [{
  inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }],
  name: "setApprovalForAll",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
}] as const;

// Single owned NFT row with list/cancel capability
function OwnedNFTRow({ tokenId, address }: { tokenId: bigint; address: `0x${string}` }) {
  const { metadata, loading } = useNFTMetadata(NFT_ADDRESS, tokenId);
  const { toast } = useToast();
  const [listPrice, setListPrice] = useState("");
  const [showList, setShowList] = useState(false);

  // Check if already listed
  const { data: activeListingId } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "activeListing",
    args: [NFT_ADDRESS, tokenId],
  });
  const isListed = !!activeListingId && activeListingId > 0n;

  // Approval check
  const { data: isApproved } = useReadContract({
    address: NFT_ADDRESS,
    abi: arcNFTAbi,
    functionName: "isApprovedForAll",
    args: [address, MARKETPLACE_ADDRESS],
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) toast(isListed ? "Listing cancelled" : "NFT listed for sale!", "success");
  }, [isSuccess]);

  function handleList() {
    if (!listPrice) return;
    if (!isApproved) {
      writeContract({ address: NFT_ADDRESS, abi: approveAbi, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
      return;
    }
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: "list",
      args: [NFT_ADDRESS, tokenId, parseUnits(listPrice, USDC_DECIMALS)],
    });
    setShowList(false);
    setListPrice("");
  }

  function handleCancel() {
    if (!activeListingId) return;
    writeContract({ address: MARKETPLACE_ADDRESS, abi: marketplaceAbi, functionName: "cancel", args: [activeListingId] });
  }

  const busy = isPending || isWaiting;

  return (
    <div className="bg-[#1a1d27] border border-white/8 rounded-2xl overflow-hidden flex flex-col">
      <a href={`/nft/${NFT_ADDRESS}/${tokenId.toString()}`}>
        <div className="aspect-square bg-[#0f1117]">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
          ) : metadata?.image ? (
            <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </a>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-xs text-gray-500">#{tokenId.toString()}</p>
          <p className="font-semibold text-white text-sm truncate">{metadata?.name ?? "..."}</p>
        </div>

        {isListed ? (
          <button onClick={handleCancel} disabled={busy} className="w-full py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50">
            {busy ? "..." : "Cancel Listing"}
          </button>
        ) : showList ? (
          <div className="flex gap-1.5">
            <input
              type="number"
              value={listPrice}
              onChange={e => setListPrice(e.target.value)}
              placeholder="USDC"
              className="flex-1 min-w-0 bg-[#0f1117] border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs outline-none"
            />
            <button onClick={handleList} disabled={busy || !listPrice} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg">
              {busy ? "..." : isApproved ? "List" : "Approve"}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowList(true)} className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/20 text-blue-400 text-xs font-semibold rounded-xl transition-colors">
            List for Sale
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { address } = useAccount();
  const { tokenIds, isLoading } = useOwnedNFTs(address);
  const { listings } = useListings();

  const myListings = listings.filter(l => l.seller.toLowerCase() === address?.toLowerCase());

  if (!address) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">👛</div>
        <p className="text-gray-400 text-lg">Connect your wallet to view your collection</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-1">My Collection</h1>
        <p className="text-gray-500 text-sm font-mono">{address}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#1a1d27] border border-white/8 rounded-2xl px-5 py-4 text-center">
          <div className="text-2xl font-bold text-white">{tokenIds.length}</div>
          <div className="text-xs text-gray-500 mt-1">NFTs owned</div>
        </div>
        <div className="bg-[#1a1d27] border border-white/8 rounded-2xl px-5 py-4 text-center">
          <div className="text-2xl font-bold text-white">{myListings.length}</div>
          <div className="text-xs text-gray-500 mt-1">Active listings</div>
        </div>
      </div>

      {/* NFT grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1a1d27] border border-white/8 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : tokenIds.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎨</div>
          <p className="text-gray-400 mb-4">You don&apos;t own any NFTs yet.</p>
          <a href="/mint" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-colors inline-block">
            Mint your first NFT
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tokenIds.map(id => (
            <OwnedNFTRow key={id.toString()} tokenId={id} address={address} />
          ))}
        </div>
      )}
    </div>
  );
}
