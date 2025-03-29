'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAllDigitalAssetWithTokenByOwner } from '@metaplex-foundation/mpl-token-metadata';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Tag, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcasedNfts } from '@/components/portfolio/ShowcasedNfts';
import { ListNftButton } from '@/components/listing/ListNftButton';

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
};

const Portfolio = () => {
  const { publicKey: walletPublicKey, connected } = useWallet();
  const wallet = useWallet();

  // Use React Query to fetch and cache NFTs
  const { 
    data: nfts = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['nfts', walletPublicKey?.toString()],
    queryFn: async () => {
      if (!walletPublicKey) {
        return [];
      }
      
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
          uri: asset.metadata.uri
        }));
        
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
                image: metadata.image
              };
            } catch (error) {
              console.error(`Error fetching metadata for ${nft.address}:`, error);
              return { ...nft };
            }
          })
        );
        
        return nftsWithMetadata;
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        throw error;
      }
    },
    enabled: connected && !!walletPublicKey,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto p-4 md:p-6 pb-24">
          <div className="flex justify-between items-center mb-6 md:mb-8 pt-4 md:pt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Portfolio</h1>
            <div>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-2 !px-4 !text-sm !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
            </div>
          </div>

          {!connected ? (
            <div className="text-center py-12 md:py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-white">Connect Your Wallet</h2>
              <p className="text-gray-200 mb-5 md:mb-6">Connect your wallet to view your NFT collection</p>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-2 !px-4 !text-sm !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
            </div>
          ) : isLoading ? (
            <div className="text-center py-12 md:py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-200">Loading your NFTs...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 md:py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-red-400">Error Loading NFTs</h2>
              <p className="text-gray-200 mb-5 md:mb-6">There was an error loading your NFT collection</p>
              <Button 
                onClick={() => refetch()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Try Again
              </Button>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12 md:py-20 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-white">No NFTs Found</h2>
              <p className="text-gray-200 mb-5 md:mb-6">You don&apos;t have any NFTs in your wallet yet</p>
              <Link href="/create" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                Mint Your First NFT
              </Link>
            </div>
          ) : (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 md:p-6 text-white mb-16">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold">My NFT Collection</h2>
                  <p className="text-gray-300 text-sm">Browse your owned NFTs</p>
                </div>
                <Button 
                  onClick={() => refetch()} 
                  variant="outline" 
                  size="sm"
                  className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                {nfts.map((nft) => (
                  <div 
                    key={nft.address} 
                    className="bg-gray-900/80 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/40 transition hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/20 max-w-full flex flex-col h-full"
                  >
                    <div className="aspect-square w-full relative overflow-hidden flex-shrink-0">
                      <img 
                        src={nft.image || "https://placehold.co/400x400?text=No+Image"} 
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                        }}
                      />
                    </div>
                    
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-base font-bold mb-1 truncate w-full">{nft.name}</h3>
                      
                      <div className="flex items-center gap-1 mb-2 text-xs text-gray-300">
                        <Tag className="h-3 w-3 text-purple-400" />
                        <span>{nft.symbol || 'NFT'}</span>
                      </div>
                      
                      {nft.metadata?.description ? (
                        <p className="text-gray-300 text-xs mb-2 line-clamp-2 min-h-[2rem]">
                          {nft.metadata.description}
                        </p>
                      ) : (
                        <div className="min-h-[2rem]"></div>
                      )}
                      
                      <div className="mt-auto">
                        <a 
                          href={`https://explorer.solana.com/address/${nft.address}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer" 
                          className="w-full bg-purple-600 hover:bg-purple-700 py-1 h-8 text-xs rounded-md flex items-center justify-center mb-2"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Details
                        </a>
                        
                        <ListNftButton 
                          nft={{
                            address: nft.address,
                            name: nft.name,
                            symbol: nft.symbol,
                            uri: nft.uri,
                            image: nft.image,
                            metadata: nft.metadata
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add the ShowcasedNfts component only if the user is connected */}
          {connected && (
            <>
              <div className="text-center text-gray-300 text-sm mb-8">
                To showcase your NFTs in the public marketplace, click the <span className="text-purple-400 font-medium">&quot;Showcase NFT&quot;</span> button on any NFT above.
              </div>
              <ShowcasedNfts />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
