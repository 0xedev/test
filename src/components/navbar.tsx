import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "wagmi/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getContract, prepareContractCall } from "thirdweb";
import { sdk } from "@farcaster/frame-sdk";
import { WagmiConfig, createConfig, http } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
  connectors: [farcasterFrame()],
});

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
  chain: {
    id: baseSepolia.id,
    name: baseSepolia.name,
    nativeCurrency: baseSepolia.nativeCurrency,
    rpc: "https://sepolia.base.org",
    blockExplorers: [
      {
        name: "Basescan",
        url: "https://sepolia.basescan.org",
        apiUrl: "https://api-sepolia.basescan.org/api",
      },
    ],
  },
  address: "0xE71Cb4FB5a9EEc3CeDdAC3D08108991Ba74258F3",
});

export function Navbar() {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  useEffect(() => {
    if (!account) return; // Wait for wallet connection

    sdk.actions.ready();
    sdk.actions
      .signIn({ nonce: "forecast-" + Date.now() })
      .then((result) => {
        console.log("SIWF Result:", result);
      })
      .catch((err) => {
        console.error("SIWF Error:", err);
        toast({
          title: "Farcaster Sign-In Failed",
          description:
            "Could not sign in with Farcaster. Check console for details.",
          variant: "destructive",
        });
      });
  }, [account]); // Re-run when account changes

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
            description: "You've claimed 1000 BET tokens.",
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
    } catch (error) {
      toast({
        title: "Claim Failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <WagmiConfig config={wagmiConfig}>
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
              displayBalanceToken: { [baseSepolia.id]: contract.address },
            }}
            accountAbstraction={{ chain: baseSepolia, sponsorGas: true }}
          />
        </div>
      </div>
    </WagmiConfig>
  );
}
