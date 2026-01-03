import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Download, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGuides, Guide } from '../hooks/useGuides';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Guides: React.FC = () => {
    const { guides, loading, error, getCategories } = useGuides();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const categories = useMemo(() => {
        return ['all', ...getCategories()];
    }, [getCategories]);

    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
            const matchesSearch = !searchQuery ||
                guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guide.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [guides, selectedCategory, searchQuery]);

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading guides...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center text-red-500">
                        <p>Error loading guides: {error}</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col">
            <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                {/* Back Link */}
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-theme-accent hover:text-theme-text transition-colors mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Shop
                </Link>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-theme-secondary shadow-soft mb-4">
                        <BookOpen className="w-4 h-4 text-theme-accent" />
                        <span className="text-sm font-medium text-gray-600">Resource Center</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-3">
                        Electronic Guides
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Learn everything you need to know about peptides, usage, storage, and more.
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="max-w-4xl mx-auto mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search guides..."
                            className="w-full px-5 py-4 pl-12 rounded-xl border-2 border-theme-secondary focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                        ? 'bg-theme-accent text-white shadow-md'
                                        : 'bg-white border-2 border-theme-secondary text-gray-600 hover:border-theme-accent hover:text-theme-accent'
                                    }`}
                            >
                                {category === 'all' ? 'All Guides' : category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Guides Grid */}
                <div className="max-w-6xl mx-auto">
                    {filteredGuides.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGuides.map(guide => (
                                <Link
                                    key={guide.id}
                                    to={`/guides/${guide.id}`}
                                    className="group bg-white rounded-2xl border-2 border-theme-secondary overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-video bg-gradient-to-br from-theme-secondary/30 to-theme-accent/10 relative overflow-hidden">
                                        {guide.thumbnail_url ? (
                                            <img
                                                src={guide.thumbnail_url}
                                                alt={guide.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-theme-accent/50" />
                                            </div>
                                        )}
                                        {guide.pdf_url && (
                                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium text-theme-accent">
                                                <Download className="w-3 h-3" />
                                                PDF
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-full">
                                                {guide.category}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-theme-text mb-2 group-hover:text-theme-accent transition-colors line-clamp-2">
                                            {guide.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">
                                            {guide.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchQuery
                                    ? `No guides found matching "${searchQuery}"`
                                    : 'No guides available in this category.'
                                }
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Guides;
