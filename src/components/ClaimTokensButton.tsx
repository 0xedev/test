// src/components/ClaimTokensButton.tsx
"use client";

import { useState, useEffect } from "react";
import {
  useActiveAccount,
  useSendTransaction,
  useContractEvents,
} from "thirdweb/react";
import {
  prepareEvent,
  readContract,
  getContract,
  prepareContractCall,
} from "thirdweb";
import { base } from "wagmi/chains";
import { client } from "@/app/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

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

const idRegistryContract = getContract({
  client,
  chain: customBaseChain,
  address: "0x00000000Fc6c5F01Fc30151999387Bb99A9f489b", // Farcaster IdRegistry
});

const claimedEvent = prepareEvent({
  signature: "event Claimed(address indexed claimant, uint256 amount)",
});

export function ClaimTokensButton() {
  const account = useActiveAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { mutate: sendTransaction } = useSendTransaction();

  // Fetch Claimed events
  const { data: claimEvents } = useContractEvents({
    contract: tokenContract,
    events: [claimedEvent],
  });

  // Track FID claim status
  useEffect(() => {
    if (!account || !claimEvents) {
      setIsChecking(false);
      return;
    }
    setIsChecking(false);
  }, [account, claimEvents]);

  const handleClaim = async () => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Get FID
      const fid = await readContract({
        contract: idRegistryContract,
        method: "function idOf(address) view returns (uint256)",
        params: [account.address],
      });

      if (fid === BigInt(0)) {
        throw new Error("No Farcaster ID linked to this wallet.");
      }

      // Check Claimed events for this wallet
      const walletHasClaimed = claimEvents?.some(
        (e) => e.args.claimant.toLowerCase() === account.address.toLowerCase()
      );

      // Fallback: Check localStorage
      const claimedFids = JSON.parse(
        localStorage.getItem("claimedFids") || "[]"
      );
      if (walletHasClaimed || claimedFids.includes(Number(fid))) {
        throw new Error("This Farcaster ID has already claimed $BSTR.");
      }

      // Prepare claim transaction
      const preparedTx = prepareContractCall({
        contract: tokenContract,
        method: "function claim()",
        params: [],
        value: BigInt(0),
      });

      await sendTransaction(preparedTx, {
        onSuccess: () => {
          // Mark FID as claimed
          localStorage.setItem(
            "claimedFids",
            JSON.stringify([...claimedFids, Number(fid)])
          );
          localStorage.setItem("hasSeenOnboarding", "true"); // Sync with popup
          toast({
            title: "Success",
            description: "Claimed 5,000 $BSTR!",
          });
        },
        onError: (error) => {
          throw error;
        },
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to claim $BSTR.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClaim}
      disabled={isLoading || !account || isChecking}
    >
      {isLoading
        ? "Claiming..."
        : isChecking
        ? "Checking..."
        : "Claim 5,000 $BSTR"}
    </Button>
  );
}
