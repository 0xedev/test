import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

export const contractAddress = "0x32990F3fA34108B3f3c54d663861E2B88e84C1DB";
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
