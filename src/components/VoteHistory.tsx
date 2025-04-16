// src/components/VoteHistory.tsx
"use client";

import { useEffect, useState } from "react";
import {
  useActiveAccount,
  useReadContract,
  useContractEvents,
} from "thirdweb/react";
import { prepareEvent } from "thirdweb";
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

  const { data: events } = useContractEvents({
    contract,
    events: [preparedEvent],
  });

  useEffect(() => {
    if (!account || !events) {
      setIsLoading(false);
      return;
    }

    const fetchVotes = async () => {
      setIsLoading(true);
      try {
        const userVotes = await Promise.all(
          events
            .filter((e) => e.args.buyer === account.address)
            .map(async (e) => {
              const { data: market } = await useReadContract({
                contract,
                method:
                  "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
                params: [e.args.marketId],
              });
              // Skip if market data is undefined
              if (!market) {
                return null;
              }
              return {
                marketId: Number(e.args.marketId),
                option: e.args.isOptionA ? market[1] : market[2],
                amount: e.args.amount,
                marketName: market[0],
              };
            })
        );
        // Filter out null votes and cast to Vote[]
        setVotes(userVotes.filter((vote): vote is Vote => vote !== null));
      } catch (error) {
        console.error("Vote history error:", error);
      }
      setIsLoading(false);
    };

    fetchVotes();
  }, [account, events]);

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
          <span>{Number(vote.amount)} $BSTR</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-center text-gray-500">No votes submitted yet.</p>
  );
}
