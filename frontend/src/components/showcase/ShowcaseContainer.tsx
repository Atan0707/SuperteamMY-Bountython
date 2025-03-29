import React from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAllListings, buyNft, WalletAdapter } from '@/lib/nft-showcase';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ShowcaseHeader from './ShowcaseHeader';
import NFTGrid from './NFTGrid';
// import TransactionHistory from './TransactionHistory';
import { NFTListing, BuyResult } from './NFTTypes';
 
const ShowcaseContainer: React.FC = () => {
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
    mutationFn: async (listing: NFTListing): Promise<BuyResult> => {
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
          <ShowcaseHeader 
            title="Showcase" 
            description="Browse and buy unique NFTs listed by other creators" 
            onRefresh={refetch} 
          />
          
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white">
            <NFTGrid 
              listings={listings}
              isLoading={isLoading}
              isError={isError}
              onBuy={handleBuyNft}
              onRefresh={refetch}
              isPending={buyNftMutation.isPending}
              pendingId={buyNftMutation.variables?.publicKey.toString()}
            />
          </div>
          
          {/* <TransactionHistory /> */}
        </div>
      </div>
    </div>
  );
};

export default ShowcaseContainer; 