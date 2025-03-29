'use client';

import React, { useState, useRef } from 'react';
import { generateSigner, percentAmount } from '@metaplex-foundation/umi';
import {
  createNft,
  fetchDigitalAsset,
} from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { PinataSDK } from "pinata";
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Upload, Loader2 } from 'lucide-react';
// import Link from 'next/link';

const NFTCreator = () => {
  const [loading, setLoading] = useState(false);
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mintStatus, setMintStatus] = useState<string | null>(null);
  const [nftUrl, setNftUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { publicKey, connected } = useWallet();
  // Get wallet at component level
  const wallet = useWallet();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        console.log('Preview URL:', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const createAndUploadMetadata = async (imageUrl: string, name: string, description: string) => {
    const metadata = {
      name: name,
      description: description || `NFT created for ${name}`,
      image: imageUrl,
      attributes: [
        {
          trait_type: "Created By",
          value: publicKey?.toString().slice(0, 8) + "..." || "Unknown"
        }
      ]
    };

    try {
      // Upload metadata to IPFS
      const pinata = new PinataSDK({
        pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
        pinataGateway: "plum-tough-mongoose-147.mypinata.cloud",
      });

      // Try JSON upload instead of file for metadata
      const metadataUpload = await pinata.upload.public.json(metadata);
      console.log('Metadata upload response:', metadataUpload);

      return `https://plum-tough-mongoose-147.mypinata.cloud/ipfs/${metadataUpload.cid}`;
    } catch (error) {
      console.error('Error uploading metadata:', error);
      throw error;
    }
  };

  const mintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      setMintStatus('Please connect your wallet first.');
      return;
    }

    if (!selectedFile || !nftName) {
      setMintStatus('Please select an image and provide a name.');
      return;
    }

    // Check if the Pinata JWT is defined
    const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (!pinataJwt) {
      setMintStatus('Error: Pinata JWT is not configured. Please check your environment variables.');
      return;
    }

    try {
      setLoading(true);
      setMintStatus('Uploading image to IPFS...');

      // Upload image to IPFS
      const pinata = new PinataSDK({
        pinataJwt: pinataJwt,
        pinataGateway: "plum-tough-mongoose-147.mypinata.cloud",
      });

      console.log('Uploading file to Pinata:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      // Create a new File object from the selected file to ensure compatibility
      const fileToUpload = new File(
        [await selectedFile.arrayBuffer()], 
        selectedFile.name, 
        { type: selectedFile.type }
      );
      
      const upload = await pinata.upload.public.file(fileToUpload);
      console.log('Upload response:', upload);
      
      const imageUrl = `https://plum-tough-mongoose-147.mypinata.cloud/ipfs/${upload.cid}`;
      
      setMintStatus('Creating metadata and uploading to IPFS...');
      const metadataUri = await createAndUploadMetadata(imageUrl, nftName, nftDescription);
      
      setMintStatus('Minting NFT on Solana...');

      // Create umi instance and connect wallet
      const umi = createUmi('https://api.devnet.solana.com').use(mplTokenMetadata());

      // Add the wallet as a signer
      // First, make sure we have a wallet
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Import necessary packages for wallet adapter
      const { walletAdapterIdentity } = await import('@metaplex-foundation/umi-signer-wallet-adapters');
      // Use the wallet from component level instead of calling useWallet() here
      await umi.use(walletAdapterIdentity(wallet));

      // Create a mint signer
      const mint = generateSigner(umi);
      
      // Create the NFT
      await createNft(umi, {
        mint,
        name: nftName,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(5.5),
      }).sendAndConfirm(umi);
      
      // Fetch the created NFT
      const asset = await fetchDigitalAsset(umi, mint.publicKey);
      console.log('NFT created successfully:', asset);
      
      setNftUrl(`https://explorer.solana.com/address/${mint.publicKey}?cluster=devnet`);
      setMintStatus('Success! Your NFT has been created.');
      setLoading(false);
    } catch (error) {
      console.error('Error minting NFT:', error);
      
      // More detailed error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Add more specific error handling
        if (errorMessage.includes('Failed to fetch')) {
          errorMessage = 'Failed to connect to Pinata. Please check your internet connection and try again.';
        } else if (errorMessage.includes('jwt')) {
          errorMessage = 'Invalid Pinata JWT. Please check your API credentials.';
        }
      }
      
      setMintStatus(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/bg-image.jpg)' }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto p-4 md:p-6 pb-24">
          <div className="flex justify-between items-center mb-6 md:mb-8 pt-4 md:pt-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Create NFT</h1>
            <div>
              <WalletMultiButton />
              {/* <Link href="/portfolio" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
                My Portfolio
              </Link> */}
            </div>
          </div>
          
          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 md:p-6 text-white mb-16">
            {connected ? (
              <form onSubmit={mintNFT} className="space-y-5 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      NFT Name
                    </label>
                    <input
                      type="text"
                      value={nftName}
                      onChange={(e) => setNftName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900/80 border border-purple-500/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                      placeholder="Enter a name for your NFT"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={nftDescription}
                      onChange={(e) => setNftDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900/80 border border-purple-500/40 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                      placeholder="Enter a description for your NFT"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-1">
                      Upload Image
                    </label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-purple-500/40 rounded-lg p-4 md:p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-900/40 transition-colors"
                    >
                      {previewUrl ? (
                        <div className="space-y-3 md:space-y-4 w-full">
                          <div className="mx-auto max-w-xs overflow-hidden rounded-lg border border-purple-500/40">
                            <img 
                              src={previewUrl} 
                              alt="Preview" 
                              className="w-full h-auto object-contain"
                            />
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            className="mx-auto border-purple-500 text-purple-300 hover:bg-purple-900/30"
                          >
                            Change Image
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-10 w-10 md:h-12 md:w-12 text-purple-400 mb-2" />
                          <p className="text-sm text-gray-300 text-center">Click to upload or drag and drop</p>
                          <p className="text-xs text-gray-400 mt-1 text-center">PNG, JPG, GIF up to 10MB</p>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {mintStatus && (
                  <div className={`p-3 md:p-4 rounded-md ${
                    mintStatus.includes('Error') 
                      ? 'bg-red-900/30 text-red-300 border border-red-600/40' 
                      : mintStatus.includes('Success') 
                        ? 'bg-green-900/30 text-green-300 border border-green-600/40'
                        : 'bg-blue-900/30 text-blue-300 border border-blue-600/40'
                  }`}>
                    <p className="text-sm">{mintStatus}</p>
                    {nftUrl && (
                      <a 
                        href={nftUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-200 font-medium text-sm mt-2 inline-block"
                      >
                        View on Solana Explorer
                      </a>
                    )}
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading || !connected}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                      {mintStatus || 'Processing...'}
                    </span>
                  ) : (
                    'Create NFT'
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-12 md:py-20">
                <h2 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-white">Connect Your Wallet</h2>
                <p className="text-gray-300 mb-5 md:mb-6">Connect your wallet to create an amazing NFT</p>
                <WalletMultiButton />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCreator;
