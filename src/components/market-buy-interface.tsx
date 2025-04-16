// src/components/market-buy-interface.tsx
"use client";

import { useState } from "react";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, readContract, getContract } from "thirdweb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { contract } from "@/constants/contract";
import { base } from "wagmi/chains";
import { client } from "@/app/client";
import { useToast } from "@/hooks/use-toast";

const customBaseChain = {
  ...base,
  testnet: undefined,
  rpc: "https://base-mainnet.g.alchemy.com/v2/jprc9bb4eoqJdv5K71YUZdhKyf20gILa",
  blockExplorers: [
    {
      name: "Basescan",
      url: "https://basescan.org",
      apiUrl: "https://api.basescan.org/api",
    },
  ],
};

const tokenContract = getContract({
  client,
  chain: customBaseChain,
  address: "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31",
});

interface Market {
  question: string;
  optionA: string;
  optionB: string;
  endTime: bigint;
  outcome: number;
  totalOptionAShares: bigint;
  totalOptionBShares: bigint;
  resolved: boolean;
}

interface MarketBuyInterfaceProps {
  marketId: number;
  market: Market;
}

export function MarketBuyInterface({
  marketId,
  market,
}: MarketBuyInterfaceProps) {
  const account = useActiveAccount();
  const { toast } = useToast();
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [voteOption, setVoteOption] = useState<"A" | "B" | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const MAX_BET = 1000; // Max 1000 $BSTR per vote
  const QUICK_VOTE_AMOUNT = "100"; // Standardized quick vote amount

  // Unified validation function
  const validateAmount = (
    amount: string
  ): { valid: boolean; message?: string } => {
    if (!amount || amount === "") {
      return { valid: false, message: "Please enter a valid amount." };
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, message: "Amount must be greater than 0." };
    }

    if (numAmount > MAX_BET) {
      return { valid: false, message: `Maximum bet is ${MAX_BET} $BSTR.` };
    }

    return { valid: true };
  };

  const handleVote = (option: "A" | "B", amount: string) => {
    const validation = validateAmount(amount);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    setVoteOption(option);
    setIsConfirmOpen(true);
  };

  const processVoteTransaction = async (amountWei: bigint) => {
    const voteTx = prepareContractCall({
      contract,
      method:
        "function buyShares(uint256 marketId, bool isOptionA, uint256 amount)",
      params: [BigInt(marketId), voteOption === "A", amountWei],
    });

    let retries = 3;
    while (retries > 0) {
      try {
        await sendTransaction(voteTx, {
          onSuccess: () => {
            const amount = voteOption === "A" ? amountA : amountB;
            toast({
              title: "Vote Cast",
              description: `Voted ${amount} $BSTR on ${
                voteOption === "A" ? market.optionA : market.optionB
              }.`,
            });
            setIsConfirmOpen(false);
            setAmountA("");
            setAmountB("");
          },
          onError: (error) => {
            // Capture error but don't throw yet so we can retry
            if (retries <= 1) throw error;
          },
        });
        return; // Success, exit the retry loop
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: string }).message === "string" &&
          (error as { message: string }).message.includes("429") &&
          retries > 1
        ) {
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (4 - retries))
          );
          retries--;
          continue;
        }

        // If we're here, it's an error that's not retryable
        let message = "Failed to vote.";
        if (
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: string }).message === "string"
        ) {
          // Improved error handling with more specific messages
          const errorMsg = (error as { message: string }).message;
          if (errorMsg.includes("0xfb8f41b2")) {
            message =
              "Insufficient token allowance. Please approve tokens first.";
          } else if (errorMsg.includes("user rejected")) {
            message = "Transaction was rejected.";
          } else {
            message = errorMsg;
          }
        }

        toast({
          title: "Vote Failed",
          description: message,
          variant: "destructive",
        });

        throw error; // Re-throw to stop the process
      }
    }
  };

  const confirmVote = async () => {
    if (!account || !voteOption || (!amountA && !amountB)) return;

    const amount = voteOption === "A" ? amountA : amountB;
    const validation = validateAmount(amount);
    if (!validation.valid) {
      toast({
        title: "Error",
        description: validation.message,
        variant: "destructive",
      });
      return;
    }

    try {
      const numAmount = Number(amount);
      const amountWei = BigInt(Math.floor(numAmount * 10 ** 18)); // Ensuring integer conversion

      // Check allowance
      const allowance = await readContract({
        contract: tokenContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, contract.address],
      });

      if (allowance < amountWei) {
        // Need approval
        setIsApproving(true);

        const approveTx = prepareContractCall({
          contract: tokenContract,
          method: "function approve(address spender, uint256 amount)",
          params: [contract.address, amountWei],
        });

        await sendTransaction(approveTx, {
          onSuccess: async (result) => {
            toast({
              title: "Approved",
              description: "Tokens approved for voting. Processing vote now...",
            });

            try {
              // Wait a brief moment for the approval to propagate
              // This is a best practice but may not be necessary on all chains
              await new Promise((resolve) => setTimeout(resolve, 2000));

              // Now proceed with the vote transaction
              await processVoteTransaction(amountWei);
            } catch (voteError) {
              console.error("Vote failed after approval:", voteError);
              // Error toast already shown in processVoteTransaction
            } finally {
              setIsApproving(false);
            }
          },
          onError: (error) => {
            setIsApproving(false);
            toast({
              title: "Approval Failed",
              description: error.message || "Failed to approve tokens.",
              variant: "destructive",
            });
          },
        });
      } else {
        // Already approved, proceed directly to vote
        await processVoteTransaction(amountWei);
      }
    } catch (error: unknown) {
      // General error handling for issues outside the specific transaction processes
      console.error("Transaction error:", error);
      let message = "Transaction failed.";
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: string }).message === "string"
      ) {
        message = (error as { message: string }).message;
      }

      toast({
        title: "Transaction Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleQuickVote = (option: "A" | "B") => {
    if (option === "A") setAmountA(QUICK_VOTE_AMOUNT);
    else setAmountB(QUICK_VOTE_AMOUNT);
    handleVote(option, QUICK_VOTE_AMOUNT);
  };

  // Improved input handler with validation
  const handleAmountChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Handle empty input
    if (value === "") {
      setter("");
      return;
    }

    // Remove leading zeros and non-numeric characters
    const sanitizedValue =
      value.replace(/^0+/, "").replace(/[^0-9]/g, "") || "";

    // Check against MAX_BET
    if (sanitizedValue && Number(sanitizedValue) > MAX_BET) {
      toast({
        title: "Error",
        description: `Maximum bet is ${MAX_BET} $BSTR.`,
        variant: "destructive",
      });
      return;
    }

    setter(sanitizedValue);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          {market.optionA}
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Enter amount"
            value={amountA}
            onChange={(e) => handleAmountChange(e.target.value, setAmountA)}
            className="flex-1"
            min="0"
            step="1"
            max={MAX_BET}
          />
          <Button
            onClick={() => handleVote("A", amountA)}
            disabled={isPending || isApproving || !account || !amountA}
          >
            Vote
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickVote("A")}
            disabled={isPending || isApproving || !account}
          >
            Quick Vote ({QUICK_VOTE_AMOUNT})
          </Button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          {market.optionB}
        </label>
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Enter amount"
            value={amountB}
            onChange={(e) => handleAmountChange(e.target.value, setAmountB)}
            className="flex-1"
            min="0"
            step="1"
            max={MAX_BET}
          />
          <Button
            onClick={() => handleVote("B", amountB)}
            disabled={isPending || isApproving || !account || !amountB}
          >
            Vote
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickVote("B")}
            disabled={isPending || isApproving || !account}
          >
            Quick Vote ({QUICK_VOTE_AMOUNT})
          </Button>
        </div>
      </div>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You're voting {voteOption === "A" ? amountA : amountB} $BSTR on "
              {voteOption === "A" ? market.optionA : market.optionB}" for market
              "{market.question}". Please confirm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmVote} disabled={isPending || isApproving}>
              {isApproving
                ? "Approving..."
                : isPending
                ? "Processing..."
                : "Confirm Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
