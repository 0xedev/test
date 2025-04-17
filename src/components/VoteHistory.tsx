// src/components/VoteHistory.tsx
"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { prepareEvent, readContract, getContractEvents } from "thirdweb";
import { contract } from "@/constants/contract";

interface Vote {
  marketId: number;
  option: string;
  amount: bigint;
  marketName: string;
}

const preparedEvent = prepareEvent({
  signature:
    "event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool isOptionA, uint256 amount)",
});

export function VoteHistory() {
  const account = useActiveAccount();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    const fetchVotes = async () => {
      setIsLoading(true);
      try {
        const events = await getContractEvents({
          contract,
          fromBlock: 0n,
          toBlock: "latest",
          events: [preparedEvent],
        });
        // Get unique market IDs
        const marketIds = [
          ...new Set(
            events
              .filter(
                (e) =>
                  e.args.buyer.toLowerCase() === account.address.toLowerCase()
              )
              .map((e) => Number(e.args.marketId))
          ),
        ];
        if (marketIds.length === 0) {
          setVotes([]);
          setIsLoading(false);
          return;
        }

        // Fetch market info
        const marketInfos = await Promise.all(
          marketIds.map(async (marketId) => {
            try {
              const market = await readContract({
                contract,
                method:
                  "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
                params: [BigInt(marketId)],
              });
              return {
                marketId,
                question: market[0],
                optionA: market[1],
                optionB: market[2],
              };
            } catch (error) {
              console.error(`Market ${marketId} fetch failed:`, error);
              return null;
            }
          })
        );

        const validMarkets = marketInfos.filter(
          (
            m
          ): m is {
            marketId: number;
            question: string;
            optionA: string;
            optionB: string;
          } => m !== null
        );

        // Map events to votes
        const userVotes = events
          .filter(
            (e) => e.args.buyer.toLowerCase() === account.address.toLowerCase()
          )
          .map((e) => {
            const market = validMarkets.find(
              (m) => m.marketId === Number(e.args.marketId)
            );
            if (!market) return null;
            return {
              marketId: Number(e.args.marketId),
              option: e.args.isOptionA ? market.optionA : market.optionB,
              amount: e.args.amount,
              marketName: market.question,
            };
          })
          .filter((vote): vote is Vote => vote !== null);

        setVotes(userVotes);
      } catch (error) {
        console.error("Vote history error:", error);
        setVotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVotes();
  }, [account]);

  if (!account) {
    return (
      <p className="text-center text-gray-500">
        Connect wallet to view vote history.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  return votes.length > 0 ? (
    <ul className="space-y-2">
      {votes.map((vote, idx) => (
        <li key={idx} className="flex justify-between text-sm">
          <span>
            {vote.marketName} ({vote.option})
          </span>
          <span>{Number(vote.amount) / 1e18} $BSTR</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-center text-gray-500">No votes submitted yet.</p>
  );
}
