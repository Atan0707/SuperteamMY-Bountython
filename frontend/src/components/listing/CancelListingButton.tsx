import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelListing, WalletAdapter } from '@/lib/nft-showcase';
import { useQueryClient } from '@tanstack/react-query';

interface CancelListingButtonProps {
  nftMint: string;
  isOwner?: boolean;
}

export function CancelListingButton({ nftMint, isOwner = true }: CancelListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connection } = useConnection();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  // Only show button if the wallet is connected and is the owner
  if (!wallet.connected || !isOwner) {
    return null;
  }

  const handleCancelListing = async () => {
    try {
      setIsSubmitting(true);
      
      const result = await cancelListing(
        wallet as WalletAdapter,
        connection,
        new PublicKey(nftMint)
      );

      if (result.success) {
        toast.success('Listing cancelled successfully!');
        setOpen(false);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['nftListings'] });
        queryClient.invalidateQueries({ queryKey: ['nfts'] });
      } else {
        toast.error('Failed to cancel listing: ' + (typeof result.error === 'object' && result.error !== null && 'message' in result.error 
          ? (result.error as { message: string }).message 
          : 'Unknown error'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error cancelling listing: ' + errorMessage);
      console.error('Error cancelling listing:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="destructive"
        size="sm"
        className="w-full bg-red-600 hover:bg-red-700 py-0.5 h-6 text-xs rounded-md flex items-center justify-center"
      >
        <X className="mr-1 h-3 w-3" /> Cancel Listing
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Cancel NFT Listing</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel this listing? Your NFT will be returned to your wallet.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              No, Keep Listed
            </Button>
            <Button 
              onClick={handleCancelListing} 
              disabled={isSubmitting}
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel Listing'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 