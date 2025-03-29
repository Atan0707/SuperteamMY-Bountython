'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAllDigitalAssetWithTokenByOwner } from '@metaplex-foundation/mpl-token-metadata';
import Link from 'next/link';
import { Carousel } from '@/components/portfolio/carousel';

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

interface GalleryItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  image: string;
  address: string;
  symbol?: string;
  uri: string;
  metadata: NFTMetadata;
}

const Portfolio = () => {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [carouselItems, setCarouselItems] = useState<GalleryItem[]>([]);
  const { publicKey: walletPublicKey, connected } = useWallet();
  const wallet = useWallet();

  useEffect(() => {
    if (connected && walletPublicKey) {
      fetchNFTs();
    } else {
      setNfts([]);
      setCarouselItems([]);
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
      
      // Updated transformation to include all necessary NFT data for listing
      const items: GalleryItem[] = nftsWithMetadata.map((nft) => ({
        id: nft.address,
        title: nft.name,
        summary: nft.metadata?.description || `NFT ${nft.symbol || ''}`,
        url: `https://explorer.solana.com/address/${nft.address}?cluster=devnet`,
        image: nft.image || "https://placehold.co/300x300?text=No+Image",
        address: nft.address,
        symbol: nft.symbol,
        uri: nft.uri,
        metadata: nft.metadata as NFTMetadata
      }));
      
      setCarouselItems(items);
    } catch (error) {
      console.error('Error fetching NFTs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto p-6">
          <div className="flex justify-between items-center mb-8 pt-6">
            <h1 className="text-3xl font-bold text-white">My NFT Portfolio</h1>
            <div className="flex gap-4">
              <WalletMultiButton />
              <Link href="/showcase" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                NFT Marketplace
              </Link>
            </div>
          </div>

          {!connected ? (
            <div className="text-center py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-2xl font-semibold mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-gray-200 mb-6">Connect your wallet to view your NFT collection</p>
              <WalletMultiButton />
            </div>
          ) : loading ? (
            <div className="text-center py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-200">Loading your NFTs...</p>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-2xl font-semibold mb-4 text-white">No NFTs Found</h2>
              <p className="text-gray-200 mb-6">You don&apos;t have any NFTs in your wallet yet</p>
              <Link href="/test" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                Mint Your First NFT
              </Link>
            </div>
          ) : (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white">
              {carouselItems.length > 0 && (
                <Carousel
                  heading="My NFT Collection"
                  demoUrl="/test"
                  items={carouselItems}
                  showListButton={true}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
