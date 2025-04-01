'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { fetchAllDigitalAssetWithTokenByOwner } from '@metaplex-foundation/mpl-token-metadata';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Tag, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShowcasedNfts } from '@/components/portfolio/ShowcasedNfts';
import { ListNftButton } from '@/components/listing/ListNftButton';
import NFTDetailsDialog from '@/components/portfolio/NFTDetailsDialog';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

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
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const handleOpenDetails = (nft: NFT) => {
    setSelectedNft(nft);
    setDetailsOpen(true);
  };

  const handleRefetch = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      showSuccessToast('NFT collection refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast(`Failed to refresh NFT collection: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 pb-24">
          <div className="flex justify-between items-center mb-4 pt-2 sm:pt-4">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Portfolio</h1>
            <div>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-1.5 !px-3 !text-xs !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
            </div>
          </div>

          {!connected ? (
            <div className="text-center py-8 md:py-12 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-white">Connect Your Wallet</h2>
              <p className="text-gray-200 text-sm mb-4 md:mb-5">Connect your wallet to view your NFT collection</p>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-1.5 !px-3 !text-xs !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
            </div>
          ) : isLoading ? (
            <div className="text-center py-8 md:py-12 bg-black/30 backdrop-blur-md rounded-xl">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-3 text-gray-200 text-sm">Loading your NFTs...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8 md:py-12 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-red-400">Error Loading NFTs</h2>
              <p className="text-gray-200 text-sm mb-4 md:mb-5">There was an error loading your NFT collection</p>
              <Button 
                onClick={() => refetch()}
                className="bg-purple-600 hover:bg-purple-700 text-xs py-0.5 h-7"
              >
                Try Again
              </Button>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-8 md:py-12 bg-black/30 backdrop-blur-md rounded-xl">
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3 text-white">No NFTs Found</h2>
              <p className="text-gray-200 text-sm mb-4 md:mb-5">You don&apos;t have any NFTs in your wallet yet</p>
              <Link href="/create" className="inline-flex items-center px-4 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg shadow-md hover:bg-purple-700">
                Mint Your First NFT
              </Link>
            </div>
          ) : (
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-8">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold mb-1">My NFT Collection</h2>
                  <p className="text-gray-300 text-sm">Browse your owned NFTs</p>
                </div>
                <Button 
                  onClick={handleRefetch} 
                  variant="outline" 
                  size="sm"
                  disabled={isRefreshing}
                  className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white h-8 px-2 text-xs cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
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
                    
                    <div className="p-2 flex flex-col flex-grow">
                      <h3 className="text-sm font-bold mb-0.5 truncate w-full">{nft.name}</h3>
                      
                      <div className="flex items-center gap-1 mb-1 text-xs text-gray-300">
                        <Tag className="h-3 w-3 text-purple-400" />
                        <span className="text-xs">{nft.symbol || 'NFT'}</span>
                      </div>
                      
                      {nft.metadata?.description ? (
                        <p className="text-gray-300 text-xs mb-1 line-clamp-1 min-h-[1rem]">
                          {nft.metadata.description}
                        </p>
                      ) : (
                        <div className="min-h-[1rem]"></div>
                      )}
                      
                      <div className="mt-auto">
                        <Button 
                          onClick={() => handleOpenDetails(nft)}
                          className="w-full bg-purple-600 hover:bg-purple-700 py-0.5 h-6 text-xs rounded-md flex items-center justify-center mb-1"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Details
                        </Button>
                        
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
      
      {selectedNft && (
        <NFTDetailsDialog 
          nft={selectedNft}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
};

export default Portfolio;
