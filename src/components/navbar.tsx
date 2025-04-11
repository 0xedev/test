import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useActiveWallet,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getContract } from "thirdweb";
import { useSendTransaction } from "thirdweb/react";
import { prepareTransaction } from "thirdweb";
import { tokenABI, tokenAddress } from "@/constants/token";
import { ethers } from "ethers";

export function Navbar() {
  const account = useActiveAccount();
  const wallet = useActiveWallet(); // Add this to detect wallet type
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
    address: tokenAddress,
    abi: tokenABI,
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
      console.log("Wallet type:", wallet?.id); // Log wallet type (e.g., "inAppWallet", "io.metamask")
      console.log("Preparing transaction for claim...");
      const encodedData = encodeFunctionData({
        abi: tokenABI,
        functionName: "claim",
        args: [],
      });

      console.log("Encoded data:", encodedData);

      const transaction = prepareTransaction({
        client,
        chain: baseSepolia,
        to: tokenAddress,
        data: encodedData,
        value: BigInt(0),
      });

      console.log("Transaction prepared:", transaction);

      console.log("Sending transaction...");
      await sendTransaction(transaction, {
        onSuccess: (result) => {
          console.log("Transaction successful:", result);
          toast({
            title: "Tokens Claimed!",
            description: "You've successfully claimed 1000 BET tokens.",
            duration: 5000,
          });
        },
        onError: (error) => {
          console.error("Transaction Error:", error);
          let errorMessage = "Transaction failed. Please try again.";
          if (error.message.includes("revert")) {
            errorMessage = "You’ve already claimed your tokens.";
          } else if (error.message.includes("timeout")) {
            errorMessage =
              "Network timeout. Check your connection and try again.";
          } else if (error.message.includes("gas")) {
            errorMessage =
              "Gas sponsorship failed. Try with a different wallet.";
          }
          toast({
            title: "Transaction Failed",
            description: errorMessage,
            variant: "destructive",
          });
          throw error;
        },
      });
      console.log("Transaction sent successfully");
    } catch (error) {
      console.error("Claim Error:", error);
      let errorMessage =
        "There was an error claiming your tokens. Please try again.";
      if ((error as Error).message?.includes("revert")) {
        errorMessage = "You’ve already claimed your tokens.";
      } else if ((error as Error).message?.includes("timeout")) {
        errorMessage = "Network timeout. Check your connection and try again.";
      } else if ((error as Error).message?.includes("gas")) {
        errorMessage = "Gas sponsorship issue. Ensure paymaster is configured.";
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
          connectModal={{
            size: "compact",
          }}
          connectButton={{
            style: {
              fontSize: "0.75rem !important",
              height: "2.5rem !important",
            },
            label: "Sign In",
          }}
          detailsButton={{
            displayBalanceToken: {
              [baseSepolia.id]: tokenAddress,
            },
          }}
          accountAbstraction={{
            chain: baseSepolia,
            sponsorGas: true, // Keep this for now, we’ll test disabling it
          }}
        />
      </div>
    </div>
  );
}

function encodeFunctionData({
  abi,
  functionName,
  args,
}: {
  abi: any;
  functionName: string;
  args: any[];
}): `0x${string}` {
  const iface = new ethers.Interface(abi);
  const data = iface.encodeFunctionData(functionName, args);
  return data as `0x${string}`;
}
