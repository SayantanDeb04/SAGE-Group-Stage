import { useState, useEffect } from "react";
import { ethers } from "ethers";
import SageTokenABI from "../../artifacts/contracts/SageToken.sol/SageToken.json";
import TokenSwapABI from "../../artifacts/contracts/TokenSwap.sol/TokenSwap.json";
import axios from "axios";

// Replace with your actual deployed contract addresses
const sageTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const tokenSwapAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export default function SwapPanel() {
  const [amount, setAmount] = useState("");
  const [tokenIn, setTokenIn] = useState("");
  const [tokenOut, setTokenOut] = useState("");
  const [prices, setPrices] = useState<any>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price",
          {
            params: {
              ids: "bitcoin,ethereum,usd-coin",
              vs_currencies: "usd",
              include_24hr_change: true,
            },
          }
        );
        setPrices(res.data);
      } catch (err) {
        console.error("Error fetching prices:", err);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // update every 30 sec
    return () => clearInterval(interval);
  }, []);

  async function buy() {
    try {
      if (!window.ethereum) return alert("MetaMask is not installed");
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenSwapAddress, TokenSwapABI.abi, signer);

      const ethValue = ethers.utils.parseEther(amount);
      const tx = await contract.buyTokens({ value: ethValue });

      console.log("Buy tx:", tx.hash);
      await tx.wait();
      alert("Tokens bought successfully!");
    } catch (err) {
      console.error("Buy failed:", err);
      alert("Buy transaction failed.");
    }
  }

  async function swapETHtoWBTC() {
    try {
      if (!window.ethereum) return alert("MetaMask not found");
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenSwapAddress, TokenSwapABI.abi, signer);

      const tx = await contract.swapETHToWBTC({
        value: ethers.utils.parseEther(amount),
      });

      console.log("Swapping ETH to WBTC:", tx.hash);
      await tx.wait();
      alert("Swap complete!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap failed");
    }
  }

  async function swap() {
    try {
      if (!window.ethereum) return alert("MetaMask is not installed");
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(tokenSwapAddress, TokenSwapABI.abi, signer);

      const amountParsed = ethers.utils.parseUnits(amount, 18); // assumes 18 decimals
      const userAddress = await signer.getAddress();

      const tokenInContract = new ethers.Contract(tokenIn, SageTokenABI.abi, signer);
      const allowance = await tokenInContract.allowance(userAddress, tokenSwapAddress);
      if (allowance.lt(amountParsed)) {
        const approveTx = await tokenInContract.approve(tokenSwapAddress, amountParsed);
        await approveTx.wait();
        console.log("Approval successful");
      }

      const tx = await contract.swapToken(tokenIn, tokenOut, amountParsed);
      console.log("Swap tx:", tx.hash);
      await tx.wait();
      alert("Swap successful!");
    } catch (err) {
      console.error("Swap failed:", err);
      alert("Swap transaction failed.");
    }
  }

  const renderToken = (id: string, label: string) => {
    if (!prices || !prices[id]) return null;
    const p = prices[id];
    const price = p.usd?.toFixed(2);
    const change = p.usd_24h_change?.toFixed(1);
    return (
      <div className="flex justify-between border-b py-1 text-sm">
        <span className="font-medium">{label}</span>
        <span>
          <span className={change >= 0 ? "text-green-600" : "text-red-600"}>
            {change >= 0 ? "+" : ""}
            {change}%
          </span>{" "}
          ${price}
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 border rounded-xl bg-white w-full max-w-md space-y-6">
      {/* Buy */}
      <div>
        <h2 className="text-lg font-bold">Buy SAGE Tokens</h2>
        <input
          type="number"
          placeholder="ETH amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={buy} className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
          Buy Tokens
        </button>
      </div>

      {/* ETH → WBTC */}
      <div>
        <h2 className="text-lg font-bold">Swap ETH to WBTC</h2>
        <input
          type="number"
          placeholder="Amount in ETH"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={swapETHtoWBTC} className="bg-yellow-600 text-white px-4 py-2 rounded mt-2">
          Swap ETH → WBTC
        </button>
      </div>

      {/* Token-to-token */}
      <div>
        <h2 className="text-lg font-bold">Swap Tokens</h2>
        <input
          type="text"
          placeholder="Token In Address"
          value={tokenIn}
          onChange={(e) => setTokenIn(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Token Out Address"
          value={tokenOut}
          onChange={(e) => setTokenOut(e.target.value)}
          className="border p-2 w-full"
        />
        <input
          type="number"
          placeholder="Amount to Swap"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 w-full"
        />
        <button onClick={swap} className="bg-green-600 text-white px-4 py-2 rounded mt-2">
          Swap Tokens
        </button>
      </div>

      {/* Market Overview */}
      <div className="mt-6 p-4 bg-gray-100 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold mb-2">Market Overview</h3>
        {renderToken("ethereum", "ETH (Ethereum)")}
        {renderToken("bitcoin", "BTC (Bitcoin)")}
        {renderToken("usd-coin", "USDC (USD Coin)")}
      </div>
    </div>
  );
}
