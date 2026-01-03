import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFAQs, FAQ } from '../hooks/useFAQs';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FAQPage: React.FC = () => {
    const { faqs, loading, error } = useFAQs();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Get unique categories
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(faqs.map(f => f.category))];
        return ['all', ...uniqueCategories.sort()];
    }, [faqs]);

    // Filter FAQs based on search and category
    const filteredFAQs = useMemo(() => {
        return faqs.filter(faq => {
            const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
            const matchesSearch = !searchQuery ||
                faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [faqs, selectedCategory, searchQuery]);

    // Group FAQs by category for display
    const groupedFAQs = useMemo(() => {
        if (selectedCategory !== 'all') {
            return { [selectedCategory]: filteredFAQs };
        }

        const groups: Record<string, FAQ[]> = {};
        filteredFAQs.forEach(faq => {
            if (!groups[faq.category]) {
                groups[faq.category] = [];
            }
            groups[faq.category].push(faq);
        });
        return groups;
    }, [filteredFAQs, selectedCategory]);

    const toggleExpanded = (id: string) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        setExpandedIds(new Set(filteredFAQs.map(f => f.id)));
    };

    const collapseAll = () => {
        setExpandedIds(new Set());
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading FAQs...</p>
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
                        <p>Error loading FAQs: {error}</p>
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
                        <HelpCircle className="w-4 h-4 text-theme-accent" />
                        <span className="text-sm font-medium text-gray-600">Help Center</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-3">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Find answers to common questions about our products, shipping, and more.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-2xl mx-auto mb-8">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for answers..."
                            className="w-full px-5 py-4 pl-12 rounded-xl border-2 border-theme-secondary focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                    ? 'bg-theme-accent text-white shadow-md'
                                    : 'bg-white border-2 border-theme-secondary text-gray-600 hover:border-theme-accent hover:text-theme-accent'
                                }`}
                        >
                            {category === 'all' ? 'All Categories' : category}
                        </button>
                    ))}
                </div>

                {/* Expand/Collapse All */}
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={expandAll}
                        className="text-sm text-theme-accent hover:underline flex items-center gap-1"
                    >
                        <ChevronDown className="w-4 h-4" />
                        Expand All
                    </button>
                    <button
                        onClick={collapseAll}
                        className="text-sm text-theme-accent hover:underline flex items-center gap-1"
                    >
                        <ChevronUp className="w-4 h-4" />
                        Collapse All
                    </button>
                </div>

                {/* FAQ List */}
                <div className="max-w-3xl mx-auto space-y-8">
                    {Object.entries(groupedFAQs).map(([category, categoryFaqs]) => (
                        <div key={category}>
                            {selectedCategory === 'all' && (
                                <h2 className="text-lg font-semibold text-theme-text mb-4 pb-2 border-b-2 border-theme-secondary">
                                    {category}
                                </h2>
                            )}
                            <div className="space-y-3">
                                {categoryFaqs.map(faq => (
                                    <div
                                        key={faq.id}
                                        className="bg-white rounded-xl border-2 border-theme-secondary overflow-hidden shadow-soft transition-all hover:shadow-medium"
                                    >
                                        <button
                                            onClick={() => toggleExpanded(faq.id)}
                                            className="w-full px-6 py-4 flex items-center justify-between text-left"
                                        >
                                            <span className="font-medium text-theme-text pr-4">{faq.question}</span>
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-theme-secondary/50 flex items-center justify-center transition-transform duration-300 ${expandedIds.has(faq.id) ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-5 h-5 text-theme-accent" />
                                            </div>
                                        </button>
                                        <div
                                            className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedIds.has(faq.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                                }`}
                                        >
                                            <div className="px-6 pb-4 pt-0 text-gray-600 leading-relaxed whitespace-pre-line border-t border-gray-100">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {filteredFAQs.length === 0 && (
                        <div className="text-center py-12">
                            <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchQuery
                                    ? `No FAQs found matching "${searchQuery}"`
                                    : 'No FAQs available in this category.'
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Contact CTA */}
                <div className="max-w-2xl mx-auto mt-12 text-center bg-white rounded-2xl border-2 border-theme-secondary p-8 shadow-soft">
                    <h3 className="text-xl font-semibold text-theme-text mb-2">Still have questions?</h3>
                    <p className="text-gray-600 mb-4">
                        Can't find what you're looking for? We're here to help!
                    </p>
                    <a
                        href="https://www.facebook.com/share/14P3ALcWDEP/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        Contact Us
                    </a>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default FAQPage;
