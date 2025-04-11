import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

export const contractAddress = "0xF4e3543e0f5c33f8E605353cc6c4eD00c32570ED";
export const tokenAddress = "0xE71Cb4FB5a9EEc3CeDdAC3D08108991Ba74258F3";

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
