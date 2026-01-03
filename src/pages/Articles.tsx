import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Calendar, User, Tag, ArrowLeft, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useArticles, Article } from '../hooks/useArticles';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Articles: React.FC = () => {
    const { articles, loading, error, getCategories, getAllTags, searchArticles } = useArticles();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    const categories = useMemo(() => {
        return ['all', ...getCategories()];
    }, [getCategories]);

    const allTags = useMemo(() => getAllTags(), [getAllTags]);

    const filteredArticles = useMemo(() => {
        let result = searchQuery ? searchArticles(searchQuery) : articles;

        if (selectedCategory !== 'all') {
            result = result.filter(a => a.category === selectedCategory);
        }

        if (selectedTag) {
            result = result.filter(a => a.tags?.includes(selectedTag));
        }

        return result;
    }, [articles, searchQuery, selectedCategory, selectedTag, searchArticles]);

    // Featured article (most recent with image)
    const featuredArticle = useMemo(() => {
        return filteredArticles.find(a => a.featured_image_url) || filteredArticles[0];
    }, [filteredArticles]);

    // Rest of articles
    const regularArticles = useMemo(() => {
        return filteredArticles.filter(a => a.id !== featuredArticle?.id);
    }, [filteredArticles, featuredArticle]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Draft';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading articles...</p>
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
                        <p>Error loading articles: {error}</p>
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
                        <span className="text-sm font-medium text-gray-600">Knowledge Hub</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-3">
                        Articles & Insights
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Stay informed with the latest insights, research, and tips about peptides and wellness.
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
                            placeholder="Search articles..."
                            className="w-full px-5 py-4 pl-12 rounded-xl border-2 border-theme-secondary focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 outline-none transition-all"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => {
                                    setSelectedCategory(category);
                                    setSelectedTag(null);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
                                        ? 'bg-theme-accent text-white shadow-md'
                                        : 'bg-white border-2 border-theme-secondary text-gray-600 hover:border-theme-accent hover:text-theme-accent'
                                    }`}
                            >
                                {category === 'all' ? 'All Articles' : category}
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    {allTags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {allTags.slice(0, 10).map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedTag === tag
                                            ? 'bg-theme-accent/20 text-theme-accent border border-theme-accent'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Featured Article */}
                {featuredArticle && !searchQuery && selectedCategory === 'all' && !selectedTag && (
                    <div className="max-w-6xl mx-auto mb-10">
                        <Link
                            to={`/articles/${featuredArticle.slug}`}
                            className="group block bg-white rounded-2xl border-2 border-theme-secondary overflow-hidden shadow-soft hover:shadow-hover transition-all"
                        >
                            <div className="grid md:grid-cols-2">
                                {/* Image */}
                                <div className="aspect-[16/10] md:aspect-auto bg-gradient-to-br from-theme-secondary/30 to-theme-accent/10 relative overflow-hidden">
                                    {featuredArticle.featured_image_url ? (
                                        <img
                                            src={featuredArticle.featured_image_url}
                                            alt={featuredArticle.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <BookOpen className="w-16 h-16 text-theme-accent/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-theme-accent text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Featured
                                    </div>
                                </div>
                                {/* Content */}
                                <div className="p-6 md:p-8 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-sm font-medium text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-full">
                                            {featuredArticle.category}
                                        </span>
                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {formatDate(featuredArticle.published_at)}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-theme-text mb-3 group-hover:text-theme-accent transition-colors">
                                        {featuredArticle.title}
                                    </h2>
                                    <p className="text-gray-600 mb-4 line-clamp-3">
                                        {featuredArticle.excerpt}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {featuredArticle.author}
                                        </span>
                                        {featuredArticle.view_count > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" />
                                                {featuredArticle.view_count} views
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}

                {/* Articles Grid */}
                <div className="max-w-6xl mx-auto">
                    {(searchQuery || selectedCategory !== 'all' || selectedTag ? filteredArticles : regularArticles).length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(searchQuery || selectedCategory !== 'all' || selectedTag ? filteredArticles : regularArticles).map(article => (
                                <Link
                                    key={article.id}
                                    to={`/articles/${article.slug}`}
                                    className="group bg-white rounded-2xl border-2 border-theme-secondary overflow-hidden shadow-soft hover:shadow-hover transition-all duration-300 hover:-translate-y-1"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-video bg-gradient-to-br from-theme-secondary/30 to-theme-accent/10 relative overflow-hidden">
                                        {article.featured_image_url ? (
                                            <img
                                                src={article.featured_image_url}
                                                alt={article.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-theme-accent/50" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs font-medium text-theme-accent bg-theme-accent/10 px-2 py-1 rounded-full">
                                                {article.category}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {formatDate(article.published_at)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-theme-text mb-2 group-hover:text-theme-accent transition-colors line-clamp-2">
                                            {article.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                                            {article.excerpt}
                                        </p>
                                        {/* Tags */}
                                        {article.tags && article.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {article.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-xs text-gray-400">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {searchQuery
                                    ? `No articles found matching "${searchQuery}"`
                                    : 'No articles available in this category.'
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

export default Articles;
