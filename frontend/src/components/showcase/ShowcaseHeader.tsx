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
      <div className="flex flex-row justify-between items-center mb-4 pt-2 sm:pt-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">{title}</h1>
        <div>
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700 !rounded-lg !py-1.5 !px-3 !text-xs !font-medium !transition-colors !shadow-md !flex !justify-center !items-center" />
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 text-white mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold mb-1">Available NFTs for Purchase</h2>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm"
            className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white h-8 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>
    </>
  );
};

export default ShowcaseHeader; 