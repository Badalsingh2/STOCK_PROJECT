"use client";

import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";
import { Rocket, BarChart, ShieldCheck, Wallet, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface StockData {
  name: string;
  value: number;
}

interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  isUp: boolean;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate auth check
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isLoggedIn) {
    return (
      <Layout>
        {/* Hero Section */}
        <div className="py-12 md:py-20 text-center space-y-4 md:space-y-6 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Smart Investing Made Simple
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Track markets, manage your portfolio, and make informed decisions with real-time data.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 my-12 md:my-20 px-4">
          <FeatureCard 
            icon={<BarChart className="h-6 w-6 md:h-8 md:w-8" />}
            title="Real-time Data"
            description="Live market updates and comprehensive financial analytics"
          />
          <FeatureCard 
            icon={<Wallet className="h-6 w-6 md:h-8 md:w-8" />}
            title="Portfolio Tracking"
            description="Monitor investments with interactive charts and metrics"
          />
          <FeatureCard 
            icon={<ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />}
            title="Secure & Private"
            description="Bank-grade security protecting your data"
          />
        </div>

        {/* CTA Section */}
        <div className="bg-secondary/50 rounded-lg md:rounded-xl p-6 md:p-12 text-center my-12 md:my-20 space-y-4 md:space-y-6 mx-4">
          <Rocket className="h-12 w-12 md:h-16 md:w-16 mx-auto text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold">Start Your Journey Today</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of investors making smarter decisions
          </p>
          <Button size="lg" className="w-full md:w-auto" asChild>
            <Link href="/register">Create Free Account</Link>
          </Button>
        </div>
      </Layout>
    );
  }
  const stockData: StockData[] = [
    { name: "Jan", value: 400 },
    { name: "Feb", value: 300 },
    { name: "Mar", value: 600 },
    { name: "Apr", value: 800 },
    { name: "May", value: 700 },
    { name: "Jun", value: 900 },
    { name: "Jul", value: 1000 },
  ];
  const marketMovers: MarketMover[] = [
    { symbol: "AAPL", name: "Apple Inc.", price: 175.34, change: 2.4, isUp: true },
    { symbol: "MSFT", name: "Microsoft Corp.", price: 325.76, change: 1.8, isUp: true },
    { symbol: "GOOGL", name: "Alphabet Inc.", price: 138.99, change: -0.7, isUp: false },
    { symbol: "AMZN", name: "Amazon.com Inc.", price: 175.34, change: 3.2, isUp: true },
  ];

  // Dashboard Content (responsive improvements)
  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 px-4">
        <DashboardCard 
          title="Market Value"
          value="$13,456.90"
          description="+15.3% from last month"
          icon={<DollarSign className="h-4 w-4" />}
        />
        <DashboardCard 
          title="Total Assets"
          value="14"
          description="+2 new positions"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <DashboardCard 
          title="Performance"
          value="+24.5%"
          description="YTD return"
          icon={<Activity className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Market Movers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {marketMovers.map((stock) => (
              <div key={stock.symbol} className="flex items-center justify-between gap-2">
                <div className="truncate">
                  <div className="font-medium text-sm md:text-base truncate">{stock.symbol}</div>
                  <div className="text-xs md:text-sm text-muted-foreground truncate">{stock.name}</div>
                </div>
                <div className="text-right min-w-[100px]">
                  <div className="font-medium text-sm md:text-base">${stock.price.toFixed(2)}</div>
                  <div className={`text-xs md:text-sm ${stock.isUp ? 'text-green-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                    {stock.isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stock.change.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Responsive Feature Card
const FeatureCard = ({ icon, title, description }: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <Card className="hover:shadow-lg transition-shadow p-4 md:p-6">
    <CardHeader className="p-0 mb-3 md:mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">{icon}</div>
        <CardTitle className="text-base md:text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <p className="text-muted-foreground text-sm md:text-base">{description}</p>
    </CardContent>
  </Card>
);

// Responsive Dashboard Card
const DashboardCard = ({ title, value, description, icon }: { 
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) => (
  <Card className="p-4 md:p-6">
    <CardHeader className="p-0 mb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-sm md:text-base font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="text-xl md:text-2xl font-bold">{value}</div>
      <p className="text-xs md:text-sm text-muted-foreground mt-1">{description}</p>
    </CardContent>
  </Card>
);