// src/components/market-buy-interface.tsx
"use client";

import { useState } from "react";
import { useSendTransaction, useActiveAccount } from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
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
import { useToast } from "@/components/ui/use-toast";

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
      const tx = prepareContractCall({
        contract,
        method:
          "function buyShares(uint256 marketId, bool isOptionA, uint256 amount)",
        params: [BigInt(marketId), voteOption === "A", BigInt(amount)],
      });
      await sendTransaction(tx, {
        onSuccess: () => {
          toast({
            title: "Vote Cast",
            description: `Successfully voted ${amount} $BSTR on ${
              voteOption === "A" ? market.optionA : market.optionB
            }.`,
          });
          setIsConfirmOpen(false);
          setAmountA("");
          setAmountB("");
        },
        onError: (error) => {
          toast({
            title: "Vote Failed",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("Vote error:", error);
      toast({
        title: "Vote Failed",
        description: "An unexpected error occurred.",
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
            Quick Vote (10)
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
