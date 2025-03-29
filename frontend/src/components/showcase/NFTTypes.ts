import { PublicKey } from '@solana/web3.js';

export interface NFTListing {
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

export interface BuyResult {
  success: boolean;
  error?: Error | string | unknown;
} 