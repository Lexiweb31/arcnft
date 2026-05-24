"use client";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import { useSwapQuote } from "@/hooks/useSwapQuote";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useSwapApprove } from "@/hooks/useSwapApprove";
import { useToast } from "@/components/Toast";
import { Token, KNOWN_TOKENS, ROUTER_ADDRESS, FACTORY_ADDRESS } from "@/lib/contracts";
import { routerAbi } from "@/abis/router";
import { factoryAbi } from "@/abis/factory";
import { erc20Abi } from "@/abis/erc20";

// ── Pool reserves ABI ─────────────────────────────────────────────────────────
const poolAbi = [{
  inputs: [],
  name: "getReserves",
  outputs: [
    { name: "reserve0", type: "uint112" },
    { name: "reserve1", type: "uint112" },
    { name: "blockTimestampLast", type: "uint32" },
  ],
  stateMutability: "view",
  type: "function",
}] as const;

function calcPriceImpact(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): number {
  if (reserveIn === 0n || reserveOut === 0n) return 0;
  const amountInWithFee = amountIn * 997n;
  const amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000n + amountInWithFee);
  const midPrice = (reserveOut * amountIn) / reserveIn;
  if (midPrice === 0n) return 0;
  return Math.max(0, Number((midPrice - amountOut) * 10000n / midPrice) / 100);
}

