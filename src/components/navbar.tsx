// src/components/navbar.tsx
"use client";

import React, { useState } from "react";
import { ConnectButton, lightTheme } from "thirdweb/react";
import { client } from "@/app/client";
import { base } from "wagmi/chains";
import { createWallet } from "thirdweb/wallets";
import { WagmiConfig, createConfig, http } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClaimTokensButton } from "./ClaimTokensButton";

const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [farcasterFrame()],
});

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const customBase = {
  id: base.id,
  name: base.name,
  nativeCurrency: base.nativeCurrency,
  rpc: "https://base-mainnet.g.alchemy.com/v2/jprc9bb4eoqJdv5K71YUZdhKyf20gILa",
  blockExplorers: [
    {
      name: "Basescan",
      url: "https://basescan.org",
      apiUrl: "https://api-basescan.org/api",
    },
  ],
  network: "base",
};

export function Navbar() {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="flex justify-between items-center mb-4 px-4">
        <h1 className="text-xl font-bold">Forecast</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOnboardingOpen(true)}
          >
            Get Started
          </Button>
          <ConnectButton
            client={client}
            theme={lightTheme()}
            chain={customBase}
            wallets={wallets}
            connectModal={{ size: "compact" }}
            connectButton={{
              style: {
                fontSize: "0.75rem",
                height: "2rem",
                padding: "0 0.5rem",
              },
              label: "Wallet",
            }}
            detailsButton={{
              displayBalanceToken: {
                [base.id]: "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31",
              },
            }}
          />
          <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Welcome to Forecast!</DialogTitle>
                <DialogDescription>
                  To vote on markets, claim your $BSTR tokens. Connect your
                  wallet if you haven’t, then click below to claim.
                </DialogDescription>
              </DialogHeader>
              <ClaimTokensButton />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </WagmiConfig>
  );
}
