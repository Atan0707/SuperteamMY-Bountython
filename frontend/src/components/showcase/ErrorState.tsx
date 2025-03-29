import React from 'react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  message: string;
  description: string;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, description, onRetry }) => {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-4 text-red-400">{message}</h3>
      <p className="text-gray-300 mb-6">{description}</p>
      <Button 
        onClick={onRetry}
        className="bg-purple-600 hover:bg-purple-700"
      >
        Try Again
      </Button>
    </div>
  );
};

export default ErrorState; 