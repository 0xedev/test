// src/components/navbar.tsx
import React from "react"; // Removed unused `useEffect`
import { ConnectButton, lightTheme } from "thirdweb/react"; // Removed `useActiveAccount`
import { client } from "@/app/client";
import { baseSepolia } from "wagmi/chains";
import { createWallet } from "thirdweb/wallets";
import { ClaimTokensButton } from "./ClaimTokensButton";
import { WagmiConfig, createConfig, http } from "wagmi";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
  connectors: [farcasterFrame()],
});

const wallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

const customBaseSepolia = {
  id: baseSepolia.id,
  name: baseSepolia.name,
  nativeCurrency: baseSepolia.nativeCurrency,
  rpc: "https://base-sepolia.g.alchemy.com/v2/jprc9bb4eoqJdv5K71YUZdhKyf20gILa",
  blockExplorers: [
    {
      name: "Basescan",
      url: "https://sepolia.basescan.org",
      apiUrl: "https://api-sepolia.basescan.org/api",
    },
  ],
  network: "base-sepolia",
};

export function Navbar() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ForeCast</h1>
        <div className="items-center flex gap-2">
          <ClaimTokensButton />
          <ConnectButton
            client={client}
            theme={lightTheme()}
            chain={customBaseSepolia}
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
          />
        </div>
      </div>
    </WagmiConfig>
  );
}
