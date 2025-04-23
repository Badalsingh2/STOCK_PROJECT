"use client";

import Layout from "@/components/Layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

interface StockData {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
}

interface HistoryData {
  date: string;
  close: number;
}

const SkeletonLoader = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-32 bg-gray-300 rounded-full dark:bg-gray-700" />
    <div className="h-64 w-full bg-gray-200 rounded-xl dark:bg-gray-800" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg bg-gray-200 dark:bg-gray-800 h-16" />
      ))}
    </div>
  </div>
);

export default function StockPage() {
  const { symbol } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [isBuying, setIsBuying] = useState(false);

  const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const { data: stockData, isLoading } = useQuery<StockData>({
    queryKey: ["stock", symbol],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");
      const response = await axios.get(`http://18.207.244.118:8000/stocks/${symbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: !!symbol && isAuthenticated,
  });

  const { data: historyData } = useQuery<HistoryData[]>({
    queryKey: ["stockHistory", symbol],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error("No authentication token found");
      const response = await axios.get(`http://18.207.244.118:8000/stocks/get/history?symbol=${symbol}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    enabled: !!symbol && isAuthenticated,
  });

  const buyMutation = useMutation({
    mutationFn: async () => {
      const token = getAuthToken();
      const response = await axios.post(
        `http://18.207.244.118:8000/trading/trade?action=buy`,
        {
          symbol: symbol,
          quantity: quantity,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    },
    onSuccess: async () => {
      toast.success(`Successfully purchased ${quantity} shares of ${symbol}`, {
        duration: 3000,
      });
      setIsBuying(false);
  
      try {
        await axios.post(
          "https://0i4nvvnu41.execute-api.us-east-1.amazonaws.com/buy", // ✅ make sure this endpoint exists
          {
            symbol: symbol,
            quantity: String(quantity),
            action: "buy",
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Buy notification sent successfully");
      } catch (err) {
        console.error("Error sending buy notification:", err);
      }
  
      // Wait for toast duration before redirecting
      setTimeout(() => {
        router.push("/portfolio");
      }, 3000);
    },
    onError: () => {
      toast("Failed to purchase shares. Please try again.", {
        style: { backgroundColor: "red", color: "white" },
      });
      setIsBuying(false);
    },
  });
  
  
  

  if (isLoading) {
    return (
      <Layout>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <SkeletonLoader />
        </motion.div>
      </Layout>
    );
  }

  if (!stockData) return <Layout>Stock not found</Layout>;

  const isPositive = stockData.d >= 0;
  const totalCost = (stockData.c * quantity).toFixed(2);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
        <div className="flex items-center mb-4">
          <Link href="/dashboard" passHref>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{symbol}</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-semibold">${stockData.c.toFixed(2)}</span>
              <span className={`flex items-center ${isPositive ? "text-green-500" : "text-red-500"}`}>
                {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                {stockData.d.toFixed(2)} ({stockData.dp.toFixed(2)}%)
              </span>
            </div>
          </div>
          {isAuthenticated && !isBuying && (
            <Button onClick={() => setIsBuying(true)} className="bg-green-500 hover:bg-green-600 text-white">
              Buy Shares
            </Button>
          )}
        </div>

        {isBuying && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">Buy {symbol} Shares</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Quantity</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value) || 1)} className="w-24" />
                    <span>× ${stockData.c.toFixed(2)} = <strong>${totalCost}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => buyMutation.mutate()} disabled={buyMutation.isPending}>
                    {buyMutation.isPending ? "Processing..." : "Confirm Purchase"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsBuying(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="close" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </Layout>
  );
}
