import React from 'react';

interface MintStatusProps {
  mintStatus: string | null;
  nftUrl: string | null;
}

export const MintStatus: React.FC<MintStatusProps> = ({ mintStatus, nftUrl }) => {
  if (!mintStatus) return null;
  
  const getStatusStyle = () => {
    if (mintStatus.includes('Error')) 
      return 'bg-red-900/30 text-red-300 border border-red-600/40';
    if (mintStatus.includes('Success'))
      return 'bg-green-900/30 text-green-300 border border-green-600/40';
    return 'bg-blue-900/30 text-blue-300 border border-blue-600/40';
  };
  
  return (
    <div className={`p-3 md:p-4 rounded-md ${getStatusStyle()}`}>
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
  );
}; 