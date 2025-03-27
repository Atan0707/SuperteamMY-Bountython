'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAllDigitalAssetWithTokenByOwner } from '@metaplex-foundation/mpl-token-metadata';
import Link from 'next/link';

// Interface for the asset data structure that Metaplex returns
interface DigitalAsset {
  publicKey: { toString: () => string };
  metadata: {
    name: string;
    symbol?: string;
    uri: string;
  };
}

type NFTMetadata = {
  name: string;
  image: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  [key: string]: unknown;
};

type NFT = {
  address: string;
  name: string;
  symbol?: string;
  uri: string;
  image?: string;
  metadata?: NFTMetadata;
  loading?: boolean;
};

const NFTGallery = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const { publicKey: walletPublicKey, connected } = useWallet();
  const wallet = useWallet();

  useEffect(() => {
    if (connected && walletPublicKey) {
      fetchNFTs();
    } else {
      setNfts([]);
    }
  }, [connected, walletPublicKey]);

  const fetchNFTs = async () => {
    if (!walletPublicKey) return;
    
    setLoading(true);
    try {
      // Initialize UMI
      const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata());
      
      // Import necessary packages for wallet adapter
      const { walletAdapterIdentity } = await import('@metaplex-foundation/umi-signer-wallet-adapters');
      await umi.use(walletAdapterIdentity(wallet));
      
      // Fetch all NFTs owned by the connected wallet
      const ownerPublicKey = publicKey(walletPublicKey.toBase58());
      const assets = await fetchAllDigitalAssetWithTokenByOwner(umi, ownerPublicKey);
      
      // Initialize NFTs with basic data
      const initialNfts = assets.map((asset: DigitalAsset) => ({
        address: asset.publicKey.toString(),
        name: asset.metadata.name,
        symbol: asset.metadata.symbol || undefined,
        uri: asset.metadata.uri,
        loading: true
      }));
      
      setNfts(initialNfts);
      
      // Fetch metadata for each NFT
      const nftsWithMetadata = await Promise.all(
        initialNfts.map(async (nft: NFT) => {
          try {
            const response = await fetch(nft.uri);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            const metadata = await response.json();
            return {
              ...nft,
              metadata,
              image: metadata.image,
              loading: false
            };
          } catch (error) {
            console.error(`Error fetching metadata for ${nft.address}:`, error);
            return { ...nft, loading: false };
          }
        })
      );
      
      setNfts(nftsWithMetadata);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My NFT Collection</h1>
        <div className="flex gap-4">
          <WalletMultiButton />
          <Link href="/test" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
            Mint New NFT
          </Link>
        </div>
      </div>

      {!connected ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6">Connect your wallet to view your NFT collection</p>
          <WalletMultiButton />
        </div>
      ) : loading ? (
        <div className="text-center py-20">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your NFTs...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">No NFTs Found</h2>
          <p className="text-gray-600 mb-6">You don&apos;t have any NFTs in your wallet yet</p>
          <Link href="/test" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
            Mint Your First NFT
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <div key={nft.address} className="border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              {nft.loading ? (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                </div>
              ) : nft.image ? (
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={nft.image} 
                    alt={nft.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // If image fails to load, replace with placeholder
                      (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              
              <div className="p-4">
                <h3 className="font-bold text-lg truncate">{nft.name}</h3>
                {nft.symbol && <p className="text-gray-500 text-sm">{nft.symbol}</p>}
                <div className="mt-3 flex justify-between items-center">
                  <a 
                    href={`https://explorer.solana.com/address/${nft.address}?cluster=devnet`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:underline"
                  >
                    View on Explorer
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
