import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnect: React.FC = () => (
  <div className="text-center py-12 md:py-20">
    <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-white">Connect Your Wallet</h2>
    <p className="text-gray-300 mb-5 md:mb-6">Connect your wallet to create an amazing NFT</p>
    <WalletMultiButton />
  </div>
); 