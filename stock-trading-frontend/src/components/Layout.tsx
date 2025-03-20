"use client";

import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu, X, BarChart2, Home, User, Settings, Bell, LogIn, UserPlus } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/navigation';
import Search from "@/components/Search";

interface LayoutProps {
    children: ReactNode;
}

interface SidebarItemProps {
    icon: ReactNode;
    label: string;
    href: string;
    isOpen: boolean;
}

export default function Layout({ children }: LayoutProps) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState<boolean>(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* Desktop Sidebar - Only visible when authenticated */}
            {isAuthenticated && (
                <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} hidden md:block transition-all duration-300 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}>
                    <div className="flex flex-col h-full">
                        <div className="p-4 flex items-center justify-between">
                            <Link 
                                href={isAuthenticated ? "/dashboard" : "/"} 
                                className={`font-bold text-xl ${!isSidebarOpen && 'hidden'}`}
                            >
                                StockApp
                            </Link>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="mt-6 flex flex-col space-y-2 px-3">
                            <SidebarItem icon={<Home className="h-5 w-5" />} label="Dashboard" href="/dashboard" isOpen={isSidebarOpen} />
                            <SidebarItem icon={<BarChart2 className="h-5 w-5" />} label="Trending" href="/stocks/trending" isOpen={isSidebarOpen} />
                            <SidebarItem icon={<Bell className="h-5 w-5" />} label="News" href="/news" isOpen={isSidebarOpen} />
                            <SidebarItem icon={<User className="h-5 w-5" />} label="Portfolio" href="/portfolio" isOpen={isSidebarOpen} />
                            <SidebarItem icon={<Settings className="h-5 w-5" />} label="Settings" href="/settings" isOpen={isSidebarOpen} />
                        </div>

                        {/* User Profile Section */}
                        <div className="mt-auto mb-6 px-3">
                            <div className={`flex items-center ${!isSidebarOpen ? 'justify-center' : 'px-3 py-2'}`}>
                                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                {isSidebarOpen && (
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {user?.username || 'User'}
                                        </p>
                                        <Button
                                            variant="link"
                                            className="text-xs h-auto p-0 text-gray-500 dark:text-gray-400"
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to logout?')) {
                                                    await logout();
                                                    router.push('/');
                                                }
                                            }}
                                        >
                                            Logout
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navbar */}
                <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center">
                            {isAuthenticated && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden mr-2"
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            )}
                            <div className="relative md:w-64">
                                <Search />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {!isAuthenticated ? (
                                <>
                                    <Link href="/login" className="hidden md:flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-500">
                                        <LogIn className="h-4 w-4 mr-1" />
                                        Login
                                    </Link>
                                    <Link href="/register" className="hidden md:inline-flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Register
                                    </Link>
                                </>
                            ) : (
                                <div className="flex items-center space-x-4">
                                    <div className="hidden md:flex items-center">
                                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                                        </div>
                                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {user?.username || 'User'}
                                        </span>
                                    </div>
                                    <Button
                                        variant="link"
                                        className="text-xs h-auto p-0 text-gray-500 dark:text-gray-400"
                                        onClick={async () => {
                                            if (window.confirm('Are you sure you want to logout?')) {
                                                await logout();
                                                router.push('/');
                                            }
                                        }}
                                    >
                                        Logout
                                    </Button>
                                </div>
                            )}

                            {isAuthenticated && (
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell className="h-5 w-5" />
                                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                                </Button>
                            )}

                            {mounted && (
                                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                                    {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                                </Button>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Mobile Sidebar */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 z-40 flex">
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)}></div>
                        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-800 shadow-xl">
                            <div className="absolute top-0 right-0 -mr-12 pt-2">
                                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                    <X className="h-6 w-6 text-white" />
                                </Button>
                            </div>
                            <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                                <Link 
                                    href={isAuthenticated ? "/dashboard" : "/"} 
                                    className="font-bold text-xl"
                                >
                                    StockApp
                                </Link>
                            </div>
                            
                            {isAuthenticated ? (
                                <>
                                    <div className="mt-6 flex flex-col space-y-2 px-3">
                                        <SidebarItem icon={<Home className="h-5 w-5" />} label="Dashboard" href="/dashboard" isOpen={true} />
                                        <SidebarItem icon={<BarChart2 className="h-5 w-5" />} label="Trending" href="/stocks/trending" isOpen={true} />
                                        <SidebarItem icon={<Bell className="h-5 w-5" />} label="News" href="/news" isOpen={true} />
                                        <SidebarItem icon={<User className="h-5 w-5" />} label="Portfolio" href="/portfolio" isOpen={true} />
                                        <SidebarItem icon={<Settings className="h-5 w-5" />} label="Settings" href="/settings" isOpen={true} />
                                    </div>
                                    <div className="mt-auto mb-6 px-3">
                                        <div className="flex items-center px-3 py-2">
                                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                    {user?.username || 'User'}
                                                </p>
                                                <Button
                                                    variant="link"
                                                    className="text-xs h-auto p-0 text-gray-500 dark:text-gray-400"
                                                    onClick={async () => {
                                                        if (window.confirm('Are you sure you want to logout?')) {
                                                            await logout();
                                                            router.push('/');
                                                        }
                                                    }}
                                                >
                                                    Logout
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="mt-6 flex flex-col space-y-2 px-3">
                                    <Link href="/login" className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <LogIn className="h-5 w-5" />
                                        <span className="ml-3">Login</span>
                                    </Link>
                                    <Link href="/register" className="flex items-center px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
                                        <UserPlus className="h-5 w-5" />
                                        <span className="ml-3">Register</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
                    {children}
                </main>
            </div>
        </div>
    );
}

function SidebarItem({ icon, label, href, isOpen }: SidebarItemProps) {
    return (
        <Link
            href={href}
            className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
            <div className="flex items-center justify-center">{icon}</div>
            {isOpen && <span className="ml-3">{label}</span>}
        </Link>
    );
}