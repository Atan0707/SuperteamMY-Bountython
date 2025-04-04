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
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { MintStatus } from './MintStatus';
import { showSuccessToast, showErrorToast } from '@/lib/toast';

export const NFTCreatorForm = () => {
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
      showErrorToast('Please connect your wallet first.');
      return;
    }

    if (!selectedFile || !nftName) {
      showErrorToast('Please select an image and provide a name.');
      return;
    }

    // Check if the Pinata JWT is defined
    const pinataJwt = process.env.NEXT_PUBLIC_PINATA_JWT;
    if (!pinataJwt) {
      showErrorToast('Error: Pinata JWT is not configured. Please check your environment variables.');
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
      showSuccessToast('NFT created successfully!');
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
      showErrorToast(errorMessage);
      setLoading(false);
    }
  };
  
  return (
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
        
        <ImageUploader 
          previewUrl={previewUrl}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          handleFileChange={handleFileChange}
        />
      </div>
      
      <MintStatus 
        mintStatus={mintStatus} 
        nftUrl={nftUrl} 
      />
      
      <Button
        type="submit"
        disabled={loading || !connected}
        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}; 