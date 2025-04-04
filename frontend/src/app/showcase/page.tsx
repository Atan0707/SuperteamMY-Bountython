'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAllListings, buyNft, WalletAdapter } from '@/lib/nft-showcase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { NFTGrid, NFTListing, BuyResult } from '@/components/showcase';
// import { Toaster } from 'sonner';
// import { TransactionHistory } from '@/components/showcase';

const Showcase = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { connected } = wallet;
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    mutationFn: async (listing: NFTListing): Promise<BuyResult> => {
      return await buyNft(
        wallet as WalletAdapter,
        connection,
        listing.account.nftMint
      );
    },
    onMutate: () => {
      return toast.loading('Processing your purchase...');
    },
    onSuccess: (result, _, loadingToastId) => {
      toast.dismiss(loadingToastId);
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
    onError: (error: unknown, _, loadingToastId) => {
      toast.dismiss(loadingToastId);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error purchasing NFT: ' + errorMessage);
      console.error('Error purchasing NFT:', error);
    }
  });

  const handleRefetch = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      toast.success('NFT listings refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to refresh NFT listings: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
    }
  };

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
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-row justify-between items-center mb-4 pt-2 sm:pt-4 gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Showcase</h1>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefetch} 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white h-8 px-2 text-xs cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isRefreshing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <WalletMultiButton />
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold mb-1">Available NFTs for Purchase</h2>
                <p className="text-gray-300 text-sm">Browse and buy unique NFTs listed by other creators</p>
              </div>
            </div>
            
            <NFTGrid 
              listings={listings}
              isLoading={isLoading}
              isError={isError}
              onBuy={handleBuyNft}
              onRefresh={handleRefetch}
              isPending={buyNftMutation.isPending}
              pendingId={buyNftMutation.variables?.account.nftMint.toString()}
            />
          </div>
          
          {/* 
            Transaction history is currently disabled
            To enable, uncomment the line below and import TransactionHistory 
            from '@/components/showcase'
          */}
          {/* <TransactionHistory /> */}
        </div>
      </div>
    </div>
  );
};

export default Showcase;