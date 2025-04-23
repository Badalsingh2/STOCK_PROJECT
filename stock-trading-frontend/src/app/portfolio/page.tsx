"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "react-hot-toast";
import Layout from "@/components/Layout";

interface PortfolioItem {
  symbol: string;
  quantity: number;
}

interface StockData {
  symbol: string;
  quantity: number;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercentage?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  totalValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

interface PortfolioSummary {
  totalInvestment: number;
  totalValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
}

interface SellOrder {
  symbol: string;
  quantity: number;
  
}

interface TradeHistoryItem {
  action: string;
  symbol: string;
  quantity: number;
  timestamp: string;
}

const Portfolio: React.FC = () => {
  const [sellOrders, setSellOrders] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();
  const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      try {
        const response = await axios.get("http://18.207.244.118:8000/portfolio", { headers });
        let portfolioItems: PortfolioItem[] = [];
        
        if (Array.isArray(response.data)) {
          portfolioItems = response.data;
        } else if (response.data.portfolio && Array.isArray(response.data.portfolio)) {
          portfolioItems = response.data.portfolio;
        } else {
          console.error("Unexpected portfolio data format:", response.data);
          return [];
        }
        
        const aggregatedStocks: Record<string, StockData> = {};
        portfolioItems.forEach((item) => {
          aggregatedStocks[item.symbol] = {
            ...item,
            quantity: (aggregatedStocks[item.symbol]?.quantity || 0) + item.quantity
          };
        });
        
        const uniqueStocks = Object.values(aggregatedStocks);
        
        const stocksWithDetails = await Promise.all(
          uniqueStocks.map(async (stock) => {
            try {
              const stockDetails = await axios.get(
                `http://18.207.244.118:8000/stocks/${stock.symbol}`,
                { headers }
              );
              
              const stockInfo = stockDetails.data;
              return {
                ...stock,
                currentPrice: stockInfo.c,
                priceChange: stockInfo.d,
                priceChangePercentage: stockInfo.dp,
                high: stockInfo.h,
                low: stockInfo.l,
                open: stockInfo.o,
                previousClose: stockInfo.pc,
                totalValue: stock.quantity * stockInfo.c,
                profitLoss: (stockInfo.c - stockInfo.pc) * stock.quantity,
                profitLossPercentage: ((stockInfo.c - stockInfo.pc) / stockInfo.pc) * 100,
              };
            } catch (error) {
              console.error(`Error fetching stock data for ${stock.symbol}:`, error);
              return { 
                ...stock, 
                currentPrice: 0, 
                totalValue: 0, 
                profitLoss: 0, 
                profitLossPercentage: 0 
              };
            }
          })
        );
        
        return stocksWithDetails;
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        throw error;
      }
    },
  });

  const { data: tradeHistory, isLoading: isHistoryLoading, isError: isHistoryError } = useQuery({
    queryKey: ["tradeHistory"],
    queryFn: async () => {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get("http://18.207.244.118:8000/trading/trade/history", { headers });
      return response.data.trade_history as TradeHistoryItem[];
    },
    enabled: showHistory,
    staleTime: 1000 * 60 * 5,
  });

  const sellStockMutation = useMutation({
    mutationFn: async (sellOrder: SellOrder) => {
      const token = getAuthToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        "http://18.207.244.118:8000/trading/trade?action=sell",
        sellOrder,
        { headers }
      );
      return response.data;
    },
    onSuccess: async (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Stock sold successfully");
      setSellOrders({});
  
      try {
        await axios.post(
          "https://0i4nvvnu41.execute-api.us-east-1.amazonaws.com/sell",
          {
            symbol: variables.symbol,
            action: "sell",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Sell notification sent successfully");
      } catch (err) {
        console.error("Error sending sell notification:", err);
      }
    },
    onError: (error) => {
      console.error("Error selling stock:", error);
      toast.error("Failed to sell stock. Please try again.");
    },
  });
  

  const handleQuantityChange = (symbol: string, value: string) => {
    const quantity = parseInt(value, 10); // Added radix parameter
    if (!isNaN(quantity)) {
      setSellOrders(prev => ({
        ...prev,
        [symbol]: Math.max(
          0,
          Math.min(
            quantity,
            portfolio?.find(item => item.symbol === symbol)?.quantity || 0
          )
        )
      }));
    } else {
      setSellOrders(prev => {
        const newState = { ...prev };
        delete newState[symbol];
        return newState;
      });
    }
  };
  const handleSell = (symbol: string) => {
    const quantity = sellOrders[symbol];
    const stock = portfolio?.find(item => item.symbol === symbol);
    
    if (!quantity || !stock) {
      toast.error("Please enter a valid quantity");
      return;
    }
    
    if (quantity > stock.quantity) {
      toast.error(`You only have ${stock.quantity} shares of ${symbol}`);
      return;
    }
    
    sellStockMutation.mutate({ symbol, quantity});
  };

  const calculateSummary = (stocks: StockData[]): PortfolioSummary => {
    const summary = {
      totalInvestment: 0,
      totalValue: 0,
      totalProfitLoss: 0,
      totalProfitLossPercentage: 0,
    };

    stocks.forEach(stock => {
      const investment = (stock.previousClose || 0) * stock.quantity;
      summary.totalInvestment += investment;
      summary.totalValue += stock.totalValue || 0;
      summary.totalProfitLoss += stock.profitLoss || 0;
    });

    if (summary.totalInvestment > 0) {
      summary.totalProfitLossPercentage = (summary.totalProfitLoss / summary.totalInvestment) * 100;
    }

    return summary;
  };

  const portfolioSummary = portfolio && portfolio.length > 0 
  ? calculateSummary(portfolio) 
  : null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">My Portfolio</h1>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            disabled={isHistoryLoading}
          >
            {showHistory ? "Hide History" : "Show History"}
          </Button>
        </div>

        {portfolioSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-chart-3" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                ${portfolioSummary.totalValue.toFixed(2)}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-coins text-chart-5">
                    <circle cx="8" cy="8" r="6"/>
                    <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
                    <path d="M7 6h1v4"/>
                    <path d="m16.71 13.88.7.71-2.82 2.82"/>
                  </svg>
                  Total Investment
                </CardTitle>
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                ${portfolioSummary.totalInvestment.toFixed(2)}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up text-chart-1">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
                    <polyline points="16 7 22 7 22 13"/>
                  </svg>
                  Profit/Loss
                </CardTitle>
              </CardHeader>
              <CardContent className={`text-2xl font-bold ${portfolioSummary.totalProfitLoss >= 0 ? 'text-chart-4' : 'text-destructive'}`}>
                {portfolioSummary.totalProfitLoss >= 0 ? '+' : '-'} 
                ${Math.abs(portfolioSummary.totalProfitLoss).toFixed(2)} 
                <span className="text-base ml-2">({portfolioSummary.totalProfitLossPercentage.toFixed(2)}%)</span>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : portfolio?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <h1 className="text-2xl font-bold mb-4">Your portfolio is empty</h1>
            <p>You don&apos;t have any stocks in your portfolio yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    {['Stock', 'Quantity', 'Price', 'Change', 'Value', 'P/L', 'Actions'].map((header) => (
                      <th 
                        key={header}
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {portfolio?.map((stock) => (
                    <tr 
                      key={stock.symbol}
                      className="hover:bg-muted/25 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-chart-1 animate-pulse"></span>
                          {stock.symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3">{stock.quantity}</td>
                      <td className="px-4 py-3 font-medium">
                        ${stock.currentPrice?.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 ${stock.priceChange! >= 0 ? 'text-chart-4' : 'text-destructive'}`}>
                        <div className="flex items-center gap-1">
                          {stock.priceChange! >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>
                            {stock.priceChange?.toFixed(2)} (
                            {stock.priceChangePercentage?.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">${stock.totalValue?.toFixed(2)}</td>
                      <td className={`px-4 py-3 ${stock.profitLoss! >= 0 ? 'text-chart-4' : 'text-destructive'}`}>
                        <div className="flex items-center gap-1">
                          {stock.profitLoss! >= 0 ? '▲' : '▼'}
                          ${Math.abs(stock.profitLoss!).toFixed(2)}
                          <span className="text-muted-foreground">
                            ({stock.profitLossPercentage?.toFixed(2)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Qty"
                            className="w-20 h-9 bg-background border-border/50 hover:border-chart-3 transition-colors"
                            value={sellOrders[stock.symbol] || ''}
                            onChange={(e) => handleQuantityChange(stock.symbol, e.target.value)}
                          />
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-9 bg-destructive/90 hover:bg-destructive transition-colors"
                            disabled={!sellOrders[stock.symbol] || sellStockMutation.isPending}
                            onClick={() => handleSell(stock.symbol)}
                          >
                            {sellStockMutation.isPending ? (
                              <span className="flex items-center gap-2">
                                <span className="animate-spin">↻</span>
                                Selling...
                              </span>
                            ) : 'Sell'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {showHistory && (
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Trading History</CardTitle>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : isHistoryError ? (
                <div className="text-center py-4 text-destructive">
                  Failed to load trading history
                </div>
              ) : tradeHistory?.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No trading history found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Action</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Symbol</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Quantity</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {tradeHistory?.map((historyItem, index) => (
                        <tr key={index} className="hover:bg-muted/25 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              historyItem.action === 'buy' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {historyItem.action.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium">{historyItem.symbol}</td>
                          <td className="px-4 py-3">{historyItem.quantity}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(historyItem.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Portfolio;