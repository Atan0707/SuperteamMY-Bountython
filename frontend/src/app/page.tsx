import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
          Solana NFT Creator
        </h1>
        <p className="text-xl text-gray-700 mb-10">
          Easily create NFTs on Solana with secure IPFS storage
        </p>
        
        <Link 
          href="/create" 
          className="inline-block px-8 py-4 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transform hover:scale-105 transition-all duration-200"
        >
          Create Your NFT
        </Link>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-purple-600 mb-3 text-4xl">🖼️</div>
          <h3 className="text-xl font-semibold mb-3">Upload Image</h3>
          <p className="text-gray-600">Upload your artwork and we'll store it securely on IPFS.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-purple-600 mb-3 text-4xl">✏️</div>
          <h3 className="text-xl font-semibold mb-3">Create Metadata</h3>
          <p className="text-gray-600">Name your NFT and we'll handle the metadata creation.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-purple-600 mb-3 text-4xl">🚀</div>
          <h3 className="text-xl font-semibold mb-3">Mint on Solana</h3>
          <p className="text-gray-600">Mint your NFT on the Solana blockchain with one click.</p>
        </div>
      </div>
    </div>
  );
}
