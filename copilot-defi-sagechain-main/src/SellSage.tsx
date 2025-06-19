import { useEffect, useState } from "react";
import { ethers } from "ethers";
import TokenSwapABI from "./abis/TokenSwap.json";

const TOKEN_SWAP_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0qqqqqqqqq"; // Replace this

export default function BuySage() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function connectWallet() {
      if (!window.ethereum) {
        setError("MetaMask is not installed.");
        return;
      }

      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          TOKEN_SWAP_ADDRESS,
          TokenSwapABI.abi,
          signer
        );

        setAccount(accounts[0]);
        setContract(contract);
      } catch (err) {
        setError("Failed to connect wallet.");
        console.error(err);
      }
    }

    connectWallet();
  }, []);

  const handleBuy = async () => {
    if (!contract) return;

    setError("");
    setTxHash("");
    setLoading(true);

    try {
      const tx = await contract.buyTokens({
        value: ethers.utils.parseEther("0.1"),
      });
      await tx.wait();
      setTxHash(tx.hash);
    } catch (err) {
      setError("Transaction failed. Check console for details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto mt-10 bg-white rounded-2xl shadow-md border border-gray-200">
      <h1 className="text-2xl font-bold text-purple-700 mb-4">Buy Sage Tokens</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Connected wallet:</p>
        <p className="text-sm font-mono text-gray-800 break-all">
          {account || "Not connected"}
        </p>
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4 bg-red-100 p-2 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleBuy}
        disabled={!account || loading}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition disabled:opacity-50"
      >
        {loading ? "Processing..." : "Buy for 0.1 ETH"}
      </button>

      {txHash && (
        <div className="mt-4 text-sm text-green-700 bg-green-100 p-3 rounded break-words">
          ✅ Transaction sent! <br />
          <span className="text-xs">Hash:</span> <br />
          <a
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {txHash}
          </a>
        </div>
      )}
    </div>
  );
}
