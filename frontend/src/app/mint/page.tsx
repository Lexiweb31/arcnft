"use client";
import { useState, useRef, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { uploadFileToPinata, uploadJSONToPinata } from "@/lib/pinata";
import { NFT_ADDRESS } from "@/lib/contracts";
import { arcNFTAbi } from "@/abis/arcNFT";
import { useToast } from "@/components/Toast";

export default function MintPage() {
  const { address } = useAccount();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState("");
  const [step, setStep]               = useState<"idle" | "uploading" | "minting" | "done">("idle");
  const [mintedId, setMintedId]       = useState<string | null>(null);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isWaiting, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (isSuccess && receipt) {
      // Extract tokenId from Minted event logs
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
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Mint an{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NFT
          </span>
        </h1>
        <p className="text-gray-400 text-sm">Upload your image to IPFS and mint it on Arc Testnet.</p>
      </div>

      {step === "done" ? (
        <div className="bg-[#1a1d27] border border-emerald-500/30 rounded-3xl p-8 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Minted!</h2>
          <p className="text-gray-400 mb-6">Token #{mintedId} is now in your wallet.</p>
          {preview && (
            <img src={preview} alt="NFT" className="w-48 h-48 object-cover rounded-2xl mx-auto mb-6" />
          )}
          <div className="flex gap-3 justify-center">
            <a
              href={`/nft/${NFT_ADDRESS}/${mintedId}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
            >
              View NFT
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
                <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Click to upload image</p>
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

          {/* Name */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Awesome NFT"
              className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-300 mb-2 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell people what makes this NFT special..."
              rows={3}
              className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>

          {/* IPFS notice */}
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300">
            Image and metadata will be pinned to IPFS via Pinata and stored permanently on-chain.
          </div>

          {/* Progress */}
          {step !== "idle" && (() => {
            const steps = [
              { key: "uploading" as const, label: "Uploading to IPFS" },
              { key: "minting"   as const, label: "Minting on Arc Testnet" },
            ];
            const order = ["uploading", "minting", "done"] as const;
            const currentIdx = order.indexOf(step as typeof order[number]);
            return (
              <div className="flex flex-col gap-2">
                {steps.map((s) => {
                  const stepIdx = order.indexOf(s.key);
                  const active  = step === s.key;
                  const done    = currentIdx > stepIdx;
                  return (
                    <div key={s.key} className="flex items-center gap-3 text-sm">
                      {active
                        ? <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        : done
                          ? <span className="text-emerald-400">✓</span>
                          : <span className="w-4 h-4 rounded-full border border-white/20" />
                      }
                      <span className={active ? "text-white" : "text-gray-500"}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {!address ? (
            <div className="text-center text-gray-500 text-sm py-2">Connect wallet to mint</div>
          ) : (
            <button
              onClick={handleMint}
              disabled={busy || !file || !name || isPending || isWaiting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors text-lg"
            >
              {busy || isPending || isWaiting ? "Minting..." : "Mint NFT"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
