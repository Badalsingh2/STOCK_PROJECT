"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="bg-background border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          MyApp
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          <Link href="/about" className="hover:text-primary">About</Link>
          <Link href="/contact" className="hover:text-primary">Contact</Link>
        </div>

        {/* Theme Toggle & Mobile Menu */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          {mounted && (
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col p-4 space-y-3">
            <Link href="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
            <Link href="/about" onClick={() => setIsOpen(false)}>About</Link>
            <Link href="/contact" onClick={() => setIsOpen(false)}>Contact</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
