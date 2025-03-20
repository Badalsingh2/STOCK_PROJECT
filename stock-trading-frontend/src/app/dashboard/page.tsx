"use client";

import Layout from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Rocket, Zap } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface StockData {
    time: string;
    price: number;
}

interface MarketMover {
    symbol: string;
    name: string;
    price: number;
    change: number;
    isUp: boolean;
}

const STOCK_OPTIONS = [
    { symbol: "AAPL", name: "Apple" },
    { symbol: "GOOGL", name: "Alphabet" },
    { symbol: "MSFT", name: "Microsoft" },
    { symbol: "AMZN", name: "Amazon" },
    { symbol: "TSLA", name: "Tesla" },
    { symbol: "NVDA", name: "NVIDIA" },
    { symbol: "META", name: "Meta" }
];

export default function Home() {
    const [selectedSymbol, setSelectedSymbol] = useState("AAPL");
    const [stockData, setStockData] = useState<StockData[]>([]);
    const [currentPrice, setCurrentPrice] = useState<number>(0);
    const [change, setChange] = useState<number>(0);
    const [marketMovers, setMarketMovers] = useState<MarketMover[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        wsRef.current = new WebSocket("wss://stock-project-1.onrender.com/ws");

        wsRef.current.onopen = () => {
            setIsConnected(true);
            wsRef.current?.send("AAPL");
        };

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            switch (message.event) {
                case "stock_update":
                    setCurrentPrice(prev => {
                        if (prev) setChange(message.data.price - prev);
                        return message.data.price;
                    });
                    setStockData(prev => [
                        ...prev.slice(-29),
                        {
                            time: new Date(message.data.time).toLocaleTimeString(),
                            price: message.data.price
                        }
                    ]);
                    break;
                case "market_movers":
                    setMarketMovers(message.data);
                    break;
            }
        };

        wsRef.current.onclose = () => setIsConnected(false);

        return () => {
            wsRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (isConnected && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(selectedSymbol);
            setStockData([]);
            setCurrentPrice(0);
            setChange(0);
        }
    }, [selectedSymbol, isConnected]);

    const chartVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <Layout>
            <div className="space-y-4 p-4 sm:p-6 max-w-7xl mx-auto">
                {/* Connection Status */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-end gap-2 mb-4"
                >
                    <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                        {isConnected ? 'Live data connected' : 'Connecting...'}
                    </span>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    <AnimatePresence>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="h-full"
                        >
                            <StatCard
                                title="Current Price"
                                value={currentPrice.toFixed(2)}
                                icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
                                delta={change}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="h-full"
                        >
                            <StatCard
                                title="Price Change"
                                value={change.toFixed(2)}
                                icon={change >= 0 ?
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> :
                                    <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />}
                                delta={change}
                            />
                        </motion.div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="h-full"
                        >
                            <StatCard
                                title="Volatility"
                                value="24.5%"
                                icon={<Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />}
                                description="1D Volatility"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4 sm:gap-6">
                    {/* Chart Section */}
                    <motion.div
                        className="h-full"
                        variants={chartVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <Card className="h-full bg-background/50 backdrop-blur-sm border-border/30 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 p-4 sm:p-6">
                                <CardHeader className="p-0">
                                    <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                        {selectedSymbol} Analysis
                                    </CardTitle>
                                </CardHeader>
                                <Select onValueChange={setSelectedSymbol} value={selectedSymbol}>
                                    <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                                        <SelectValue placeholder="Select stock" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background/80 backdrop-blur-sm max-h-[300px]">
                                        {STOCK_OPTIONS.map((stock) => (
                                            <SelectItem
                                                key={stock.symbol}
                                                value={stock.symbol}
                                                className="hover:bg-muted/50 truncate"
                                            >
                                                {stock.name} ({stock.symbol})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <CardContent className="h-[300px] sm:h-[400px] xl:h-[500px] p-4 sm:p-6">
                                {stockData.length > 0 ? (
                                    // Replace the LineChart component with this version
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stockData}>
                                            <defs>
                                                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="hsl(0, 0%, 89%)"
                                                opacity={0.2}
                                            />
                                            <XAxis
                                                dataKey="time"
                                                tick={{ fill: "hsl(0, 0%, 45%)" }}
                                                axisLine={{ stroke: "hsl(0, 0%, 89%)" }}
                                            />
                                            <YAxis
                                                tick={{ fill: "hsl(0, 0%, 45%)" }}
                                                axisLine={{ stroke: "hsl(0, 0%, 89%)" }}
                                            />
                                            <Tooltip
                                                content={({ payload }) => (
                                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-lg">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                                            {payload?.[0]?.payload.time}
                                                        </p>
                                                        <p className="text-blue-600 dark:text-blue-400">
                                                            ${typeof payload?.[0]?.value === 'number'
                                                                ? payload[0].value.toFixed(2)
                                                                : 'N/A'}
                                                        </p>
                                                    </div>
                                                )}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="price"
                                                stroke="hsl(217, 91%, 60%)"
                                                strokeWidth={2}
                                                dot={false}
                                                activeDot={{
                                                    r:6,
                                                    fill: "hsl(217, 91%, 60%)",
                                                    stroke: "hsl(0, 0%, 100%)",
                                                    strokeWidth: 2
                                                }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <Skeleton className="w-full h-full rounded-lg" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Market Movers */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="h-full"
                    >
                        <Card className="h-full bg-background/50 backdrop-blur-sm border-border/30 shadow-sm">
                            <CardHeader className="pb-2 p-4 sm:p-6">
                                <div className="flex items-center gap-2">
                                    <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                                    <CardTitle className="text-lg sm:text-xl font-bold">Market Movers</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 p-4 sm:p-6">
                                <AnimatePresence>
                                    {marketMovers.length > 0 ? (
                                        marketMovers.map((stock, index) => (
                                            <motion.div
                                                key={`${stock.symbol}-${index}`}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ delay: index * 0.1 }}
                                            >
                                                <Link href={`/stocks/${stock.symbol}`} passHref>
                                                    <MarketMoverCard stock={stock} />
                                                </Link>
                                            </motion.div>
                                        ))
                                    ) : (
                                        Array.from({ length: 5 }).map((_, index) => (
                                            <Skeleton key={index} className="w-full h-14 sm:h-16 rounded-lg" />
                                        ))
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
}

const StatCard = ({ title, value, icon, delta, description }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    delta?: number;
    description?: string;
}) => (
    <Card className="bg-background/50 backdrop-blur-sm hover:shadow-lg transition-shadow h-full">
        <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                        ${value}
                        {delta !== undefined && (
                            <span className={`ml-2 text-xs sm:text-sm ${delta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {delta >= 0 ? '+' : ''}{delta?.toFixed(2)}%
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground">{description}</p>
                    )}
                </div>
                <motion.div
                    className="p-2 sm:p-3 rounded-full bg-muted/50"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {icon}
                </motion.div>
            </div>
        </CardContent>
    </Card>
);

const MarketMoverCard = ({ stock }: { stock: MarketMover }) => (
    <div className="group flex items-center justify-between p-3 sm:p-4 bg-background/30 rounded-lg backdrop-blur-sm hover:bg-background/50 transition-all cursor-pointer border border-border/30">
        <div className="flex-1 min-w-0 pr-2">
            <div className="font-semibold text-foreground text-sm sm:text-base truncate">
                {stock.symbol}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground truncate">
                {stock.name}
            </div>
        </div>
        <div className="text-right">
            <div className="font-medium text-foreground text-sm sm:text-base">
                ${stock.price.toFixed(2)}
            </div>
            <div className={`flex items-center justify-end ${stock.isUp ? 'text-green-500' : 'text-red-500'} text-xs sm:text-sm`}>
                <motion.div
                    animate={{ y: stock.isUp ? [-2, 0, -2] : [0, -2, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                >
                    {stock.isUp ?
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> :
                        <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
                </motion.div>
                <span>{stock.change.toFixed(2)}%</span>
            </div>
        </div>
    </div>
);