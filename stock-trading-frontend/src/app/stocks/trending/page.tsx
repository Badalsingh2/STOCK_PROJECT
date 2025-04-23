"use client";

import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface Stock {
  symbol: string;
  description: string;
  price: number;
  change: number;
}

const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

const fetchTrendingSymbols = async (): Promise<string[]> => {
  const token = getAuthToken();
  if (!token) throw new Error("Unauthorized");

  const response = await axios.get("http://18.207.244.118:8000/trading/trending", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.trending_stocks;
};

const fetchStockDetails = async (symbols: string[]): Promise<Stock[]> => {
  const token = getAuthToken();
  const stockPromises = symbols.map(async (symbol) => {
    const response = await axios.get(`http://18.207.244.118:8000/stocks/${symbol}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      symbol,
      description: `Stock: ${symbol}`,
      price: response.data.c,
      change: response.data.dp,
    };
  });
  return Promise.all(stockPromises);
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative overflow-hidden rounded-xl border p-4 bg-white dark:bg-slate-800 dark:border-slate-700"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-blue-100/20 dark:via-slate-600/20 to-transparent animate-shine" />
        
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-full animate-pulse" />
            <div className="h-4 w-32 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse" />
          </div>
          
          <div className="space-y-2 text-right">
            <div className="h-5 w-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-600 rounded-full animate-pulse ml-auto" />
            <div className="h-4 w-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-slate-600 dark:to-slate-500 rounded-full animate-pulse ml-auto" />
          </div>
        </div>
      </motion.div>
    ))}
    
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-center mt-6"
    >
      <div className="relative overflow-hidden rounded-lg px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent animate-shine" />
        <span className="relative">Loading Market Data...</span>
      </div>
    </motion.div>
  </div>
);

export default function TrendingPage() {
  const { data: trendingSymbols, isLoading: isLoadingSymbols } = useQuery({
    queryKey: ["trending-symbols"],
    queryFn: fetchTrendingSymbols,
  });

  const { data: trendingStocks, isLoading: isLoadingStocks } = useQuery({
    queryKey: ["trending-stocks", trendingSymbols],
    queryFn: () => fetchStockDetails(trendingSymbols || []),
    enabled: !!trendingSymbols,
  });

  const isLoading = isLoadingSymbols || isLoadingStocks;

  return (
    <Layout>
      <div className="space-y-10 max-w-4xl mx-auto px-4 py-5 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400"
        >
          Trending Stocks
        </motion.h1>

        {isLoading ? (
          <LoadingSkeleton />
        ) : trendingStocks?.length ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 relative z-0"
          >
            {trendingStocks.map((stock, index) => {
              const isPositive = stock.change >= 0;
              return (
                <motion.div
                  key={stock.symbol}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={index === 0 ? "mt-4" : ""}
                >
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    className="flex items-center justify-between p-6 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 hover:shadow-lg dark:hover:bg-slate-700/30 transition-all duration-300 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50 dark:via-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="z-10">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {stock.symbol}
                      </h3>
                      <p className="text-gray-500 dark:text-slate-400 mt-1">
                        {stock.description}
                      </p>
                    </div>
                    
                    <div className="z-10 text-right">
                      <p className="text-xl font-semibold text-gray-800 dark:text-white">
                        ${stock.price?.toFixed(2)}
                      </p>
                      <div
                        className={`flex items-center justify-end ${
                          isPositive 
                            ? "text-green-600 dark:text-green-400" 
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="w-5 h-5 mr-2" />
                        ) : (
                          <TrendingDown className="w-5 h-5 mr-2" />
                        )}
                        <span className="font-medium">
                          {Math.abs(stock.change).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-gray-500 dark:text-slate-400"
          >
            No trending stocks available
          </motion.div>
        )}
      </div>
    </Layout>
  );
}