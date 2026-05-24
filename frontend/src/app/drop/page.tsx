"use client";
import { useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { uploadFileToPinata, uploadJSONToPinata } from "@/lib/pinata";
import { NFT_ADDRESS } from "@/lib/contracts";
import { arcNFTAbi } from "@/abis/arcNFT";
import { useToast } from "@/components/Toast";
import { TokenCard } from "@/components/TokenCard";
import { useAllNFTs } from "@/hooks/useAllNFTs";
import Link from "next/link";

export default function DropPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState("");
  const [step, setStep]               = useState<"idle" | "uploading" | "minting" | "done">("idle");
  const [mintedId, setMintedId]       = useState<string | null>(null);

  const { tokens, totalSupply, isLoading: nftsLoading } = useAllNFTs();
  const recentTokens = tokens.slice(0, 6);

  const { data: totalSupplyData } = useReadContract({
    address: NFT_ADDRESS,
    abi: arcNFTAbi,
    functionName: "totalSupply",
    query: { refetchInterval: 10000 },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess && receipt) {
      const mintedEvent = receipt.logs[receipt.logs.length - 1];
      const id = mintedEvent?.topics?.[2] ? parseInt(mintedEvent.topics[2], 16).toString() : "0";
      setMintedId(id);
      setStep("done");
      toast("NFT minted successfully!", "success");
    }
  }, [isSuccess]);

  function handleFile(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleMint() {
    if (!address || !file || !name) return;
    setStep("uploading");
    try {
      const imageURI = await uploadFileToPinata(file);
      const metadataURI = await uploadJSONToPinata(
        { name, description, image: imageURI },
        `${name} metadata`
      );
      setStep("minting");
      writeContract({
        address: NFT_ADDRESS,
        abi: arcNFTAbi,
        functionName: "mint",
        args: [address, metadataURI],
      });
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Upload failed", "error");
      setStep("idle");
    }
  }

  const busy = step !== "idle" && step !== "done";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden mb-10 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-[#1a1d27] border border-white/8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-600/10 pointer-events-none" />
        <div className="relative px-8 py-12 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            LIVE DROP · Arc Testnet
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-3">
            Arc NFT Collection
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Mint your own unique digital collectible on Arc Testnet.
            Upload any image — stored forever on IPFS via Pinata.
          </p>
          <div className="flex justify-center gap-6">
            {[
              { label: "Total Minted", value: (totalSupplyData ?? totalSupply).toString() },
              { label: "Mint Price", value: "Free" },
              { label: "Network", value: "Arc Testnet" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* ── Mint form ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {step === "done" ? "🎉 Minted!" : "Mint Your NFT"}
          </h2>

          {step === "done" ? (
            <div className="bg-[#1a1d27] border border-emerald-500/30 rounded-3xl p-8 text-center">
              <p className="text-gray-400 mb-4">Token #{mintedId} is now in your wallet.</p>
              {preview && (
                <img src={preview} alt="NFT" className="w-40 h-40 object-cover rounded-2xl mx-auto mb-5" />
              )}
              <div className="flex gap-3 justify-center flex-wrap">
                <a
                  href={`/nft/${NFT_ADDRESS}/${mintedId}`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
                >
                  View NFT
                </a>
                <a
                  href="/profile"
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors"
                >
                  My Collection
                </a>
                <button
                  onClick={() => { setStep("idle"); setFile(null); setPreview(""); setName(""); setDescription(""); }}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors"
                >
                  Mint Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1d27] border border-white/8 rounded-3xl p-6 flex flex-col gap-5">
              {/* Image upload */}
              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Image *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl cursor-pointer flex items-center justify-center transition-colors ${
                    preview ? "border-blue-500/40 p-1" : "border-white/10 hover:border-blue-500/40 p-8"
                  }`}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full max-h-52 object-contain rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <svg className="w-10 h-10 text-gray-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">Click to upload</p>
                      <p className="text-gray-600 text-xs mt-1">PNG, JPG, GIF, SVG</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Name *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Awesome NFT"
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-300 mb-2 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What makes this NFT special?"
                  rows={2}
                  className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors resize-none"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300">
                📌 Pinned to IPFS via Pinata · stored permanently on-chain
              </div>

              {step !== "idle" && (
                <div className="flex flex-col gap-2">
                  {(["uploading", "minting"] as const).map((s, i) => {
                    const order = ["uploading", "minting", "done"] as const;
                    const cur = order.indexOf(step as typeof order[number]);
                    const active = step === s;
                    const done = cur > i;
                    return (
                      <div key={s} className="flex items-center gap-3 text-sm">
                        {active
                          ? <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          : done
                            ? <span className="text-emerald-400">✓</span>
                            : <span className="w-4 h-4 rounded-full border border-white/20" />}
                        <span className={active ? "text-white" : "text-gray-500"}>
                          {s === "uploading" ? "Uploading to IPFS" : "Minting on Arc Testnet"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {!address ? (
                <p className="text-center text-gray-500 text-sm py-1">Connect wallet to mint</p>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={busy || !file || !name || isPending || isWaiting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
                >
                  {busy || isPending || isWaiting ? "Minting..." : "Mint Free NFT"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Right: info + recent mints ─────────────────────────── */}
        <div className="flex flex-col gap-6">
          {/* How it works */}
          <div className="bg-[#1a1d27] border border-white/8 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">How it works</h3>
            <div className="flex flex-col gap-4">
              {[
                { n: "1", title: "Upload your image", desc: "Any PNG, JPG, GIF, or SVG up to 10MB. Stored on IPFS forever." },
                { n: "2", title: "Add name & description", desc: "Give your NFT an identity that shows up on marketplaces." },
                { n: "3", title: "Mint it free", desc: "One wallet signature. No mint cost — you only pay Arc gas (USDC)." },
                { n: "4", title: "List or keep it", desc: "Head to your profile to list it on the marketplace for USDC." },
              ].map(s => (
                <div key={s.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-blue-400 shrink-0">
                    {s.n}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/swap"
              className="bg-[#1a1d27] border border-white/8 hover:border-blue-500/40 rounded-2xl p-4 transition-colors group"
            >
              <div className="text-2xl mb-1">🔄</div>
              <p className="font-bold text-white text-sm">Swap Tokens</p>
              <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400">Get USDC on ArcSwap</p>
            </Link>
            <Link
              href="/profile"
              className="bg-[#1a1d27] border border-white/8 hover:border-purple-500/40 rounded-2xl p-4 transition-colors group"
            >
              <div className="text-2xl mb-1">🖼️</div>
              <p className="font-bold text-white text-sm">My Collection</p>
              <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-400">View and list your NFTs</p>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Recent mints ──────────────────────────────────────────── */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">Recently Minted</h2>
          <Link href="/?tab=all" className="text-sm text-blue-400 hover:underline">View all →</Link>
        </div>
        {nftsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#1a1d27] border border-white/8 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : recentTokens.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            No NFTs minted yet — be the first!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {recentTokens.map(t => (
              <TokenCard
                key={t.tokenId.toString()}
                tokenId={t.tokenId}
                owner={t.owner}
                connectedAddress={address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
