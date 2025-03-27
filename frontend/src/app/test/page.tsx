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
import Link from 'next/link';

const NFTCreator = () => {
  const [loading, setLoading] = useState(false);
  const [nftName, setNftName] = useState('');
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

  const createAndUploadMetadata = async (imageUrl: string, name: string) => {
    const metadata = {
      name: name,
      description: `NFT created for ${name}`,
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
      const metadataUri = await createAndUploadMetadata(imageUrl, nftName);
      
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
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create Your NFT</h1>
        <div className="flex gap-4">
          <WalletMultiButton />
          <Link href="/test/view" className="inline-flex items-center px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700">
            View My NFTs
          </Link>
        </div>
      </div>
      
      {connected ? (
        <form onSubmit={mintNFT} className="space-y-6">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              NFT Name
            </label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a name for your NFT"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Upload Image
            </label>
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 focus:outline-none"
              >
                {previewUrl ? 'Change Image' : 'Select Image'}
              </button>
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
          
          {previewUrl && (
            <div className="mb-6 flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2">Image Preview</h3>
              <div className="border rounded-lg overflow-hidden max-w-md">
                <img src={previewUrl} alt="Preview" className="w-full h-auto object-contain" />
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || !connected}
            className={`w-full py-3 px-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Mint NFT'}
          </button>
        </form>
      ) : (
        <div className="text-center py-8">
          <p className="text-lg mb-4">Connect your wallet to create an NFT</p>
        </div>
      )}
      
      {mintStatus && (
        <div className={`mt-6 p-4 rounded-lg ${mintStatus.includes('Error') ? 'bg-red-100 text-red-700' : mintStatus.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
          <p className="font-medium">{mintStatus}</p>
          {nftUrl && (
            <div className="mt-3">
              <a 
                href={nftUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                View your NFT on Solana Explorer
              </a>
            </div>
          )}
        </div>
      )}

      {nftUrl && mintStatus && mintStatus.includes('Success') && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg shadow-md">
          <h3 className="text-xl font-bold text-center mb-4">🎉 Your NFT is Ready! 🎉</h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {previewUrl && (
              <div className="border-4 border-white rounded-lg overflow-hidden shadow-lg max-w-xs">
                <img src={previewUrl} alt={nftName} className="w-full h-auto" />
              </div>
            )}
            <div className="flex-1 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500">NFT NAME</h4>
                <p className="text-lg font-bold">{nftName}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500">OWNER</h4>
                <p className="text-md font-mono">{publicKey?.toString().slice(0, 10)}...{publicKey?.toString().slice(-6)}</p>
              </div>
              <a 
                href={nftUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
              >
                View on Solana Explorer
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTCreator;