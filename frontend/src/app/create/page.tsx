'use client';

import NFTCreator from '@/components/NFTCreator';
import Link from 'next/link';

const CreatePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-6">
        <Link 
          href="/" 
          className="text-purple-600 hover:text-purple-800 flex items-center"
        >
          ← Back to Home
        </Link>
      </div>
      <NFTCreator />
    </div>
  );
};

export default CreatePage; 