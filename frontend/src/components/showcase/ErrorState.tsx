import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  description: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, description, onRetry }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRetry = async () => {
    try {
      setIsRefreshing(true);
      await onRetry();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-4 text-red-400">{message}</h3>
      <p className="text-gray-300 mb-6">{description}</p>
      <Button 
        onClick={handleRetry}
        disabled={isRefreshing}
        className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRefreshing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Refreshing...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </>
        )}
      </Button>
    </div>
  );
};

export default ErrorState; 