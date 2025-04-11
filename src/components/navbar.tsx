import React, { useEffect, useState } from "react";
import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useSendTransaction,
} from "thirdweb/react";
import { client } from "@/app/client";
import { baseSepolia } from "thirdweb/chains";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getContract, prepareContractCall } from "thirdweb";
import { sdk } from "@farcaster/frame-sdk"; // Farcaster SDK
import { WagmiProvider, createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

const wagmiBaseSepolia = defineChain({
  id: baseSepolia.id,
  name: baseSepolia.name ?? "Base Sepolia",
  network: baseSepolia.name ?? "base-sepolia",
  nativeCurrency: {
    name: baseSepolia.nativeCurrency?.name ?? "ETH",
    symbol: baseSepolia.nativeCurrency?.symbol ?? "ETH",
    decimals: baseSepolia.nativeCurrency?.decimals ?? 18,
  },
  rpcUrls: {
    default: { http: [baseSepolia.rpc] },
    public: { http: [baseSepolia.rpc] },
  },
});

// Wagmi config for Farcaster wallet
const wagmiConfig = createConfig({
  chains: [wagmiBaseSepolia],
  transports: { [wagmiBaseSepolia.id]: http() },
  connectors: [farcasterFrame()],
});

const wallets = [
  inAppWallet({
    auth: {
      options: ["google", "farcaster", "passkey"], // Add Farcaster option
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

export function Navbar() {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();
  const { mutate: sendTransaction, isPending } = useSendTransaction();

  useEffect(() => {
    // Initialize Farcaster SDK
    sdk.actions.ready(); // Signal app readiness
    sdk.actions
      .signIn({ nonce: "forecast-" + Date.now() })
      .then((result) => {
        console.log("SIWF Result:", result);
        // Optionally verify on server via API route
      })
      .catch((err) => console.error("SIWF Error:", err));
  }, []);

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
        onSuccess: (data) => {
          toast({
            title: "Tokens Claimed!",
            description: "You've claimed 1000 BET tokens.",
            duration: 5000,
          });
          // Notify Farcaster webhook (optional)
          fetch("/api/webhook", {
            method: "POST",
            body: JSON.stringify({ address: account.address, amount: 1000 }),
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
    <WagmiProvider config={wagmiConfig}>
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
    </WagmiProvider>
  );
}
