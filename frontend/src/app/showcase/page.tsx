'use client';

import React from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { getAllListings, formatPrice, buyNft, WalletAdapter } from '@/lib/nft-showcase';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Tag, DollarSign, User, ShoppingCart, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface NFTListing {
  publicKey: PublicKey;
  account: {
    seller: PublicKey;
    nftMint: PublicKey;
    price: { toString: () => string };
    nftName: string;
    nftSymbol: string;
    nftUri: string;
    isActive: boolean;
  };
  metadata?: {
    image?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    description?: string;
  };
  image?: string;
}

const Showcase = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected } = wallet;
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache listings
  const { 
    data: listings = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['nftListings'],
    queryFn: async () => {
      // Get all active listings from the program
      const nftListings = await getAllListings(connection);
      
      // Fetch metadata for each listing
      const listingsWithImages = await Promise.all(
        nftListings.map(async (listing) => {
          try {
            const response = await fetch(listing.account.nftUri);
            if (!response.ok) throw new Error('Failed to fetch metadata');
            const metadata = await response.json();
            return {
              ...listing,
              metadata,
              image: metadata.image as string,
            };
          } catch (error) {
            console.error(`Error fetching metadata for ${listing.account.nftName}:`, error);
            return { ...listing, metadata: {}, image: undefined };
          }
        })
      );
      
      return listingsWithImages as NFTListing[];
    },
  });

  // Use mutation for buying NFTs
  const buyNftMutation = useMutation({
    mutationFn: async (listing: NFTListing) => {
      return await buyNft(
        wallet as WalletAdapter,
        connection,
        listing.account.nftMint
      );
    },
    onMutate: () => {
      toast.loading('Processing your purchase...');
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success('NFT purchased successfully!');
        // Refresh listings
        queryClient.invalidateQueries({ queryKey: ['nftListings'] });
      } else {
        toast.error('Failed to purchase NFT: ' + (typeof result.error === 'object' && result.error !== null && 'message' in result.error 
          ? (result.error as { message: string }).message 
          : 'Unknown error'));
      }
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error purchasing NFT: ' + errorMessage);
      console.error('Error purchasing NFT:', error);
    }
  });

  const handleBuyNft = (listing: NFTListing) => {
    if (!connected) {
      toast.error('Please connect your wallet to purchase NFTs');
      return;
    }
    
    buyNftMutation.mutate(listing);
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-row justify-between items-center mb-8 pt-4 sm:pt-6 gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Showcase</h1>
            <div>
              <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-2 !px-4 !text-sm !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Available NFTs for Purchase</h2>
                <p className="text-gray-300">Browse and buy unique NFTs listed by other creators</p>
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

            {isLoading ? (
              <div className="text-center py-20">
                <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
                <p className="mt-4 text-gray-200">Loading NFTs...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-medium mb-4 text-red-400">Error Loading NFTs</h3>
                <p className="text-gray-300 mb-6">There was an error loading the NFT listings.</p>
                <Button 
                  onClick={() => refetch()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Try Again
                </Button>
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-medium mb-4">No NFTs Currently Listed</h3>
                <p className="text-gray-300 mb-6">Be the first to list your NFTs for sale!</p>
                <Link href="/portfolio" className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                  Go to My Portfolio
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                {listings.map((listing) => (
                  <div 
                    key={listing.publicKey.toString()} 
                    className="bg-gray-900/80 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/40 transition hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/20 max-w-full flex flex-col h-full"
                  >
                    <div className="aspect-square w-full relative overflow-hidden flex-shrink-0">
                      {buyNftMutation.isPending && buyNftMutation.variables?.publicKey.toString() === listing.publicKey.toString() ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
                        </div>
                      ) : (
                        <img 
                          src={listing.image || "https://placehold.co/400x400?text=No+Image"} 
                          alt={listing.account.nftName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                          }}
                        />
                      )}
                    </div>
                    
                    <div className="p-3 flex flex-col flex-grow">
                      <h3 className="text-base font-bold mb-1 truncate w-full">{listing.account.nftName}</h3>
                      
                      <div className="flex items-center gap-1 mb-2 text-xs text-gray-300">
                        <Tag className="h-3 w-3 text-purple-400" />
                        <span>{listing.account.nftSymbol || 'NFT'}</span>
                      </div>
                      
                      {listing.metadata?.description ? (
                        <p className="text-gray-300 text-xs mb-2 line-clamp-2 min-h-[2rem]">
                          {listing.metadata.description}
                        </p>
                      ) : (
                        <div className="min-h-[2rem]"></div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3 mt-auto">
                        <div className="flex items-center text-purple-300 max-w-[50%]">
                          <User className="h-3 w-3 mr-1 flex-shrink-0" />
                          <a 
                            href={`https://explorer.solana.com/address/${listing.account.seller.toString()}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-xs truncate hover:text-purple-200 hover:underline"
                          >
                            {listing.account.seller.toString().slice(0, 4)}...{listing.account.seller.toString().slice(-4)}
                          </a>
                        </div>
                        
                        <div className="flex items-center bg-purple-500/20 px-2 py-0.5 rounded-full max-w-[50%]">
                          <DollarSign className="h-3 w-3 mr-1 text-purple-300 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white truncate">
                            {formatPrice(parseInt(listing.account.price.toString()))} SOL
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handleBuyNft(listing)}
                        disabled={!connected || buyNftMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700 py-1 h-8 text-xs mt-auto"
                      >
                        {buyNftMutation.isPending && buyNftMutation.variables?.publicKey.toString() === listing.publicKey.toString() ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="mr-1 h-3 w-3" />
                            Buy Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Showcase;