import React from "react";

import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useActiveWallet,
  useSendTransaction,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getContract, prepareContractCall } from "thirdweb";
// import { TransactionReceipt } from "thirdweb/transaction";

export function Navbar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();

  const wallets = [
    inAppWallet({
      auth: {
        options: ["google", "farcaster", "passkey"],
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
    createWallet("io.rabby"),
    createWallet("io.zerion.wallet"),
  ];

  const contract = getContract({
    client,
    chain: baseSepolia,
    address: "0xE71Cb4FB5a9EEc3CeDdAC3D08108991Ba74258F3",
  });

  const { mutate: sendTransaction, isPending } = useSendTransaction();

  const handleClaimTokens = async () => {
    if (!account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    setIsClaimLoading(true);
    try {
      console.log("Wallet type:", wallet?.id);
      console.log("Preparing claim transaction...");

      const transaction = prepareContractCall({
        contract,
        method: "function claim() external",
        params: [],
      });

      await sendTransaction(transaction, {
        onSuccess: (data) => {
          console.log("Claim successful:", data.transactionHash);
          toast({
            title: "Tokens Claimed!",
            description: "You've successfully claimed 1000 BET tokens.",
            duration: 5000,
          });
        },
        onError: (error: Error) => {
          console.error("Claim Error:", error);
          let errorMessage = "Transaction failed. Please try again.";
          if (error.message.includes("revert")) {
            errorMessage = "You’ve already claimed or claim limit reached.";
          } else if (error.message.includes("timeout")) {
            errorMessage = "Network timeout. Check your connection.";
          } else if (error.message.includes("insufficient")) {
            errorMessage = "Insufficient ETH for gas. Fund your wallet.";
          }
          toast({
            title: "Claim Failed",
            description: errorMessage,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      console.error("Claim Error:", error);
      const err = error as Error;
      let errorMessage = "There was an error claiming your tokens.";
      if (err.message?.includes("revert")) {
        errorMessage = "You’ve already claimed or claim limit reached.";
      } else if (err.message?.includes("timeout")) {
        errorMessage = "Network timeout. Check your connection.";
      }
      toast({
        title: "Claim Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
      console.log("Claim process completed");
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">ForeCast</h1>
      <div className="items-center flex gap-2">
        {account && (
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
        )}
        <ConnectButton
          client={client}
          theme={lightTheme()}
          chain={baseSepolia}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          connectButton={{
            style: { fontSize: "0.75rem", height: "2.5rem" },
            label: "Sign In",
          }}
          detailsButton={{
            displayBalanceToken: {
              [baseSepolia.id]: "0xE71Cb4FB5a9EEc3CeDdAC3D08108991Ba74258F3",
            },
          }}
          accountAbstraction={{
            chain: baseSepolia,
            sponsorGas: true,
          }}
        />
      </div>
    </div>
  );
}
