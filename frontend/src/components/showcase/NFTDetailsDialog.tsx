import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ExternalLink, Tag, User, DollarSign, List } from 'lucide-react';
import { formatPrice } from '@/lib/nft-showcase';
import { NFTListing } from './NFTTypes';

interface NFTDetailsDialogProps {
  listing: NFTListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NFTDetailsDialog: React.FC<NFTDetailsDialogProps> = ({
  listing,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border border-purple-500">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{listing.account.nftName}</DialogTitle>
          <DialogDescription className="text-gray-400">
            NFT Details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-1/2 rounded-md overflow-hidden bg-black/20">
              <img 
                src={listing.image || "https://placehold.co/400x400?text=No+Image"} 
                alt={listing.account.nftName} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                }}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <div className="flex items-center gap-1 mb-3">
                <Tag className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">{listing.account.nftSymbol || 'NFT'}</span>
              </div>
              
              {listing.metadata?.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-gray-300 text-sm">
                    {listing.metadata.description}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-purple-300" />
                <span className="font-semibold text-purple-300">
                  {formatPrice(parseInt(listing.account.price.toString()))} SOL
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-purple-300" />
                <span className="text-sm text-gray-300">Seller:</span>
                <span className="text-xs text-gray-400">
                  {listing.account.seller.toString().slice(0, 4)}...{listing.account.seller.toString().slice(-4)}
                </span>
              </div>
              
              {listing.metadata?.attributes && listing.metadata.attributes.length > 0 && (
                <div className="space-y-2">
                  {listing.metadata.attributes.map((attr, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <List className="h-4 w-4 text-purple-300" />
                      <span className="text-sm text-gray-300">{attr.trait_type}:</span>
                      <span className="text-sm text-white">{attr.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-2">
            <a 
              href={`https://explorer.solana.com/address/${listing.account.nftMint.toString()}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer" 
              className="w-full bg-purple-600 hover:bg-purple-700 py-1.5 h-9 text-sm rounded-md flex items-center justify-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Solana Explorer
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFTDetailsDialog; 