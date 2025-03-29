import React from 'react';
import NFTCard from './NFTCard';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import EmptyState from './EmptyState';
import { NFTListing } from './NFTTypes';

interface NFTGridProps {
  listings: NFTListing[];
  isLoading: boolean;
  isError: boolean;
  onBuy: (listing: NFTListing) => void;
  onRefresh: () => void;
  isPending: boolean;
  pendingId?: string;
}

const NFTGrid: React.FC<NFTGridProps> = ({
  listings,
  isLoading,
  isError,
  onBuy,
  onRefresh,
  isPending,
  pendingId
}) => {
  if (isLoading) {
    return <LoadingState message="Loading NFTs..." />;
  }

  if (isError) {
    return <ErrorState message="Error Loading NFTs" description="There was an error loading the NFT listings." onRetry={onRefresh} />;
  }

  if (listings.length === 0) {
    return <EmptyState 
      title="No NFTs Currently Listed" 
      description="Be the first to list your NFTs for sale!" 
      buttonText="Go to My Portfolio"
      buttonLink="/portfolio"
    />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
      {listings.map((listing) => (
        <NFTCard 
          key={listing.publicKey.toString()} 
          listing={listing}
          onBuy={onBuy}
          isPending={isPending}
          pendingId={pendingId}
        />
      ))}
    </div>
  );
};

export default NFTGrid; 