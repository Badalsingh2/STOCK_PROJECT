"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Layout from "@/components/Layout";

interface UserData {
  _id: string;
  username: string;
  email: string;
  portfolio: Array<{
    symbol: string;
    quantity: number;
  }>;
  trade_history: Array<{
    action: string;
    symbol: string;
    quantity: number;
    timestamp: string;
  }>;
}

export default function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const getAuthToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const { data: userData, isLoading, isError } = useQuery<UserData>({
    queryKey: ["userData"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error("Not authenticated");
      const response = await axios.get("https://stock-project-1.onrender.com/users/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  if (isError) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Error loading user data</h2>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className="space-y-8 p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Account Settings</h1>
      
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[150px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : userData ? (
        <>
          {/* Basic Info Section */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Username</h3>
                <p className="text-lg font-semibold">{userData.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Email</h3>
                <p className="text-lg font-semibold">{userData.email}</p>
              </div>
            </div>
          </Card>

          {/* Portfolio Summary */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-2xl font-bold mb-6">Portfolio Holdings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.portfolio.map((holding, index) => (
                <Card key={index} className="p-4 bg-background/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{holding.symbol}</h3>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                    </div>
                    <span className="text-xl font-bold">{holding.quantity}</span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>

          {/* Trade History */}
          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
            <h2 className="text-2xl font-bold mb-6">Trade History</h2>
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
                  {userData.trade_history.map((trade, index) => (
                    <tr key={index} className="hover:bg-muted/25 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          trade.action === 'buy' 
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' 
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                        }`}>
                          {trade.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                      <td className="px-4 py-3">{trade.quantity}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(trade.timestamp).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h2 className="text-2xl font-bold mb-4">No user data found</h2>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      )}
    </div>
    </Layout>
  );
}