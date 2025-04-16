// src/components/enhanced-prediction-market-dashboard.tsx
"use client";

import { useReadContract, useActiveAccount } from "thirdweb/react";
import { contract } from "@/constants/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "./marketCard";
import { Navbar } from "./navbar";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Footer } from "./footer";
import { VoteHistory } from "./VoteHistory";
import { useEffect, useState } from "react";
import { sdk } from "@farcaster/frame-sdk";
import { getContract } from "thirdweb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ClaimTokensButton } from "./ClaimTokensButton";
import { Button } from "@/components/ui/button";

const tokenContract = getContract({
  client: contract.client,
  chain: contract.chain,
  address: "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31",
});

export function EnhancedPredictionMarketDashboard() {
  const account = useActiveAccount();
  const { data: marketCount, isLoading: isLoadingMarketCount } =
    useReadContract({
      contract,
      method: "function marketCount() view returns (uint256)",
      params: [],
    });
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    contract: tokenContract,
    method: "function balanceOf(address) view returns (uint256)",
    params: [account?.address || "0x0"],
  });

  const [leaderboard, setLeaderboard] = useState<
    Array<{
      username: string;
      fid: number;
      winnings: number;
    }>
  >([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  // Fetch leaderboard
  useEffect(() => {
    setIsLoadingLeaderboard(true);
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Leaderboard fetch error:", err);
        setLeaderboard([]);
      })
      .finally(() => {
        setIsLoadingLeaderboard(false);
      });
  }, []);

  // Check localStorage for onboarding
  useEffect(() => {
    const seen = localStorage.getItem("hasSeenOnboarding");
    setHasSeenOnboarding(seen === "true");
  }, []);

  // Signal readiness to Farcaster client
  useEffect(() => {
    if (!isLoadingMarketCount && !isLoadingBalance && !isLoadingLeaderboard) {
      console.log("Signaling ready: marketCount =", marketCount);
      sdk.actions.ready();
    }
  }, [isLoadingMarketCount, isLoadingBalance, isLoadingLeaderboard]);

  // Handle onboarding popup
  const handleCloseOnboarding = () => {
    setHasSeenOnboarding(true);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <MarketCardSkeleton key={`skeleton-${i}`} />
  ));

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow container mx-auto p-4">
        <Navbar />
        <div className="mb-4">
          <img
            src="banner2.avif"
            alt="Buster Banner"
            className="w-full h-auto rounded-lg"
          />
        </div>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4 overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="active" className="text-xs px-2">
              Active
            </TabsTrigger>
            <TabsTrigger value="ended" className="text-xs px-2">
              Ended
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs px-2">
              Top
            </TabsTrigger>
            <TabsTrigger value="myvotes" className="text-xs px-2">
              Votes
            </TabsTrigger>
          </TabsList>
          {isLoadingMarketCount ? (
            <TabsContent value="active" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {skeletonCards}
              </div>
            </TabsContent>
          ) : (
            <>
              <TabsContent value="active" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from(
                    { length: Number(marketCount) || 0 },
                    (_, index) => (
                      <MarketCard key={index} index={index} filter="active" />
                    )
                  )}
                </div>
              </TabsContent>
              <TabsContent value="ended" className="mt-6">
                <Tabs defaultValue="pending" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending" className="text-xs px-2">
                      Pending
                    </TabsTrigger>
                    <TabsTrigger value="resolved" className="text-xs px-2">
                      Results
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending">
                    <p className="text-center text-gray-500 mb-4">
                      Pending markets are ended but not yet resolved.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from(
                        { length: Number(marketCount) || 0 },
                        (_, index) => (
                          <MarketCard
                            key={index}
                            index={index}
                            filter="pending"
                          />
                        )
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="resolved">
                    <p className="text-center text-gray-500 mb-4">
                      Results show resolved markets with final outcomes.
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from(
                        { length: Number(marketCount) || 0 },
                        (_, index) => (
                          <MarketCard
                            key={index}
                            index={index}
                            filter="resolved"
                          />
                        )
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
              <TabsContent value="leaderboard" className="mt-6">
                <h2 className="text-xl font-bold mb-4">Top Predictors</h2>
                {isLoadingLeaderboard ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                ) : leaderboard.length > 0 ? (
                  <ul className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                      <li
                        key={entry.fid}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {idx + 1}. {entry.username} (FID: {entry.fid})
                        </span>
                        <span>{entry.winnings} BET</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    No leaderboard data available
                  </p>
                )}
              </TabsContent>
              <TabsContent value="myvotes" className="mt-6">
                <h2 className="text-xl font-bold mb-4">My Votes</h2>
                <VoteHistory />
              </TabsContent>
            </>
          )}
        </Tabs>
        <Dialog
          open={
            account &&
            !isLoadingBalance &&
            balance === BigInt(0) &&
            !hasSeenOnboarding
          }
          onOpenChange={handleCloseOnboarding}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Welcome to Forecast!</DialogTitle>
              <DialogDescription>
                To vote on markets, claim your $BSTR tokens. Click below to
                claim your tokens and start participating.
              </DialogDescription>
            </DialogHeader>
            <ClaimTokensButton />
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseOnboarding}>
                Skip
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
