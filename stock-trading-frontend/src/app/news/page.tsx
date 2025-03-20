"use client";
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight } from 'lucide-react';
import Layout from '@/components/Layout';

interface NewsItem {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    source: string;
    image_url: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(
                    'http://127.0.0.1:8000/trading/api/news?symbols=stocks',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setNews(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch news');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                            Latest Market News
                        </h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, index) => (
                                <Skeleton key={index} className="h-96 w-full rounded-lg" />
                            ))}
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto text-center py-12">
                    <div className="text-red-500 text-xl mb-4">Error: {error}</div>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
                        Latest Market News
                    </h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {news.map((article, index) => (
                            <article
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block h-full p-4"
                                >
                                    <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden">
                                        <img
                                            src={article.image_url || '/placeholder-news.jpg'}
                                            alt={article.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>

                                    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                                        {article.title}
                                    </h2>

                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                        {article.description}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span className="font-medium">{article.source}</span>
                                        <div className="flex items-center gap-1">
                                            <span>
                                                {new Date(article.pubDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                            <ArrowUpRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </a>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}