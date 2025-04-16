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
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const MAX_BET = 1000; // Max 1000 $BSTR per vote

  const handleVote = (option: "A" | "B", amount: string) => {
    const numAmount = Number(amount);
    if (numAmount > MAX_BET) {
      toast({
        title: "Error",
        description: `Maximum bet is ${MAX_BET} $BSTR.`,
        variant: "destructive",
      });
      return;
    }
    setVoteOption(option);
    setIsConfirmOpen(true);
  };

  const confirmVote = async () => {
    if (!account || !voteOption || (!amountA && !amountB)) return;

    const amount = voteOption === "A" ? amountA : amountB;
    const numAmount = Number(amount);
    if (!amount || numAmount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }
    if (numAmount > MAX_BET) {
      toast({
        title: "Error",
        description: `Maximum bet is ${MAX_BET} $BSTR.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Check allowance
      const allowance = await readContract({
        contract: tokenContract,
        method:
          "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, contract.address],
      });

      const amountWei = BigInt(numAmount * 10 ** 18); // Assuming 18 decimals
      if (allowance < amountWei) {
        const approveTx = prepareContractCall({
          contract: tokenContract,
          method: "function approve(address spender, uint256 amount)",
          params: [contract.address, amountWei],
        });
        await sendTransaction(approveTx, {
          onSuccess: () => {
            toast({
              title: "Approved",
              description: "Tokens approved for voting.",
            });
          },
          onError: (error) => {
            throw new Error(`Approval failed: ${error.message}`);
          },
        });
      }

      // Vote with retry for 429
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
              throw error;
            },
          });
          return;
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
          throw error;
        }
      }
    } catch (error: unknown) {
      let message = "Failed to vote.";
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: string }).message === "string"
      ) {
        message = (error as { message: string }).message.includes("0xfb8f41b2")
          ? "Please approve tokens first."
          : (error as { message: string }).message;
      }
      toast({
        title: "Vote Failed",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleQuickVote = (option: "A" | "B") => {
    const quickAmount = "100";
    if (Number(quickAmount) > MAX_BET) {
      toast({
        title: "Error",
        description: `Maximum bet is ${MAX_BET} $BSTR.`,
        variant: "destructive",
      });
      return;
    }
    if (option === "A") setAmountA(quickAmount);
    else setAmountB(quickAmount);
    handleVote(option, quickAmount);
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
            onChange={(e) => {
              const value = e.target.value.replace(/^0+/, "") || "";
              if (value && Number(value) > MAX_BET) {
                toast({
                  title: "Error",
                  description: `Maximum bet is ${MAX_BET} $BSTR.`,
                  variant: "destructive",
                });
                return;
              }
              setAmountA(value);
            }}
            className="flex-1"
            min="0"
            step="1"
            max={MAX_BET}
          />
          <Button
            onClick={() => handleVote("A", amountA)}
            disabled={isPending || !account || !amountA}
          >
            Vote
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickVote("A")}
            disabled={isPending || !account}
          >
            Quick Vote (100)
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
            onChange={(e) => {
              const value = e.target.value.replace(/^0+/, "") || "";
              if (value && Number(value) > MAX_BET) {
                toast({
                  title: "Error",
                  description: `Maximum bet is ${MAX_BET} $BSTR.`,
                  variant: "destructive",
                });
                return;
              }
              setAmountB(value);
            }}
            className="flex-1"
            min="0"
            step="1"
            max={MAX_BET}
          />
          <Button
            onClick={() => handleVote("B", amountB)}
            disabled={isPending || !account || !amountB}
          >
            Vote
          </Button>
          <Button
            variant="outline"
            onClick={() => handleQuickVote("B")}
            disabled={isPending || !account}
          >
            Quick Vote (10)
          </Button>
        </div>
      </div>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Vote</DialogTitle>
            <DialogDescription>
              You’re voting {voteOption === "A" ? amountA : amountB} $BSTR on “
              {voteOption === "A" ? market.optionA : market.optionB}” for market
              “{market.question}”. Please confirm.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmVote} disabled={isPending}>
              {isPending ? "Processing..." : "Confirm Vote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
