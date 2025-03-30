import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { ExternalLink, Tag, List } from 'lucide-react';

interface NFT {
  address: string;
  name: string;
  symbol?: string;
  uri: string;
  image?: string;
  metadata?: {
    description?: string;
    attributes?: Array<{ trait_type: string; value: string }>;
    [key: string]: unknown;
  };
}

interface NFTDetailsDialogProps {
  nft: NFT;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NFTDetailsDialog: React.FC<NFTDetailsDialogProps> = ({
  nft,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white border border-purple-500">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">{nft.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            NFT Details
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-full sm:w-1/2 rounded-md overflow-hidden bg-black/20">
              <img 
                src={nft.image || "https://placehold.co/400x400?text=No+Image"} 
                alt={nft.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=No+Image";
                }}
              />
            </div>
            <div className="w-full sm:w-1/2">
              <div className="flex items-center gap-1 mb-3">
                <Tag className="h-4 w-4 text-purple-400" />
                <span className="text-sm text-gray-300">{nft.symbol || 'NFT'}</span>
              </div>
              
              {nft.metadata?.description && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-gray-300 text-sm">
                    {nft.metadata.description}
                  </p>
                </div>
              )}
              
              {nft.metadata?.attributes && nft.metadata.attributes.length > 0 && (
                <div className="space-y-2">
                  {nft.metadata.attributes.map((attr, index) => (
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
              href={`https://explorer.solana.com/address/${nft.address}?cluster=devnet`}
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