// ── Token Selector ────────────────────────────────────────────────────────────
function TokenSelector({ selected, onSelect, excluded }: {
  selected: Token | null;
  onSelect: (t: Token) => void;
  excluded?: `0x${string}`;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const isCustomAddr = isAddress(query) && !KNOWN_TOKENS.find(t => t.address.toLowerCase() === query.toLowerCase());

  const { data: customData } = useReadContracts({
    contracts: isCustomAddr ? [
      { address: query as `0x${string}`, abi: erc20Abi, functionName: "symbol" as const },
      { address: query as `0x${string}`, abi: erc20Abi, functionName: "name" as const },
      { address: query as `0x${string}`, abi: erc20Abi, functionName: "decimals" as const },
    ] : [],
    query: { enabled: isCustomAddr },
  });

  const customToken: Token | null = isCustomAddr && customData?.[0]?.result
    ? {
        address: query as `0x${string}`,
        symbol: customData[0].result as string,
        name: customData[1]?.result as string ?? query,
        decimals: (customData[2]?.result as number) ?? 6,
      }
    : null;

  const filtered = KNOWN_TOKENS.filter(t =>
    t.address.toLowerCase() !== excluded?.toLowerCase() &&
    (t.symbol.toLowerCase().includes(query.toLowerCase()) || t.name.toLowerCase().includes(query.toLowerCase()))
  );

  function handleSelect(token: Token) {
    onSelect(token);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/10 hover:bg-blue-500/20 text-white font-semibold px-3 py-2 rounded-xl transition-colors min-w-[130px]"
      >
        {selected ? (
          <>
            <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300 shrink-0">
              {selected.symbol[0]}
            </div>
            <span className="text-sm">{selected.symbol}</span>
            <svg className="w-3.5 h-3.5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-400">Select token</span>
            <svg className="w-3.5 h-3.5 ml-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 bg-[#1a1d27] border border-white/10 rounded-2xl shadow-2xl p-3">
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or paste address"
            className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none mb-2"
          />
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
            {filtered.map(token => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                  {token.symbol[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </div>
              </button>
            ))}
            {customToken && (
              <button
                onClick={() => handleSelect(customToken)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 border border-blue-500/30 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                  {customToken.symbol[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{customToken.symbol}</div>
                  <div className="text-xs text-gray-500 truncate w-40">{query}</div>
                </div>
              </button>
            )}
            {filtered.length === 0 && !customToken && (
              <div className="text-center text-gray-500 text-sm py-4">
                {isAddress(query) ? "Loading token info..." : "No tokens found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Slippage Settings ─────────────────────────────────────────────────────────
function SlippageSettings({ slippage, onChange }: { slippage: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const isHigh = parseFloat(slippage) > 1;
  const PRESETS = ["0.1", "0.5", "1.0"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Slippage: {slippage}%
        {isHigh && <span className="text-yellow-400">⚠</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 bg-[#1a1d27] border border-white/10 rounded-2xl p-4 w-64 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-white">Slippage tolerance</span>
            <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">✕</button>
          </div>
          <div className="flex gap-2 mb-3">
            {PRESETS.map(p => (
              <button
                key={p}
                onClick={() => { onChange(p); setCustom(""); }}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  slippage === p && !custom ? "bg-blue-600 text-white" : "bg-[#0f1117] text-gray-400 hover:text-white"
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              value={custom}
              onChange={e => {
                const v = e.target.value.replace(/[^0-9.]/g, "");
                setCustom(v);
                if (v) onChange(v);
              }}
              placeholder="Custom %"
              className="w-full bg-[#0f1117] border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none pr-8"
            />
            <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
          </div>
          {isHigh && <p className="text-xs text-yellow-400 mt-2">⚠ High slippage — you may get a bad rate</p>}
        </div>
      )}
    </div>
  );
}

// ── Main Swap Widget ──────────────────────────────────────────────────────────
export function SwapWidget() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState("0.5");

  const path = tokenIn && tokenOut ? [tokenIn.address, tokenOut.address] as `0x${string}`[] : [];

  const { amountOut, amountOutFormatted, isLoading: quoteLoading } = useSwapQuote(
    amountIn, path, tokenIn?.decimals ?? 6, tokenOut?.decimals ?? 6
  );

  const balIn  = useTokenBalance(tokenIn?.address,  address, tokenIn?.decimals);
  const balOut = useTokenBalance(tokenOut?.address, address, tokenOut?.decimals);

  // Pool reserves for price impact
  const { data: poolAddr } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getPool",
    args: tokenIn && tokenOut ? [tokenIn.address, tokenOut.address] : undefined,
    query: { enabled: !!tokenIn && !!tokenOut },
  });
  const { data: reserves } = useReadContract({
    address: poolAddr as `0x${string}`,
    abi: poolAbi,
    functionName: "getReserves",
    query: { enabled: !!poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000" },
  });

  const priceImpact = (() => {
    if (!reserves || !amountIn || !tokenIn || !tokenOut) return 0;
    const parsed = parseUnits(amountIn, tokenIn.decimals);
    const [r0, r1] = reserves;
    const [rIn, rOut] = tokenIn.address < tokenOut.address ? [r0, r1] : [r1, r0];
    return calcPriceImpact(parsed, BigInt(rIn), BigInt(rOut));
  })();

  const minReceived = (() => {
    if (!amountOut || !tokenOut) return "";
    const slip = parseFloat(slippage) / 100;
    return (Number(formatUnits(amountOut, tokenOut.decimals)) * (1 - slip)).toFixed(6);
  })();

  const parsedIn = amountIn && tokenIn ? parseUnits(amountIn, tokenIn.decimals) : 0n;
  const { needsApproval, approve, isApproving } = useSwapApprove(tokenIn?.address, address, parsedIn);

  const { writeContract, data: swapTxHash, isPending, reset } = useWriteContract();
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: swapTxHash,
    query: { enabled: !!swapTxHash },
  });

  useEffect(() => {
    if (isSuccess) {
      toast(`Swapped ${amountIn} ${tokenIn?.symbol} → ${amountOutFormatted} ${tokenOut?.symbol}`, "success");
      setAmountIn("");
    }
  }, [isSuccess]);

  function handleSwap() {
    if (!tokenIn || !tokenOut || !address || !amountIn || !amountOut) return;
    const slip = parseFloat(slippage) / 100;
    const minOut = (amountOut * BigInt(Math.floor((1 - slip) * 10000))) / 10000n;
    writeContract({
      address: ROUTER_ADDRESS,
      abi: routerAbi,
      functionName: "swapExactTokensForTokens",
      args: [
        parseUnits(amountIn, tokenIn.decimals),
        minOut,
        [tokenIn.address, tokenOut.address],
        address,
        BigInt(Math.floor(Date.now() / 1000) + 60 * 20),
      ],
    });
  }

  function flipTokens() {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOutFormatted);
    reset?.();
  }

  const impactColor = priceImpact > 5 ? "text-red-400" : priceImpact > 2 ? "text-yellow-400" : "text-emerald-400";
  const busy = isApproving || isPending || isWaiting;

  return (
    <div className="bg-[#1a1d27] border border-white/8 rounded-3xl p-5 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Swap</h2>
        <SlippageSettings slippage={slippage} onChange={setSlippage} />
      </div>

      {/* Input */}
      <div className="bg-[#0f1117] rounded-2xl p-4 mb-1">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500">You pay</span>
          {address && tokenIn && (
            <button onClick={() => setAmountIn(balIn.formatted)} className="text-xs text-blue-400 hover:underline">
              Balance: {parseFloat(balIn.formatted).toFixed(4)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <input
            value={amountIn}
            onChange={e => { setAmountIn(e.target.value.replace(/[^0-9.]/g, "")); reset?.(); }}
            placeholder="0.0"
            className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-white/20 min-w-0"
          />
          <TokenSelector selected={tokenIn} onSelect={setTokenIn} excluded={tokenOut?.address} />
        </div>
      </div>

      {/* Flip */}
      <div className="flex justify-center my-1">
        <button
          onClick={flipTokens}
          className="bg-white/8 hover:bg-blue-500/20 rounded-xl p-2 transition-colors border border-white/10"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Output */}
      <div className="bg-[#0f1117] rounded-2xl p-4 mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500">You receive</span>
          {address && tokenOut && (
            <span className="text-xs text-gray-500">Balance: {parseFloat(balOut.formatted).toFixed(4)}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 text-2xl font-bold min-w-0">
            {quoteLoading
              ? <span className="text-gray-500 text-base animate-pulse">Fetching quote...</span>
              : <span className={amountOutFormatted ? "text-emerald-400" : "text-white/20"}>{amountOutFormatted || "0.0"}</span>
            }
          </div>
          <TokenSelector selected={tokenOut} onSelect={setTokenOut} excluded={tokenIn?.address} />
        </div>
      </div>

      {/* Details */}
      {amountOutFormatted && (
        <div className="bg-[#0f1117] rounded-xl px-4 py-3 mb-4 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Rate</span>
            <span className="text-white">
              1 {tokenIn?.symbol} ≈ {(parseFloat(amountOutFormatted) / parseFloat(amountIn || "1")).toFixed(4)} {tokenOut?.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Price impact</span>
            <span className={impactColor}>{priceImpact.toFixed(2)}%{priceImpact > 5 ? " ⚠" : ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Min received ({slippage}%)</span>
            <span className="text-white">{minReceived} {tokenOut?.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">LP fee</span>
            <span className="text-white">0.3%</span>
          </div>
        </div>
      )}

      {priceImpact > 5 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl px-3 py-2 text-xs text-red-400 mb-3">
          ⚠ High price impact ({priceImpact.toFixed(1)}%) — consider a smaller trade
        </div>
      )}

      {!address ? (
        <div className="text-center text-gray-500 text-sm py-3">Connect wallet to swap</div>
      ) : needsApproval ? (
        <button
          onClick={approve}
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          {isApproving ? "Approving..." : `Approve ${tokenIn?.symbol}`}
        </button>
      ) : (
        <button
          onClick={handleSwap}
          disabled={busy || !tokenIn || !tokenOut || !amountIn || !amountOutFormatted}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors"
        >
          {isPending || isWaiting ? "Swapping..." : isSuccess ? "✓ Swapped!" : "Swap"}
        </button>
      )}
    </div>
  );
}
