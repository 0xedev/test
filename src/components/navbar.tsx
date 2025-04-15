// src/components/navbar.tsx
import React from "react"; // Removed unused `useEffect`
import { ConnectButton, lightTheme } from "thirdweb/react"; // Removed `useActiveAccount`
import { client } from "@/app/client";
import { base } from "wagmi/chains";
import { createWallet } from "thirdweb/wallets";
import { ClaimTokensButton } from "./ClaimTokensButton";
import { WagmiConfig, createConfig, http } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

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
  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Forecast</h1>
        <div className="items-center flex gap-2">
          <ClaimTokensButton />
          <ConnectButton
            client={client}
            theme={lightTheme()}
            chain={customBase}
            wallets={wallets}
            connectModal={{ size: "compact" }}
            connectButton={{
              style: { fontSize: "0.75rem", height: "2.5rem" },
              label: "Sign In",
            }}
            detailsButton={{
              displayBalanceToken: {
                [base.id]: "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31",
              },
            }}
          />
        </div>
      </div>
    </WagmiConfig>
  );
}
