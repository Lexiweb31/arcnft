"use client";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { maxUint256 } from "viem";
import { USDC_ADDRESS, MARKETPLACE_ADDRESS } from "@/lib/contracts";
import { erc20Abi } from "@/abis/erc20";

export function useUSDCApprove(owner: `0x${string}` | undefined, amount: bigint) {
  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, MARKETPLACE_ADDRESS] : undefined,
    query: { enabled: !!owner, refetchInterval: 5000 },
  });

  const needsApproval = !allowance || allowance < amount;

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash });

  function approve() {
    writeContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, maxUint256],
    });
  }

  return { needsApproval, approve, isApproving: isPending || isWaiting };
}
