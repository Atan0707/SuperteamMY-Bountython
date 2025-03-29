import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  buttonText, 
  buttonLink 
}) => {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-4">{title}</h3>
      <p className="text-gray-300 mb-6">{description}</p>
      <Link 
        href={buttonLink} 
        className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700"
      >
        {buttonText}
      </Link>
    </div>
  );
};

export default EmptyState; 