"use client";
import { SwapWidget } from "@/components/SwapWidget";
import Link from "next/link";

export default function SwapPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-2">
          Swap{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Tokens
          </span>
        </h1>
        <p className="text-gray-400 text-sm">
          Swap USDC, EURC, and USYC instantly on Arc Testnet via{" "}
          <a
            href="https://arcswap.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 hover:underline"
          >
            ArcSwap
          </a>
        </p>
      </div>

      {/* Swap widget */}
      <SwapWidget />

      {/* CTA banner */}
      <div className="mt-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-white/8 rounded-3xl p-6 text-center">
        <p className="text-white font-semibold mb-1">Need USDC to buy an NFT?</p>
        <p className="text-gray-400 text-sm mb-4">
          Swap any Arc token to USDC and head over to the marketplace.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors text-sm"
        >
          Browse NFTs for Sale →
        </Link>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: "Protocol", value: "ArcSwap AMM" },
          { label: "LP fee", value: "0.3%" },
          { label: "Settlement", value: "Arc Testnet" },
        ].map(s => (
          <div key={s.label} className="bg-[#1a1d27] border border-white/8 rounded-2xl px-4 py-3 text-center">
            <div className="text-base font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
