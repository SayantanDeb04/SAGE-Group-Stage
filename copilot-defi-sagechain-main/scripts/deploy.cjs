const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const amountToFund = ethers.parseUnits("500000", 18); // 500,000 tokens

  // ✅ Deploy SageToken
  const SageToken = await ethers.getContractFactory("SageToken");
  const sageToken = await SageToken.deploy(ethers.parseUnits("1000000", 18)); // 1 million SAGE
  await sageToken.waitForDeployment();
  console.log(`SageToken deployed to: ${sageToken.target}`);

  // ✅ Deploy WBTC
  const WBTC = await ethers.getContractFactory("WBTC");
  const wbtc = await WBTC.deploy();
  await wbtc.waitForDeployment();
  console.log(`WBTC deployed to: ${wbtc.target}`);

  // ✅ Deploy TokenSwap with both SageToken and WBTC addresses
  const TokenSwap = await ethers.getContractFactory("TokenSwap");
  const tokenSwap = await TokenSwap.deploy(sageToken.target, wbtc.target);
  await tokenSwap.waitForDeployment();
  console.log(`TokenSwap deployed to: ${tokenSwap.target}`);

  // ✅ Fund TokenSwap with 500,000 SAGE and WBTC
  await sageToken.transfer(tokenSwap.target, amountToFund);
  await wbtc.transfer(tokenSwap.target, amountToFund);
  console.log(`Loaded TokenSwap with ${ethers.formatUnits(amountToFund, 18)} SAGE & WBTC`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
