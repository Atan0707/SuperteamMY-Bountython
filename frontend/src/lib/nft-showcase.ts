import * as anchor from '@coral-xyz/anchor';
import { PublicKey, Commitment, Connection } from '@solana/web3.js';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import idl from '../idl/nft_showcase.json';

export const NFT_SHOWCASE_PROGRAM_ID = new PublicKey(idl.address);

export type WalletAdapter = AnchorWallet & {
  signTransaction: (transaction: anchor.web3.Transaction) => Promise<anchor.web3.Transaction>;
  signAllTransactions: (transactions: anchor.web3.Transaction[]) => Promise<anchor.web3.Transaction[]>;
};

// Define types for the NFT listing account
interface NftListingAccount {
  seller: PublicKey;
  nftMint: PublicKey;
  price: anchor.BN;
  nftName: string;
  nftSymbol: string;
  nftUri: string;
  isActive: boolean;
}

interface NftListingAccountWithPubkey {
  publicKey: PublicKey;
  account: NftListingAccount;
}

type NftListingAccountNamespace = {
  fetch: (address: PublicKey) => Promise<NftListingAccount>;
  all: () => Promise<NftListingAccountWithPubkey[]>;
};

export async function listNFT(
  wallet: WalletAdapter, 
  connection: Connection,
  nftMint: PublicKey, 
  price: number,
  nftName: string,
  nftSymbol: string | null,
  nftUri: string
) {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' as Commitment }
    );

    const program = new anchor.Program(
      idl as anchor.Idl,
      // NFT_SHOWCASE_PROGRAM_ID,
      provider
    );

    // PDA for listing
    const [listingPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing'),
        nftMint.toBuffer()
      ],
      program.programId
    );

    // Get the seller's token account for this NFT
    const sellerTokenAccount = anchor.utils.token.associatedAddress({
      mint: nftMint,
      owner: wallet.publicKey
    });

    // Get the escrow token account
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [
        listingPda.toBuffer(),
        Buffer.from([6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169]),
        nftMint.toBuffer()
      ],
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    );

    const tx = await program.methods
      .listNft(
        new anchor.BN(price),
        nftName,
        nftSymbol ? nftSymbol : null,
        nftUri
      )
      .accounts({
        seller: wallet.publicKey,
        nftMint,
        sellerNftAccount: sellerTokenAccount,
        escrowNftAccount: escrowTokenAccount,
        listing: listingPda,
        metadataProgram: new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    return { success: true, txid: tx };
  } catch (error) {
    console.error('Error listing NFT:', error);
    return { success: false, error };
  }
}

export async function cancelListing(
  wallet: WalletAdapter,
  connection: Connection,
  nftMint: PublicKey
) {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' as Commitment }
    );

    const program = new anchor.Program(
      idl as anchor.Idl,
      // NFT_SHOWCASE_PROGRAM_ID,
      provider
    );

    // PDA for listing
    const [listingPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing'),
        nftMint.toBuffer()
      ],
      program.programId
    );

    // Get the seller's token account for this NFT
    const sellerTokenAccount = anchor.utils.token.associatedAddress({
      mint: nftMint,
      owner: wallet.publicKey
    });

    // Get the escrow token account
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [
        listingPda.toBuffer(),
        Buffer.from([6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169]),
        nftMint.toBuffer()
      ],
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    );

    const tx = await program.methods
      .cancelListing()
      .accounts({
        seller: wallet.publicKey,
        listing: listingPda,
        nftMint,
        escrowNftAccount: escrowTokenAccount,
        sellerNftAccount: sellerTokenAccount,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    return { success: true, txid: tx };
  } catch (error) {
    console.error('Error canceling listing:', error);
    return { success: false, error };
  }
}

export async function buyNft(
  wallet: WalletAdapter,
  connection: Connection,
  nftMint: PublicKey
) {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const provider = new anchor.AnchorProvider(
      connection,
      wallet,
      { commitment: 'processed' as Commitment }
    );

    const program = new anchor.Program(
      idl as anchor.Idl,
      // NFT_SHOWCASE_PROGRAM_ID,
      provider
    );

    // PDA for listing
    const [listingPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('listing'),
        nftMint.toBuffer()
      ],
      program.programId
    );

    // Get the listing data to find the seller
    const listingData = await (program.account as { nftListing: NftListingAccountNamespace }).nftListing.fetch(listingPda);
    const sellerWallet = listingData.seller;

    // Get the buyer's token account for this NFT
    const buyerTokenAccount = anchor.utils.token.associatedAddress({
      mint: nftMint,
      owner: wallet.publicKey
    });

    // Get the escrow token account
    const [escrowTokenAccount] = PublicKey.findProgramAddressSync(
      [
        listingPda.toBuffer(),
        Buffer.from([6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169]),
        nftMint.toBuffer()
      ],
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    );

    const tx = await program.methods
      .buyNft()
      .accounts({
        buyer: wallet.publicKey,
        listing: listingPda,
        sellerWallet,
        escrowNftAccount: escrowTokenAccount,
        buyerNftAccount: buyerTokenAccount,
        nftMint,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    
    return { success: true, txid: tx };
  } catch (error) {
    console.error('Error buying NFT:', error);
    return { success: false, error };
  }
}

// Get all NFT listings
export async function getAllListings(connection: Connection) {
  try {
    const dummyWallet = {
      publicKey: new PublicKey('11111111111111111111111111111111'),
      signTransaction: async () => { throw new Error('Not implemented'); },
      signAllTransactions: async () => { throw new Error('Not implemented'); }
    };

    const provider = new anchor.AnchorProvider(
      connection,
      dummyWallet,
      { commitment: 'processed' as Commitment }
    );

    const program = new anchor.Program(
      idl as anchor.Idl,
      // NFT_SHOWCASE_PROGRAM_ID,
      provider
    );

    // Fetch all accounts of type NftListing
    const listings = await (program.account as { nftListing: NftListingAccountNamespace }).nftListing.all();
    return listings.filter((listing: NftListingAccountWithPubkey) => listing.account.isActive);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return [];
  }
}

// Format price from lamports to SOL with proper formatting
export function formatPrice(lamports: string | number): string {
  const sol = Number(lamports) / 1_000_000_000;
  return sol.toLocaleString(undefined, { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 9 
  });
} 