import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

export const contractAddress = "0xF4e3543e0f5c33f8E605353cc6c4eD00c32570ED";
export const tokenAddress = "0x20dC4B8196C55B02A4Db685Eb84bd1AC9ecdc877";

export const contract = getContract({
  client: client,
  chain: baseSepolia,
  address: contractAddress,
});

export const tokenContract = getContract({
  client: client,
  chain: baseSepolia,
  address: tokenAddress,
});
