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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ClaimTokensButton } from "./ClaimTokensButton";
import { Menu, X } from "lucide-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when dialog opens
  const handleOpenOnboarding = () => {
    setIsOnboardingOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="sticky top-0 z-20 bg-white shadow-sm">
        {/* Desktop Navbar */}
        <div className="flex justify-between items-center px-4 py-3">
          <h1 className="text-xl font-bold">Forecast</h1>

          {/* Desktop Navigation - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenOnboarding}>
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
          </div>

          {/* Mobile Menu Button - Visible only on mobile */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu - Expanded when toggled */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-4 py-3 space-y-3 border-t">
            <div className="w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenOnboarding}
                className="w-full"
              >
                Get Started
              </Button>
            </div>
            <div className="flex justify-center w-full">
              <ConnectButton
                client={client}
                theme={lightTheme()}
                chain={customBase}
                wallets={wallets}
                connectModal={{ size: "compact" }}
                connectButton={{
                  style: {
                    fontSize: "0.75rem",
                    width: "100%",
                  },
                  label: "Connect Wallet",
                }}
                detailsButton={{
                  displayBalanceToken: {
                    [base.id]: "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31",
                  },
                  style: {
                    width: "100%",
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Dialog */}
      <Dialog open={isOnboardingOpen} onOpenChange={setIsOnboardingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to Forecast!</DialogTitle>
            <DialogDescription>
              To vote on markets, claim your $BSTR tokens. Connect your wallet
              if you haven't, then click below to claim.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ClaimTokensButton />
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOnboardingOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WagmiConfig>
  );
}
