'use client';

import React, { useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';
import { NFT_SHOWCASE_PROGRAM_ID } from '@/lib/nft-showcase';
import { format } from 'date-fns';
import { Activity, ShoppingCart, Tag, ArrowRight, History, DollarSign, Archive, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Transaction {
  signature: string;
  timestamp: number;
  type: 'purchase' | 'listing' | 'cancelListing';
  seller?: string;
  buyer?: string;
  nftName?: string;
  nftMint?: string;
  price?: number;
}

const getTransactionType = (transaction: ParsedTransactionWithMeta): string | null => {
  // Check transaction instructions to determine the type
  if (!transaction.meta || !transaction.transaction.message.instructions) return null;
  
  // Get program ID from the instruction
  const instructions = transaction.transaction.message.instructions;
  for (const ix of instructions) {
    if ('programId' in ix && ix.programId.equals(NFT_SHOWCASE_PROGRAM_ID)) {
      // Check for function discriminator in data
      if ('data' in ix && ix.data) {
        const data = Buffer.from(ix.data, 'base64');
        // First 8 bytes are function discriminator
        if (data.length >= 8) {
          const discriminator = data.subarray(0, 8);
          
          // Check for known function discriminators from IDL
          if (discriminator.toString('hex') === '6000dd1bea6b53de') return 'purchase'; // buy_nft
          if (discriminator.toString('hex') === '29b732e8e6e99d46') return 'cancelListing'; // cancel_listing
          if (discriminator.toString('hex') === '58dd5da63fdc6ae8') return 'listing'; // list_nft
        }
      }
    }
  }
  return null;
};

const TransactionHistory: React.FC = () => {
  const { connection } = useConnection();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [lastSignature, setLastSignature] = useState<string | undefined>(undefined);
  
  const fetchTransactions = async (): Promise<Transaction[]> => {
    // Get recent transactions for the NFT Showcase Program
    const options = page > 1 && lastSignature 
      ? { limit: pageSize, before: lastSignature }
      : { limit: pageSize };
      
    const signatures = await connection.getSignaturesForAddress(
      NFT_SHOWCASE_PROGRAM_ID,
      options,
      'confirmed'
    );
    
    if (!signatures.length) return [];
    
    // Get transaction details
    const transactions = await connection.getParsedTransactions(
      signatures.map(sig => sig.signature),
      { maxSupportedTransactionVersion: 0 }
    );
    
    // Process transactions
    const result = transactions
      .map((tx, i) => {
        if (!tx) return null;
        
        const signature = signatures[i]?.signature;
        const timestamp = signatures[i]?.blockTime || 0;
        const type = getTransactionType(tx) as 'purchase' | 'listing' | 'cancelListing' | null;
        
        if (!signature || !type) return null;
        
        // Extract transaction details based on type
        // Note: In a real app, you would parse the transaction data more carefully
        // This is a simplified version
        
        let nftMint: string | undefined;
        let seller: string | undefined;
        let buyer: string | undefined;
        let price: number | undefined;
        
        // Try to extract accounts from the transaction
        if (tx.transaction?.message?.accountKeys) {
          const accounts = tx.transaction.message.accountKeys;
          // This is simplified - in production, you'd need to properly identify each account
          if (accounts.length > 2) seller = accounts[0].pubkey.toString();
          if (accounts.length > 3 && type === 'purchase') buyer = accounts[2].pubkey.toString();
          if (accounts.length > 5) nftMint = accounts[5].pubkey.toString(); 
        }
        
        // For a real app, you would parse the transaction data more carefully to get the price
        // This is just placeholder behavior
        if (tx.meta?.postBalances && tx.meta?.preBalances && type === 'purchase') {
          const index = tx.transaction?.message?.accountKeys.findIndex(
            a => seller && a.pubkey.equals(new PublicKey(seller))
          );
          if (index !== undefined && index >= 0) {
            price = (tx.meta.postBalances[index] - tx.meta.preBalances[index]) / 1000000000;
          }
        }
        
        return {
          signature,
          timestamp,
          type,
          seller,
          buyer,
          nftMint,
          price: price || 0,
        };
      })
      .filter(Boolean) as Transaction[];
      
    // Update the last signature for pagination
    if (result.length > 0) {
      setLastSignature(signatures[signatures.length - 1].signature);
    }
    
    return result;
  };
  
  const { 
    data: transactions = [], 
    isLoading, 
    isError, 
    refetch,
    isFetching
  } = useQuery<Transaction[]>({
    queryKey: ['transactionHistory', page],
    queryFn: fetchTransactions,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
  
  // Check if there's a next page
  const hasNextPage = transactions.length === pageSize;
  
  const getIconForType = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-4 w-4 text-green-400" />;
      case 'listing':
        return <Tag className="h-4 w-4 text-blue-400" />;
      case 'cancelListing':
        return <Archive className="h-4 w-4 text-red-400" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getTransactionLabel = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'purchase':
        return 'NFT Purchase';
      case 'listing':
        return 'NFT Listed';
      case 'cancelListing':
        return 'Listing Canceled';
      default:
        return 'Transaction';
    }
  };
  
  return (
    <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 text-white mt-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold mb-2 flex items-center">
            <History className="h-5 w-5 mr-2 text-purple-400" />
            Transaction History
          </h2>
          <p className="text-gray-300">Recent activity on the NFT Showcase platform</p>
        </div>
        <Button 
          onClick={() => {
            setPage(1);
            setLastSignature(undefined);
            refetch();
          }} 
          variant="outline" 
          size="sm"
          className="bg-purple-600/20 hover:bg-purple-600/30 border-purple-500/40 text-white"
        >
          <Activity className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-400" />
          <p className="mt-4 text-gray-200">Loading transactions...</p>
        </div>
      ) : isError ? (
        <div className="text-center py-10">
          <h3 className="text-xl font-medium mb-4 text-red-400">Error Loading Transactions</h3>
          <p className="text-gray-300 mb-6">There was an error loading the transaction history.</p>
          <Button 
            onClick={() => refetch()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Try Again
          </Button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10">
          <h3 className="text-xl font-medium mb-4">No Transactions Found</h3>
          <p className="text-gray-300">No recent transactions have been recorded.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-purple-600/30 scrollbar-track-gray-800/20 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">Details</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-purple-300">Price</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-purple-300">Time</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-purple-300">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {transactions.map((tx) => (
                  <tr 
                    key={tx.signature} 
                    className="hover:bg-purple-600/5 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        {getIconForType(tx.type)}
                        <span className="ml-2 text-sm font-medium">
                          {getTransactionLabel(tx)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {tx.type === 'purchase' ? (
                        <div className="text-sm">
                          <div className="flex items-center text-gray-300">
                            <span className="truncate max-w-[120px]">{tx.seller?.slice(0, 4)}...{tx.seller?.slice(-4)}</span>
                            <ArrowRight className="mx-2 h-3 w-3 text-purple-400" />
                            <span className="truncate max-w-[120px]">{tx.buyer?.slice(0, 4)}...{tx.buyer?.slice(-4)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            NFT: {tx.nftMint?.slice(0, 4)}...{tx.nftMint?.slice(-4)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="flex items-center text-gray-300">
                            <span className="truncate max-w-[200px]">{tx.seller?.slice(0, 4)}...{tx.seller?.slice(-4)}</span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            NFT: {tx.nftMint?.slice(0, 4)}...{tx.nftMint?.slice(-4)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {tx.type === 'purchase' && tx.price ? (
                        <div className="flex items-center justify-end">
                          <DollarSign className="h-3 w-3 mr-1 text-purple-300" />
                          <span className="text-sm font-semibold">{tx.price.toFixed(2)} SOL</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-gray-300">
                      {tx.timestamp ? (
                        format(new Date(tx.timestamp * 1000), 'MMM d, HH:mm')
                      ) : (
                        'Unknown'
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <a
                        href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-purple-400 hover:text-purple-300 hover:underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-6">
            <Button 
              onClick={() => setPage(old => Math.max(old - 1, 1))}
              disabled={page === 1 || isLoading || isFetching}
              size="sm"
              variant="outline"
              className="border-purple-500/40 text-white hover:bg-purple-600/20"
            >
              {isFetching && page !== 1 ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ChevronLeft className="h-4 w-4 mr-1" />
              )}
              Previous
            </Button>
            
            <span className="text-sm text-gray-300">Page {page}</span>
            
            <Button 
              onClick={() => setPage(old => old + 1)}
              disabled={!hasNextPage || isLoading || isFetching}
              size="sm"
              variant="outline"
              className="border-purple-500/40 text-white hover:bg-purple-600/20"
            >
              Next
              {isFetching && page * pageSize < 100 ? (
                <Loader2 className="h-4 w-4 ml-1 animate-spin" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default TransactionHistory; 