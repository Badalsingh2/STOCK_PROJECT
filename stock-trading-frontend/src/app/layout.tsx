"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
                refetchOnWindowFocus: false,
            }
        }
    }));

    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground`}>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                            {/* Toast Provider should be at root level */}
                            <Toaster
                                position="top-center"
                                richColors
                            />

                            <div className="min-h-screen flex flex-col">
                                {children}
                            </div>
                        </ThemeProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </body>
        </html>
    );
}