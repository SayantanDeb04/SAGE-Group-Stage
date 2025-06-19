import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// ✅ NEW: import wallet connector and types
import WalletConnector, { WalletData } from "@/components/WalletConnector";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ContractUI from "./components/ContractUI";
import SwapPanel from "./components/SwapPanel";
import BuySage from "./BuySage";
import SellSage from "./SellSage";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  // ✅ NEW: parent-level wallet connection state
  const [walletInfo, setWalletInfo] = useState<WalletData | null>(null);

  if (!isAuthenticated) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 p-6">
      {/* ✅ NEW: integrate WalletConnector into header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-purple-800">
            SageChain DeFi Platform
          </h1>
          <p className="text-gray-600 mt-2">
            Buy Sage tokens easily using MetaMask
          </p>
        </div>
        <WalletConnector
          isConnected={!!walletInfo}
          onConnect={(walletData) => setWalletInfo(walletData)}
          onDisconnect={() => setWalletInfo(null)}
        />
      </header>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/contract" element={<ContractUI />} />
          <Route path="/swap" element={<SwapPanel />} />
          <Route path="/buy" element={<BuySage />} />
          <Route path="/sell" element={<SellSage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <footer className="text-center mt-10 text-sm text-gray-400">
        © {new Date().getFullYear()} SageChain. All rights reserved.
      </footer>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
