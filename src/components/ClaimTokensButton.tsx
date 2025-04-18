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
import { getRpcClient, eth_getTransactionReceipt } from "thirdweb/rpc";
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
  const { mutateAsync: sendTransaction } = useSendTransaction();

  const { data: claimEvents, isLoading: eventsLoading } = useContractEvents({
    contract: tokenContract,
    events: [claimedEvent],
    watch: true, // auto-refreshes on new blocks
  });

  useEffect(() => {
    if (!account) {
      setIsChecking(false);
      return;
    }
    if (eventsLoading) return; // wait until events have loaded

    setIsChecking(false);
  }, [account, eventsLoading]);

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
      // Retrieve Farcaster ID for wallet address
      const fid = await readContract({
        contract: idRegistryContract,
        method: "function idOf(address) view returns (uint256)",
        params: [account.address],
      });

      if (fid === BigInt(0)) {
        throw new Error("No Farcaster ID linked to this wallet.");
      }

      // Check past events to see if this wallet has already claimed
      const walletHasClaimed = claimEvents?.some(
        (e) => e.args?.claimant?.toLowerCase() === account.address.toLowerCase()
      );

      // Check local storage for FID to prevent duplicates
      const claimedFids = JSON.parse(
        localStorage.getItem("claimedFids") || "[]"
      );
      const hasAlreadyClaimed =
        walletHasClaimed || claimedFids.map(BigInt).includes(fid);

      if (hasAlreadyClaimed) {
        throw new Error("This Farcaster ID has already claimed $BSTR.");
      }

      // Prepare claim transaction
      const preparedTx = prepareContractCall({
        contract: tokenContract,
        method: "function claim()",
        params: [],
        value: BigInt(0),
      });

      // Send transaction
      const txResult = await sendTransaction(preparedTx);

      // Fetch transaction receipt using the transaction hash
      const rpcRequest = getRpcClient({ client, chain: customBaseChain });
      const receipt = await eth_getTransactionReceipt(rpcRequest, {
        hash: txResult.transactionHash,
      });

      // Check status if available
      if (!receipt || parseInt(receipt.status, 16) !== 1) {
        throw new Error("Transaction failed or was reverted.");
      }

      // Update local storage after successful claim
      localStorage.setItem(
        "claimedFids",
        JSON.stringify([...claimedFids, Number(fid)])
      );
      localStorage.setItem("hasSeenOnboarding", "true");

      toast({
        title: "Success",
        description: "Claimed 5,000 $BSTR!",
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
