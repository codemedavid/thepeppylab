import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Calendar, User, Tag, ChevronRight, Eye, Clock, Share2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useArticles, Article } from '../hooks/useArticles';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Simple markdown-like renderer
const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 text-gray-600 pl-4">
                    {listItems.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
        inList = false;
    };

    const flushCode = () => {
        if (codeLines.length > 0) {
            elements.push(
                <pre key={`code-${elements.length}`} className="bg-gray-100 rounded-lg p-4 mb-4 overflow-x-auto">
                    <code className="text-sm text-gray-800">{codeLines.join('\n')}</code>
                </pre>
            );
            codeLines = [];
        }
        inCodeBlock = false;
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Code blocks
        if (trimmed.startsWith('```')) {
            if (inCodeBlock) {
                flushCode();
            } else {
                flushList();
                inCodeBlock = true;
            }
            return;
        }

        if (inCodeBlock) {
            codeLines.push(line);
            return;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(
                <h1 key={index} className="text-3xl font-bold text-theme-text mb-4 mt-8">
                    {trimmed.slice(2)}
                </h1>
            );
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(
                <h2 key={index} className="text-2xl font-semibold text-theme-text mb-3 mt-6">
                    {trimmed.slice(3)}
                </h2>
            );
        } else if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={index} className="text-xl font-semibold text-theme-text mb-2 mt-5">
                    {trimmed.slice(4)}
                </h3>
            );
        }
        // Blockquotes
        else if (trimmed.startsWith('> ')) {
            flushList();
            elements.push(
                <blockquote key={index} className="border-l-4 border-theme-accent pl-4 italic text-gray-600 my-4">
                    {trimmed.slice(2)}
                </blockquote>
            );
        }
        // List items
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            inList = true;
            listItems.push(trimmed.slice(2));
        }
        // Numbered list
        else if (/^\d+\.\s/.test(trimmed)) {
            flushList();
            elements.push(
                <p key={index} className="text-gray-600 mb-2 pl-4">
                    {trimmed}
                </p>
            );
        }
        // Regular text
        else if (trimmed) {
            flushList();
            // Handle bold, italic, links
            let formattedLine = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/_(.*?)_/g, '<em>$1</em>')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-theme-accent hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

            elements.push(
                <p
                    key={index}
                    className="text-gray-600 mb-4 leading-relaxed text-lg"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        } else if (!inList) {
            elements.push(<div key={index} className="h-2" />);
        }
    });

    flushList();
    flushCode();
    return elements;
};

const ArticleDetail: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { articles, getArticleBySlug, loading: articlesLoading } = useArticles();
    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadArticle = async () => {
            if (!slug) return;
            setLoading(true);
            const data = await getArticleBySlug(slug);
            setArticle(data);
            setLoading(false);
        };
        loadArticle();
    }, [slug, getArticleBySlug]);

    // Get related articles (same category or matching tags)
    const relatedArticles = articles.filter(a => {
        if (a.id === article?.id) return false;
        if (a.category === article?.category) return true;
        if (article?.tags?.some(tag => a.tags?.includes(tag))) return true;
        return false;
    }).slice(0, 3);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Draft';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const estimateReadTime = (content: string) => {
        const words = content.split(/\s+/).length;
        const minutes = Math.ceil(words / 200);
        return `${minutes} min read`;
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article?.title,
                    text: article?.excerpt,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share failed:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading || articlesLoading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading article...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow container mx-auto px-4 py-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-theme-text mb-2">Article Not Found</h1>
                    <p className="text-gray-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
                    <Link to="/articles" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Articles
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col">
            <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />

            <main className="flex-grow">
                {/* Breadcrumb */}
                <div className="container mx-auto px-4 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-theme-accent transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/articles" className="hover:text-theme-accent transition-colors">Articles</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-theme-text font-medium truncate">{article.title}</span>
                    </nav>
                </div>

                {/* Featured Image */}
                {article.featured_image_url && (
                    <div className="container mx-auto px-4 mb-8">
                        <div className="max-w-4xl mx-auto">
                            <img
                                src={article.featured_image_url}
                                alt={article.title}
                                className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-medium"
                            />
                        </div>
                    </div>
                )}

                {/* Article Header */}
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="mb-8">
                            {/* Category & Date */}
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="text-sm font-medium text-theme-accent bg-theme-accent/10 px-3 py-1 rounded-full">
                                    {article.category}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(article.published_at)}
                                </span>
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {estimateReadTime(article.content)}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-theme-text mb-4 leading-tight">
                                {article.title}
                            </h1>

                            {/* Excerpt */}
                            <p className="text-xl text-gray-600 mb-6">
                                {article.excerpt}
                            </p>

                            {/* Author & Actions */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-theme-secondary">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-theme-accent/20 flex items-center justify-center">
                                        <User className="w-5 h-5 text-theme-accent" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-theme-text">{article.author}</p>
                                        {article.view_count > 0 && (
                                            <p className="text-sm text-gray-500 flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {article.view_count} views
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={handleShare}
                                    className="flex items-center gap-2 text-gray-500 hover:text-theme-accent transition-colors"
                                >
                                    <Share2 className="w-5 h-5" />
                                    Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Article Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <article className="prose-lg">
                            {renderContent(article.content)}
                        </article>

                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                            <div className="mt-10 pt-6 border-t-2 border-theme-secondary">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Tag className="w-5 h-5 text-gray-400" />
                                    {article.tags.map(tag => (
                                        <Link
                                            key={tag}
                                            to={`/articles?tag=${tag}`}
                                            className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-theme-accent/10 hover:text-theme-accent transition-colors"
                                        >
                                            #{tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div className="mt-12 pt-8 border-t-2 border-theme-secondary">
                                <h2 className="text-2xl font-semibold text-theme-text mb-6">Related Articles</h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {relatedArticles.map(related => (
                                        <Link
                                            key={related.id}
                                            to={`/articles/${related.slug}`}
                                            className="bg-white rounded-xl border-2 border-theme-secondary overflow-hidden shadow-soft hover:shadow-medium transition-all group"
                                        >
                                            {related.featured_image_url && (
                                                <img
                                                    src={related.featured_image_url}
                                                    alt={related.title}
                                                    className="w-full h-32 object-cover"
                                                />
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-medium text-theme-text group-hover:text-theme-accent transition-colors mb-2 line-clamp-2">
                                                    {related.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-2">{related.excerpt}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Back Button */}
                        <div className="mt-10 text-center">
                            <Link
                                to="/articles"
                                className="inline-flex items-center gap-2 text-theme-accent hover:text-theme-text transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to All Articles
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ArticleDetail;
