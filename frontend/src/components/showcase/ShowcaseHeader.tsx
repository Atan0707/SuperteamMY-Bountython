import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

interface ShowcaseHeaderProps {
  title: string;
  description: string;
  onRefresh: () => void;
}

const ShowcaseHeader: React.FC<ShowcaseHeaderProps> = ({
  title,
  description,
  onRefresh
}) => {
  return (
    <>
      <div className="flex flex-row justify-between items-center mb-8 pt-4 sm:pt-6 gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
        <div>
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-2 !px-4 !text-sm !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Available NFTs for Purchase</h2>
            <p className="text-gray-300">{description}</p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm"
            className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>
    </>
  );
};

export default ShowcaseHeader; 