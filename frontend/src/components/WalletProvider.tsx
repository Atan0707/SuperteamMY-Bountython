'use client';

import { FC, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Import the wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextProviderProps {
  children: ReactNode;
}

// Create a dynamic component that only renders on the client
const WalletProviderComponent = dynamic(
  async () => {
    const { ConnectionProvider, WalletProvider } = await import('@solana/wallet-adapter-react');
    const { WalletAdapterNetwork } = await import('@solana/wallet-adapter-base');
    const { PhantomWalletAdapter, SolflareWalletAdapter } = await import('@solana/wallet-adapter-wallets');
    const { WalletModalProvider } = await import('@solana/wallet-adapter-react-ui');
    const { clusterApiUrl } = await import('@solana/web3.js');
    const { useMemo } = await import('react');

    return function ClientWalletProvider({ children }: WalletContextProviderProps) {
      // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
      const network = WalletAdapterNetwork.Devnet;

      // You can also provide a custom RPC endpoint
      const endpoint = useMemo(() => clusterApiUrl(network), [network]);

      // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking
      // so that only the wallets you configure are bundled
      const wallets = useMemo(
        () => [
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
        ],
        [network]
      );

      return (
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
    };
  },
  { ssr: false }
);

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  return <WalletProviderComponent>{children}</WalletProviderComponent>;
}; 