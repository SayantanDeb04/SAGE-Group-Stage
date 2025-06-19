import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Copy,
  ExternalLink,
  ChevronDown,
  Loader2,
  LogOut,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnectorProps {
  isConnected: boolean;
  onConnect: (walletData: WalletData) => void;
  onDisconnect?: () => void;
}

export interface WalletData {
  address: string;
  balance: string;
  walletType: string;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const WalletConnector = ({ isConnected, onConnect, onDisconnect }: WalletConnectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedWalletType, setConnectedWalletType] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { toast } = useToast();

  const wallets = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Most popular Ethereum wallet',
      installed: typeof window !== 'undefined' && window.ethereum?.isMetaMask,
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Connect via QR code',
      installed: true, // Placeholder
    },
  ];

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const address = accounts[0];
            setWalletAddress(address);
            const balance = await updateBalance(address);
            setConnectedWalletType('MetaMask');
            onConnect({ address, balance, walletType: 'MetaMask' });
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    checkConnection();
  }, [onConnect]);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          const address = accounts[0];
          setWalletAddress(address);
          const balance = await updateBalance(address);
          onConnect({ address, balance, walletType: connectedWalletType || 'MetaMask' });
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener?.('accountsChanged', handleAccountsChanged);
      };
    }
  }, [connectedWalletType, onConnect]);

  const updateBalance = async (address: string): Promise<string> => {
    try {
      const balance = await window.ethereum?.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });
      const balanceInWei = parseInt(balance, 16);
      const balanceInEth = balanceInWei / 1e18;
      const formatted = `${balanceInEth.toFixed(4)} ETH`;
      setWalletBalance(formatted);
      return formatted;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setWalletBalance('Unable to fetch');
      return 'Unable to fetch';
    }
  };

  const connectMetaMask = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Install MetaMask extension to continue.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      setWalletAddress(address);
      const balance = await updateBalance(address);
      setConnectedWalletType('MetaMask');
      onConnect({ address, balance, walletType: 'MetaMask' });
      setIsOpen(false);
      toast({ title: "Wallet Connected", description: "MetaMask connected successfully." });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Connection Failed",
        description: err.message || "Could not connect to MetaMask.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setSelectedWallet('');
    }
  };

  const connectWalletConnect = async () => {
    setIsConnecting(true);
    toast({
      title: "WalletConnect",
      description: "Simulating WalletConnect connection...",
    });

    setTimeout(() => {
      const mockAddress = '0x742d35Cc6B5C73Ff5cb78a3e7B9B6834567f8f3A';
      const mockBalance = '2.5479 ETH';
      setWalletAddress(mockAddress);
      setWalletBalance(mockBalance);
      setConnectedWalletType('WalletConnect');
      onConnect({ address: mockAddress, balance: mockBalance, walletType: 'WalletConnect' });
      setIsOpen(false);
      setIsConnecting(false);
      setSelectedWallet('');
      toast({
        title: "Wallet Connected",
        description: "WalletConnect (simulated) connected.",
      });
    }, 2000);
  };

  const handleWalletSelect = async (walletName: string) => {
    setSelectedWallet(walletName);
    walletName === 'MetaMask' ? await connectMetaMask() : await connectWalletConnect();
  };

  const disconnectWallet = () => {
    setWalletAddress('');
    setWalletBalance('');
    setConnectedWalletType('');
    setIsOpen(false);
    setShowDropdown(false);
    setSelectedWallet('');
    setIsConnecting(false);
    onDisconnect?.();
    toast({ title: "Wallet Disconnected", description: "Disconnected successfully." });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast({ title: "Copied", description: "Address copied to clipboard." });
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (isConnected && walletAddress) {
    return (
      <div className="relative">
        <Button variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <Wallet className="w-4 h-4 mr-2" />
          {formatAddress(walletAddress)}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-purple-800/30 rounded-lg z-50 shadow-lg">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{connectedWalletType === 'MetaMask' ? '🦊' : '🔗'}</span>
                  <span className="text-white">{connectedWalletType}</span>
                </div>
                <Badge className="bg-green-600/20 text-green-400">Connected</Badge>
              </div>
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-300">Address</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono">{formatAddress(walletAddress)}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={copyAddress}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-300">Balance</span>
                  <span className="text-white">{walletBalance}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex-1 border-purple-600 text-purple-400 text-xs">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-purple-800/30">
                    <DialogHeader>
                      <DialogTitle className="text-white">Wallet Details</DialogTitle>
                      <DialogDescription className="text-purple-300">
                        Manage your connected wallet
                      </DialogDescription>
                    </DialogHeader>
                    <Card className="bg-black/40 border-purple-800/30">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{connectedWalletType === 'MetaMask' ? '🦊' : '🔗'}</span>
                            <span className="text-white">{connectedWalletType}</span>
                          </div>
                          <Badge className="bg-green-600/20 text-green-400">Connected</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Address</span>
                          <span className="text-white font-mono">{walletAddress}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Balance</span>
                          <span className="text-white">{walletBalance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-300">Network</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span className="text-white text-sm">Ethereum Mainnet</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" className="flex-1 border-purple-600 text-purple-400">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View on Etherscan
                      </Button>
                      <Button variant="outline" className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10" onClick={disconnectWallet}>
                        Disconnect
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="flex-1 border-red-600 text-red-400 text-xs hover:bg-red-600/10" onClick={disconnectWallet}>
                  <LogOut className="w-3 h-3 mr-1" />
                  Disconnect
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-purple-800/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Connect Your Wallet</DialogTitle>
          <DialogDescription className="text-purple-300">
            Choose your preferred wallet to connect to SageChain
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => handleWalletSelect(wallet.name)}
              disabled={!wallet.installed || isConnecting}
              className={`w-full p-4 rounded-lg border transition-all text-left ${
                wallet.installed
                  ? selectedWallet === wallet.name && isConnecting
                    ? 'border-purple-600 bg-purple-600/20'
                    : 'border-purple-800/30 hover:border-purple-600/50 hover:bg-purple-600/10'
                  : 'border-slate-700 bg-slate-800/20 opacity-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium">{wallet.name}</h3>
                    {!wallet.installed && (
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">Not Installed</Badge>
                    )}
                    {selectedWallet === wallet.name && isConnecting && (
                      <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                    )}
                  </div>
                  <p className="text-sm text-purple-300 mt-1">{wallet.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-center text-slate-400 pt-4 border-t border-slate-700">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default WalletConnector;
