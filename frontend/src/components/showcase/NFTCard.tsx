import React from 'react';
import { formatPrice } from '@/lib/nft-showcase';
import { Loader2, Tag, DollarSign, User, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTListing } from './NFTTypes';

interface NFTCardProps {
  listing: NFTListing;
  onBuy: (listing: NFTListing) => void;
  isPending: boolean;
  pendingId?: string;
}

const NFTCard: React.FC<NFTCardProps> = ({ 
  listing, 
  onBuy, 
  isPending, 
  pendingId 
}) => {
  const isPendingThis = isPending && pendingId === listing.publicKey.toString();
  
  return (
    <div 
      className="bg-gray-900/80 backdrop-blur-md rounded-lg overflow-hidden border border-purple-500/40 transition hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/20 max-w-full flex flex-col h-full"
    >
      <div className="aspect-square w-full relative overflow-hidden flex-shrink-0">
        {isPendingThis ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
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
        
        <div className="flex items-center justify-between mb-2 mt-auto">
          <div className="flex items-center text-purple-300 max-w-[50%]">
            <User className="h-3 w-3 mr-0.5 flex-shrink-0" />
            <a 
              href={`https://explorer.solana.com/address/${listing.account.seller.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer" 
              className="text-xs truncate hover:text-purple-200 hover:underline"
            >
              {listing.account.seller.toString().slice(0, 4)}...{listing.account.seller.toString().slice(-4)}
            </a>
          </div>
          
          <div className="flex items-center bg-purple-500/20 px-1.5 py-0.5 rounded-full max-w-[50%]">
            <DollarSign className="h-3 w-3 mr-0.5 text-purple-300 flex-shrink-0" />
            <span className="text-xs font-semibold text-white truncate">
              {formatPrice(parseInt(listing.account.price.toString()))} SOL
            </span>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1">
          <a 
            href={`https://explorer.solana.com/address/${listing.account.nftMint.toString()}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer" 
            className="w-full bg-purple-600 hover:bg-purple-700 py-0.5 h-6 text-xs rounded-md flex items-center justify-center"
          >
            <ExternalLink className="mr-1 h-3 w-3" />
            View Details
          </a>
          
          <Button 
            onClick={() => onBuy(listing)}
            disabled={isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 py-0.5 h-6 text-xs"
          >
            {isPendingThis ? (
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
    </div>
  );
};

export default NFTCard; 