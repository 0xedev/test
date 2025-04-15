import { client } from "@/app/client";
import { getContract } from "thirdweb";
import { base } from "thirdweb/chains";

export const contractAddress = "0xD3fa48B3bb4f89bF3B75F5763475B774076215D1";
export const tokenAddress = "0x55b04F15A1878fa5091D5E35ebceBC06A5EC2F31";

export const contract = getContract({
  client: client,
  chain: base,
  address: contractAddress,
});

export const tokenContract = getContract({
  client: client,
  chain: base,
  address: tokenAddress,
});
