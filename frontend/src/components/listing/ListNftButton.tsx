'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { listNFT, WalletAdapter } from '@/lib/nft-showcase';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ListNftButtonProps {
  nft: {
    address: string;
    name: string;
    symbol?: string;
    uri: string;
    image?: string;
    metadata?: Record<string, unknown>;
  };
}

export function ListNftButton({ nft }: ListNftButtonProps) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connection } = useConnection();
  const wallet = useWallet();

  const handleList = async () => {
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    try {
      setIsSubmitting(true);
      // Convert SOL to lamports (1 SOL = 1e9 lamports)
      const priceInLamports = parseFloat(price) * 1_000_000_000;
      
      const result = await listNFT(
        wallet as WalletAdapter,
        connection,
        new PublicKey(nft.address),
        priceInLamports,
        nft.name,
        nft.symbol || null,
        nft.uri
      );

      if (result.success) {
        toast.success('NFT listed successfully!');
        setOpen(false);
      } else {
        toast.error('Failed to list NFT: ' + (typeof result.error === 'object' && result.error !== null && 'message' in result.error 
          ? (result.error as { message: string }).message 
          : 'Unknown error'));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Error listing NFT: ' + errorMessage);
      console.error('Error listing NFT:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="w-full bg-purple-600 hover:bg-purple-700 py-1 h-8 text-xs rounded-md flex items-center justify-center"
        size="sm"
      >
        Showcase NFT <ArrowUpRight className="ml-1 h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border border-purple-500">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Showcase NFT</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter the price you want to sell your NFT for.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-black/20">
                <img 
                  src={nft.image || "https://placehold.co/300x300?text=No+Image"} 
                  alt={nft.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://placehold.co/300x300?text=No+Image";
                  }}
                />
              </div>
              <div>
                <h3 className="font-medium text-white">{nft.name}</h3>
                {nft.symbol && <p className="text-sm text-gray-400">{nft.symbol}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right text-white">
                Price
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  SOL
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleList} 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Showcasing...
                </>
              ) : (
                'Showcase NFT'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 