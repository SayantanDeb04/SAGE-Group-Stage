// utils/getBalance.ts
import { ethers } from "ethers";

export async function getTokenBalance(
  address: string,
  tokenAddress: string,
  abi: any,
  provider: ethers.providers.Web3Provider
) {
  const tokenContract = new ethers.Contract(tokenAddress, abi, provider);
  const balance = await tokenContract.balanceOf(address);
  return ethers.utils.formatEther(balance);
}
