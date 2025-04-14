// src/components/ClaimTokensButton.tsx
"use client";

import React, { useState } from "react";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getContract, prepareContractCall } from "thirdweb";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";

const contract = getContract({
  client,
  chain: baseSepolia,
  address: "0xE71Cb4FB5a9EEc3CeDdAC3D08108991Ba74258F3",
});

export function ClaimTokensButton() {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleClaimTokens = async () => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsClaimLoading(true);
    try {
      const transaction = prepareContractCall({
        contract,
        method: "function claim() external",
        params: [],
      });

      await sendTransaction(transaction, {
        onSuccess: () => {
          toast({
            title: "Tokens Claimed!",
            description: "You've claimed 5000 BUSTER tokens.",
          });
        },
        onError: (error) => {
          let message = "Transaction failed.";
          if (error.message.includes("revert"))
            message = "Already claimed or limit reached.";
          toast({
            title: "Claim Failed",
            description: message,
            variant: "destructive",
          });
        },
      });
    } catch (error: unknown) {
      console.error("Claim error:", error);
      toast({
        title: "Claim Failed",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  return account ? (
    <Button
      onClick={handleClaimTokens}
      disabled={isClaimLoading || isPending}
      variant="outline"
    >
      {isClaimLoading || isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Claiming...
        </>
      ) : (
        "Claim Tokens"
      )}
    </Button>
  ) : null;
}
