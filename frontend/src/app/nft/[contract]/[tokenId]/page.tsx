"use client";
import { use, useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { useNFTMetadata } from "@/hooks/useNFTMetadata";
import { useUSDCApprove } from "@/hooks/useUSDCApprove";
import { useToast } from "@/components/Toast";
import { MARKETPLACE_ADDRESS, USDC_DECIMALS } from "@/lib/contracts";
import { arcNFTAbi } from "@/abis/arcNFT";
import { marketplaceAbi } from "@/abis/marketplace";

const approveForAllAbi = [{
  inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }],
  name: "setApprovalForAll",
  outputs: [],
  stateMutability: "nonpayable",
  type: "function",
}] as const;

export default function NFTDetailPage({
  params,
}: {
  params: Promise<{ contract: string; tokenId: string }>;
}) {
  const { contract, tokenId } = use(params);
  const nftContract  = contract as `0x${string}`;
  const tokenIdBig   = BigInt(tokenId);

  const { address } = useAccount();
  const { toast }   = useToast();
  const { metadata, loading } = useNFTMetadata(nftContract, tokenIdBig);

  const [listPrice, setListPrice] = useState("");

  // Ownership
  const { data: owner } = useReadContract({ address: nftContract, abi: arcNFTAbi, functionName: "ownerOf", args: [tokenIdBig] });
  const isOwner = !!address && !!owner && owner.toLowerCase() === address.toLowerCase();

  // Active listing
  const { data: activeListingId, refetch: refetchListing } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "activeListing",
    args: [nftContract, tokenIdBig],
  });
  const { data: listingData } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "listings",
    args: activeListingId && activeListingId > 0n ? [activeListingId] : undefined,
    query: { enabled: !!activeListingId && activeListingId > 0n },
  });

  const isListed = !!activeListingId && activeListingId > 0n;
  const listingPrice = listingData?.[4] ?? 0n;

  // USDC approval for buying
  const { needsApproval, approve: approveUSDC, isApproving } = useUSDCApprove(address, listingPrice);

  // NFT approval for listing
  const { data: isNFTApproved } = useReadContract({
    address: nftContract,
    abi: arcNFTAbi,
    functionName: "isApprovedForAll",
    args: address ? [address, MARKETPLACE_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess) {
      refetchListing();
      toast("Transaction confirmed!", "success");
    }
  }, [isSuccess]);

  function handleBuy() {
    if (!address || !activeListingId) return;
    if (needsApproval) { approveUSDC(); return; }
    writeContract({ address: MARKETPLACE_ADDRESS, abi: marketplaceAbi, functionName: "buy", args: [activeListingId] });
  }

  function handleList() {
    if (!listPrice) return;
    if (!isNFTApproved) {
      writeContract({ address: nftContract, abi: approveForAllAbi, functionName: "setApprovalForAll", args: [MARKETPLACE_ADDRESS, true] });
      return;
    }
    writeContract({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: "list",
      args: [nftContract, tokenIdBig, parseUnits(listPrice, USDC_DECIMALS)],
    });
    setListPrice("");
  }

  function handleCancel() {
    if (!activeListingId) return;
    writeContract({ address: MARKETPLACE_ADDRESS, abi: marketplaceAbi, functionName: "cancel", args: [activeListingId] });
  }

  const busy = isPending || isWaiting || isApproving;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-[#1a1d27] border border-white/8 rounded-3xl overflow-hidden aspect-square">
          {loading ? (
            <div className="w-full h-full animate-pulse bg-gradient-to-br from-blue-900/20 to-purple-900/20" />
          ) : metadata?.image ? (
            <img src={metadata.image} alt={metadata.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/10">
              <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-gray-500 text-sm mb-1">Token #{tokenId}</p>
            <h1 className="text-3xl font-extrabold text-white">{metadata?.name ?? "..."}</h1>
            {metadata?.description && (
              <p className="text-gray-400 mt-3 text-sm leading-relaxed">{metadata.description}</p>
            )}
          </div>

          {/* Owner */}
          <div className="bg-[#1a1d27] border border-white/8 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">Owner</p>
            <p className="text-white font-mono text-sm">
              {owner ? `${owner.slice(0, 6)}...${owner.slice(-4)}` : "—"}
              {isOwner && <span className="ml-2 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">You</span>}
            </p>
          </div>

          {/* Price / listing status */}
          {isListed && (
            <div className="bg-[#1a1d27] border border-white/8 rounded-2xl px-4 py-4">
              <p className="text-xs text-gray-500 mb-1">Listed price</p>
              <p className="text-3xl font-extrabold text-emerald-400">
                {parseFloat(formatUnits(listingPrice, USDC_DECIMALS)).toFixed(2)} USDC
              </p>
            </div>
          )}

          {/* Actions */}
          {!address ? (
            <p className="text-center text-gray-500 text-sm">Connect wallet to buy or sell</p>
          ) : isOwner ? (
            <div className="flex flex-col gap-3">
              {isListed ? (
                <button onClick={handleCancel} disabled={busy} className="w-full py-4 bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 font-bold rounded-2xl transition-colors disabled:opacity-50">
                  {busy ? "Processing..." : "Cancel Listing"}
                </button>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={listPrice}
                      onChange={e => setListPrice(e.target.value)}
                      placeholder="Price in USDC"
                      className="flex-1 bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500/50"
                    />
                    <button
                      onClick={handleList}
                      disabled={busy || !listPrice}
                      className="px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
                    >
                      {busy ? "..." : isNFTApproved ? "List" : "Approve & List"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 text-center">2.5% marketplace fee applies on sale</p>
                </>
              )}
            </div>
          ) : isListed ? (
            <button
              onClick={handleBuy}
              disabled={busy}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-lg rounded-2xl transition-colors"
            >
              {busy ? "Processing..." : needsApproval ? "Approve USDC to Buy" : `Buy for ${parseFloat(formatUnits(listingPrice, USDC_DECIMALS)).toFixed(2)} USDC`}
            </button>
          ) : (
            <div className="bg-[#1a1d27] border border-white/8 rounded-2xl px-4 py-4 text-center text-gray-500 text-sm">
              Not listed for sale
            </div>
          )}

          {/* Contract info */}
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Contract</span>
              <a href={`https://testnet.arcscan.app/address/${nftContract}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-mono">
                {nftContract.slice(0, 10)}...{nftContract.slice(-8)}
              </a>
            </div>
            <div className="flex justify-between">
              <span>Token standard</span>
              <span>ERC-721</span>
            </div>
            <div className="flex justify-between">
              <span>Network</span>
              <span>Arc Testnet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
