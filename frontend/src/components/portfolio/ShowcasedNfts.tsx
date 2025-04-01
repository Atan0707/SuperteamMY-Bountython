import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAllListings, formatPrice } from '@/lib/nft-showcase';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Tag, DollarSign, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CancelListingButton } from '@/components/listing/CancelListingButton';
import NFTDetailsDialog from '@/components/showcase/NFTDetailsDialog';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

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

export function ShowcasedNfts() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const [selectedListing, setSelectedListing] = useState<NFTListing | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
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
      try {
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
              showErrorToast(`Failed to fetch metadata for ${listing.account.nftName}`);
              return { ...listing, metadata: {}, image: undefined };
            }
          })
        );
        
        return listingsWithImages as NFTListing[];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        showErrorToast(`Failed to fetch NFT listings: ${errorMessage}`);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: true // Always fetch listings regardless of wallet connection
  });

  // Filter listings to show only those owned by the current wallet
  const myListings = connected && publicKey
    ? listings.filter(listing => 
        listing.account.seller.toString() === publicKey.toString())
    : [];

  const handleRefetch = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      showSuccessToast('NFT listings refreshed successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast(`Failed to refresh NFT listings: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!connected) {
    return null; // Don't show this section if wallet is not connected
  }

  if (isLoading) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-8 flex justify-center items-center min-h-[150px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500 mb-2" />
          <p className="text-gray-300 text-sm">Loading your listed NFTs...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-8 text-center">
        <p className="text-red-400 mb-3 text-sm">Failed to load your showcased NFTs</p>
        <Button 
          onClick={handleRefetch}
          variant="outline"
          size="sm"
          className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (myListings.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-8 text-center py-8">
        <h3 className="text-lg font-semibold mb-1">No NFTs Listed For Sale</h3>
        <p className="text-gray-300 text-sm mb-2">You don&apos;t have any NFTs currently showcased in the public</p>
      </div>
    );
  }

  const handleOpenDetails = (listing: NFTListing) => {
    setSelectedListing(listing);
    setDetailsOpen(true);
  };

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-lg font-semibold mb-1">Showcased NFTs</h2>
          <p className="text-gray-300 text-sm">NFTs you&apos;ve showcased in the public</p>
        </div>
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
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pb-8">
        {myListings.map(listing => (
          <div 
            key={listing.publicKey.toString()} 
            className="bg-gray-900/80 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/40 transition hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/20 max-w-full flex flex-col h-full"
          >
            <div className="aspect-square w-full relative overflow-hidden flex-shrink-0">
              <img 
                src={listing.image || "https://placehold.co/400x400?text=No+Image"} 
                alt={listing.account.nftName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                }}
              />
            </div>
            
            <div className="p-2 flex flex-col flex-grow">
              <h3 className="text-sm font-bold mb-0.5 truncate w-full">{listing.account.nftName}</h3>
              
              <div className="flex items-center gap-1 mb-1 text-xs text-gray-300">
                <Tag className="h-3 w-3 text-purple-400" />
                <span className="text-xs">{listing.account.nftSymbol || 'NFT'}</span>
              </div>
              
              {listing.metadata?.description ? (
                <p className="text-gray-300 text-xs mb-1 line-clamp-1 min-h-[1rem]">
                  {listing.metadata.description}
                </p>
              ) : (
                <div className="min-h-[1rem]"></div>
              )}
              
              <div className="flex items-center mb-2 text-xs">
                <DollarSign className="h-3 w-3 mr-0.5 text-purple-300" />
                <span className="font-semibold text-purple-300">
                  {formatPrice(listing.account.price.toString())} SOL
                </span>
              </div>
              
              <div className="mt-auto">
                <Button
                  onClick={() => handleOpenDetails(listing)}
                  className="w-full bg-purple-600 hover:bg-purple-700 py-0.5 h-6 text-xs rounded-md flex items-center justify-center mb-1"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View Details
                </Button>
                <CancelListingButton 
                  nftMint={listing.account.nftMint.toString()} 
                  isOwner={connected && publicKey?.toString() === listing.account.seller.toString()}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedListing && (
        <NFTDetailsDialog 
          listing={selectedListing}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
} 