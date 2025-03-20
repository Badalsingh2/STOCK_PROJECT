"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "use-debounce";
import axios from "axios";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedQuery] = useDebounce(query, 300);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      setIsAuthenticated(!!token);
    };

    // Initial check
    checkAuth();

    // Listen for storage changes
    const handleStorageChange = () => checkAuth();
    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && debouncedQuery.length > 1) {
      setIsLoading(true);
      axios
        .get(`http://127.0.0.1:8000/stocks/get/search?query=${encodeURIComponent(debouncedQuery)}`)
        .then((response) => {
          setResults(response.data.results || []);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setResults([]);
    }
  }, [debouncedQuery, isAuthenticated]);

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAuthenticated ? "Search stocks..." : "Please log in to search"}
          className={`w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 border transition-colors ${
            isAuthenticated
              ? "border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              : "border-gray-200 dark:border-gray-700 cursor-not-allowed"
          } dark:text-white ${!isAuthenticated ? "opacity-50" : ""}`}
          disabled={!isAuthenticated}
        />
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <SearchIcon
            className={`w-5 h-5 ${
              isAuthenticated ? "text-gray-400" : "text-gray-300 dark:text-gray-500"
            }`}
          />
        </div>
      </div>

      {isAuthenticated && query.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : results.length > 0 ? (
            results.map((result) => (
              <Link
                key={result.symbol}
                href={`/stocks/${result.symbol}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {result.symbol}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {result.name}
                  </div>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {result.exchange}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-4 text-gray-500 dark:text-gray-400">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}