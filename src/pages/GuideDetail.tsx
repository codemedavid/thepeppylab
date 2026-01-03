import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Download, Calendar, ChevronRight } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useGuides, Guide } from '../hooks/useGuides';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Simple markdown-like renderer
const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-4 text-gray-600">
                    {listItems.map((item, i) => (
                        <li key={i}>{item}</li>
                    ))}
                </ul>
            );
            listItems = [];
        }
        inList = false;
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Headers
        if (trimmed.startsWith('# ')) {
            flushList();
            elements.push(
                <h1 key={index} className="text-3xl font-bold text-theme-text mb-4 mt-6">
                    {trimmed.slice(2)}
                </h1>
            );
        } else if (trimmed.startsWith('## ')) {
            flushList();
            elements.push(
                <h2 key={index} className="text-2xl font-semibold text-theme-text mb-3 mt-5">
                    {trimmed.slice(3)}
                </h2>
            );
        } else if (trimmed.startsWith('### ')) {
            flushList();
            elements.push(
                <h3 key={index} className="text-xl font-semibold text-theme-text mb-2 mt-4">
                    {trimmed.slice(4)}
                </h3>
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
        // Bold text handling
        else if (trimmed) {
            flushList();
            const formattedLine = trimmed
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<strong>$1</strong>');
            elements.push(
                <p
                    key={index}
                    className="text-gray-600 mb-3 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        } else if (!inList) {
            // Empty line - add spacing
            elements.push(<div key={index} className="h-2" />);
        }
    });

    flushList();
    return elements;
};

const GuideDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { guides, getGuideById, loading: guidesLoading } = useGuides();
    const [guide, setGuide] = useState<Guide | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadGuide = async () => {
            if (!id) return;
            setLoading(true);
            const data = await getGuideById(id);
            setGuide(data);
            setLoading(false);
        };
        loadGuide();
    }, [id, getGuideById]);

    // Get related guides (same category, different guide)
    const relatedGuides = guides.filter(
        g => g.category === guide?.category && g.id !== guide?.id
    ).slice(0, 3);

    if (loading || guidesLoading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin h-10 w-10 border-4 border-theme-accent border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading guide...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!guide) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col">
                <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />
                <main className="flex-grow container mx-auto px-4 py-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-theme-text mb-2">Guide Not Found</h1>
                    <p className="text-gray-600 mb-6">The guide you're looking for doesn't exist or has been removed.</p>
                    <Link to="/guides" className="btn-primary inline-flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Guides
                    </Link>
                </main>
                <Footer />
            </div>
        );
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col">
            <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => { }} />

            <main className="flex-grow">
                {/* Breadcrumb */}
                <div className="container mx-auto px-4 py-6">
                    <nav className="flex items-center gap-2 text-sm text-gray-500">
                        <Link to="/" className="hover:text-theme-accent transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link to="/guides" className="hover:text-theme-accent transition-colors">Guides</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-theme-text font-medium truncate">{guide.title}</span>
                    </nav>
                </div>

                {/* Hero Section */}
                <div className="bg-gradient-to-br from-theme-secondary/30 to-theme-accent/10 py-12 md:py-16">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-sm font-medium text-theme-accent bg-white px-3 py-1 rounded-full shadow-soft">
                                    {guide.category}
                                </span>
                                {guide.pdf_url && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Download className="w-4 h-4" />
                                        PDF Available
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-theme-text mb-4">
                                {guide.title}
                            </h1>
                            <p className="text-lg text-gray-600 mb-6">
                                {guide.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {formatDate(guide.created_at)}
                                </span>
                                {guide.pdf_url && (
                                    <a
                                        href={guide.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-10 md:py-14">
                    <div className="max-w-4xl mx-auto">
                        <article className="bg-white rounded-2xl border-2 border-theme-secondary p-6 md:p-10 shadow-soft">
                            {renderContent(guide.content)}
                        </article>

                        {/* Related Guides */}
                        {relatedGuides.length > 0 && (
                            <div className="mt-12">
                                <h2 className="text-2xl font-semibold text-theme-text mb-6">Related Guides</h2>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {relatedGuides.map(related => (
                                        <Link
                                            key={related.id}
                                            to={`/guides/${related.id}`}
                                            className="bg-white rounded-xl border-2 border-theme-secondary p-4 shadow-soft hover:shadow-medium transition-all group"
                                        >
                                            <h3 className="font-medium text-theme-text group-hover:text-theme-accent transition-colors mb-2 line-clamp-2">
                                                {related.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{related.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Back Button */}
                        <div className="mt-10 text-center">
                            <Link
                                to="/guides"
                                className="inline-flex items-center gap-2 text-theme-accent hover:text-theme-text transition-colors font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to All Guides
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default GuideDetail;
