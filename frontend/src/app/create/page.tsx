'use client';

import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NFTCreatorForm, WalletConnect } from '@/components/create';
import { showErrorToast } from '@/lib/toast';

const NFTCreator = () => {
  const { connected } = useWallet();

  useEffect(() => {
    const handleDisconnect = () => {
      if (!connected) {
        showErrorToast('Wallet disconnected. Please reconnect to continue.');
      }
    };

    // Listen for disconnect events
    window.addEventListener('beforeunload', handleDisconnect);
    return () => window.removeEventListener('beforeunload', handleDisconnect);
  }, [connected]);

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto p-4 md:p-6 pb-24">
          <div className="flex justify-between items-center mb-6 md:mb-8 pt-4 md:pt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Create NFT</h1>
            <div>
              <WalletMultiButton />
              {/* Portfolio link can be added here */}
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 md:p-6 text-white mb-16">
            {connected ? <NFTCreatorForm /> : <WalletConnect />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCreator;
