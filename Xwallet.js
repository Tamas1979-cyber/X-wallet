import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function CryptoWallet() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(null);
  const tokenAddress = "0xYourTokenAddressHere";
  const tokenABI = ["function balanceOf(address owner) view returns (uint256)"];

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  const handleAccountsChanged = async (accounts) => {
    if (accounts.length > 0) {
      setWalletAddress(accounts[0]);
      getBalance(accounts[0]);
      getTokenBalance(accounts[0]);
      getTransactionHistory(accounts[0]);
    } else {
      setWalletAddress(null);
      setBalance(null);
      setTokenBalance(null);
      setTransactions([]);
    }
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        getBalance(accounts[0]);
        getTokenBalance(accounts[0]);
        getTransactionHistory(accounts[0]);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const getBalance = async (address) => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
    }
  };

  const getTokenBalance = async (address) => {
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(tokenAddress, tokenABI, provider);
      const balance = await contract.balanceOf(address);
      setTokenBalance(ethers.utils.formatUnits(balance, 18));
    }
  };

  const getTransactionHistory = async (address) => {
    if (window.ethereum) {
      const provider = new ethers.providers.EtherscanProvider();
      const history = await provider.getHistory(address);
      setTransactions(history);
    }
  };

  const sendTransaction = async () => {
    if (!recipient || !amount) return alert("Enter recipient and amount");
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: recipient,
        value: ethers.utils.parseEther(amount),
      });
      await tx.wait();
      alert("Transaction Successful!");
      getBalance(walletAddress);
      getTransactionHistory(walletAddress);
    } catch (error) {
      console.error("Transaction failed:", error);
      alert("Transaction Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-xl font-bold">Crypto Wallet</h1>
      {walletAddress ? (
        <div>
          <p>Connected: {walletAddress}</p>
          <p>Balance: {balance} ETH</p>
          <p>Token Balance: {tokenBalance} Tokens</p>
          <input
            type="text"
            placeholder="Recipient Address"
            className="border p-2 w-full"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <input
            type="text"
            placeholder="Amount (ETH)"
            className="border p-2 w-full mt-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button
            onClick={sendTransaction}
            className="mt-2 bg-blue-500 text-white p-2 w-full rounded"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send ETH"}
          </button>
          <h2 className="text-lg font-bold mt-4">Transaction History</h2>
          <ul>
            {transactions.map((tx, index) => (
              <li key={index} className="text-sm border-b py-1">
                {tx.hash.substring(0, 20)}... - {ethers.utils.formatEther(tx.value)} ETH
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button onClick={connectWallet} className="bg-green-500 text-white p-2 w-full rounded">
          Connect Wallet
        </button>
      )}
    </div>
  );
}
