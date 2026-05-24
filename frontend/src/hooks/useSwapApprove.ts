"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { erc20Abi } from "@/abis/erc20";
import { ROUTER_ADDRESS } from "@/lib/contracts";
import { maxUint256 } from "viem";

export function useSwapApprove(
  tokenAddress: `0x${string}` | undefined,
  owner: `0x${string}` | undefined,
  amount: bigint
) {
  const { data: allowance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, ROUTER_ADDRESS] : undefined,
    query: { enabled: !!tokenAddress && !!owner },
  });

  const { writeContract, data: approveTxHash, isPending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({
    hash: approveTxHash,
    query: { enabled: !!approveTxHash },
  });

  const needsApproval = allowance !== undefined && allowance < amount;

  function approve() {
    if (!tokenAddress) return;
    writeContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [ROUTER_ADDRESS, maxUint256],
    });
  }

  return { needsApproval, approve, isApproving: isPending || isWaiting, refetch };
}
