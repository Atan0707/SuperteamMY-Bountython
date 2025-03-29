import React from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAllListings, formatPrice } from '@/lib/nft-showcase';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, Tag, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CancelListingButton } from '@/components/listing/CancelListingButton';

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled: true // Always fetch listings regardless of wallet connection
  });

  // Filter listings to show only those owned by the current wallet
  const myListings = connected && publicKey
    ? listings.filter(listing => 
        listing.account.seller.toString() === publicKey.toString())
    : [];

  if (!connected) {
    return null; // Don't show this section if wallet is not connected
  }

  if (isLoading) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white mb-16 flex justify-center items-center min-h-[200px]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
          <p className="text-gray-300">Loading your listed NFTs...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white mb-16 text-center">
        <p className="text-red-400 mb-4">Failed to load your showcased NFTs</p>
        <Button 
          onClick={() => refetch()}
          variant="outline" 
          size="sm"
          className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    );
  }

  if (myListings.length === 0) {
    return (
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white mb-16 text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No NFTs Listed For Sale</h3>
        <p className="text-gray-300 mb-4">You don&apos;t have any NFTs currently showcased in the public</p>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 md:p-6 text-white mb-16">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold">Showcased NFTs</h2>
          <p className="text-gray-300 text-sm">NFTs you&apos;ve showcased in the public</p>
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
        {myListings.map((listing) => (
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
              
              <div className="flex items-center mb-3 text-xs">
                <DollarSign className="h-3 w-3 mr-1 text-purple-300" />
                <span className="font-semibold text-purple-300">
                  {formatPrice(listing.account.price.toString())} SOL
                </span>
              </div>
              
              <div className="mt-auto">
                <CancelListingButton 
                  nftMint={listing.account.nftMint.toString()} 
                  isOwner={connected && publicKey?.toString() === listing.account.seller.toString()}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 