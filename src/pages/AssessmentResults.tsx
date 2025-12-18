import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMenu } from '../hooks/useMenu';
import { useCart } from '../hooks/useCart';
import {
    ArrowRight, ArrowLeft, RefreshCw, CheckCircle,
    Package, AlertCircle, ShoppingCart
} from 'lucide-react';
import type { Product, AssessmentResponse } from '../types';

// Mapping goals to keywords to find products
const RECOMMENDATION_MAP: Record<string, string[]> = {
    'Weight Loss': ['Semaglutide', 'Tirzepatide', 'Retatrutide', 'Cagrilintide', 'Mazdutide'],
    'Muscle Gain': ['CJC-1295', 'Ipamorelin', 'Tesamorelin', 'IGF-1', 'MK-677'],
    'Anti-Aging/Longevity': ['Epitalon', 'GHK-Cu', 'NAD+', 'Thymalin', 'Foxo4'],
    'Energy & Focus': ['NAD+', 'Semax', 'Selank', 'SS-31'],
    'Better Sleep': ['DSIP', 'Epitalon', 'CJC-1295'],
    'Injury Recovery': ['BPC-157', 'TB-500', 'GHK-Cu'],
    'Skin Health': ['GHK-Cu', 'Melanotan', 'Epitalon'],
};

const AssessmentResults: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { menuItems, loading: menuLoading } = useMenu();
    const { addToCart, getTotalItems } = useCart();

    // State to hold the assessment data
    const [assessmentData, setAssessmentData] = useState<AssessmentResponse | null>(null);
    const [recommendations, setRecommendations] = useState<{
        primary: Product[];
        secondary: Product[];
    }>({ primary: [], secondary: [] });
    const [analyzing, setAnalyzing] = useState(true);

    useEffect(() => {
        // Check if we have state
        if (!location.state?.assessmentData) {
            // No data, redirect to start
            navigate('/assessment');
            return;
        }

        setAssessmentData(location.state.assessmentData);

        // Simulate analysis delay for effect
        const timer = setTimeout(() => {
            setAnalyzing(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, [location.state, navigate]);

    // Generate recommendations when menuItems or assessmentData changes
    useEffect(() => {
        if (!assessmentData || menuLoading || menuItems.length === 0) return;

        const userGoals = assessmentData.goals || [];
        const primaryProducts: Product[] = [];
        const secondaryProducts: Product[] = [];
        const addedIds = new Set<string>();

        // 1. Find Primary Recommendations (First chosen goal is usually primary)
        if (userGoals.length > 0) {
            const primaryGoal = userGoals[0];
            const keywords = RECOMMENDATION_MAP[primaryGoal] || [];

            keywords.forEach(keyword => {
                // Find products matching keyword
                const matches = menuItems.filter(p =>
                    p.name.toLowerCase().includes(keyword.toLowerCase()) ||
                    p.description.toLowerCase().includes(keyword.toLowerCase())
                );

                matches.forEach(p => {
                    if (!addedIds.has(p.id)) {
                        primaryProducts.push(p);
                        addedIds.add(p.id);
                    }
                });
            });
        }

        // 2. Find Secondary Recommendations (Rest of goals)
        const secondaryGoals = userGoals.slice(1);
        secondaryGoals.forEach(goal => {
            const keywords = RECOMMENDATION_MAP[goal] || [];
            keywords.forEach(keyword => {
                const matches = menuItems.filter(p =>
                    p.name.toLowerCase().includes(keyword.toLowerCase()) ||
                    p.description.toLowerCase().includes(keyword.toLowerCase())
                );

                matches.forEach(p => {
                    if (!addedIds.has(p.id)) {
                        secondaryProducts.push(p);
                        addedIds.add(p.id);
                    }
                });
            });
        });

        setRecommendations({
            primary: primaryProducts.slice(0, 3), // Limit to top 3
            secondary: secondaryProducts.slice(0, 3) // Limit to top 3
        });

    }, [assessmentData, menuItems, menuLoading]);

    if (!assessmentData) return null;

    if (analyzing || menuLoading) {
        return (
            <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-theme-secondary border-t-theme-accent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-theme-text mb-2">Analyzing Profile...</h2>
                <p className="text-gray-500 animate-pulse">Designing your custom research protocol based on {assessmentData.goals.length} goals.</p>
            </div>
        );
    }

    const handleAddToCart = (product: Product) => {
        addToCart(product, undefined, 1);
        alert(`Added ${product.name} to cart`);
    };

    return (
        <div className="min-h-screen bg-theme-bg pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-theme-accent transition-colors font-medium"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Back to Shop</span>
                    </button>

                    <div className="relative">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                            <ShoppingCart className="w-5 h-5 text-gray-600" />
                            <span className="font-bold text-theme-accent">{getTotalItems()}</span>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-6 md:py-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-bold mb-4">
                        <CheckCircle className="w-4 h-4" /> Assessment Complete
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-4">
                        Your Custom Protocol
                    </h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Based on your goal of <span className="font-bold text-theme-accent">{assessmentData.goals.join(', ')}</span>
                        and experience level (<span className="font-bold text-theme-accent">{assessmentData.experience_level}</span>).
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl space-y-12">

                {/* Primary Recommendations */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-theme-accent text-white flex items-center justify-center font-bold text-xl">1</div>
                        <div>
                            <h2 className="text-2xl font-bold text-theme-text">Core Research Compounds</h2>
                            <p className="text-gray-500">Primary agents for your main objective.</p>
                        </div>
                    </div>

                    {recommendations.primary.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.primary.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={handleAddToCart} isPrimary />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl shadow-soft text-center text-gray-500">
                            No direct matches found. Please contact support for specialized advice.
                        </div>
                    )}
                </section>

                {/* Secondary Recommendations */}
                {recommendations.secondary.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full bg-theme-secondary text-white flex items-center justify-center font-bold text-xl">2</div>
                            <div>
                                <h2 className="text-2xl font-bold text-theme-text">Supportive Agents</h2>
                                <p className="text-gray-500">Compounds to enhance synergy and recovery.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.secondary.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Next Steps / Disclaimer */}
                <div className="bg-white rounded-2xl shadow-lg border border-theme-secondary/20 overflow-hidden">
                    <div className="p-8 md:p-10">
                        <h3 className="text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
                            <AlertCircle className="w-6 h-6 text-theme-secondary" />
                            Research Disclaimer
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                            These recommendations are based on your self-reported research interests.
                            All compounds provided by Peptology.ph are strictly for laboratory research use only
                            and are not for human consumption.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                Browse All Compounds <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => navigate('/assessment')}
                                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:text-theme-text hover:border-theme-text transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Retake Assessment
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper Card Component
const ProductCard: React.FC<{ product: Product; onAdd: (p: Product) => void; isPrimary?: boolean }> = ({ product, onAdd, isPrimary }) => (
    <div className={`
        bg-white rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col h-full
        ${isPrimary ? 'border-2 border-theme-secondary shadow-md' : 'border border-gray-100 shadow-sm'}
    `}>
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden group">
            {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-12 h-12 opacity-50" />
                </div>
            )}
            {isPrimary && (
                <div className="absolute top-3 right-3 bg-theme-accent text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Top Match
                </div>
            )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
            <div className="mb-4 flex-grow">
                <h3 className="font-bold text-lg text-theme-text mb-1 leading-tight">{product.name}</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">{product.category}</p>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                <span className="font-bold text-lg text-theme-accent">₱{product.base_price.toLocaleString()}</span>
                <button
                    onClick={() => onAdd(product)}
                    className="p-2 bg-gray-900 text-white rounded-lg hover:bg-theme-accent transition-colors"
                    title="Add to Cart"
                >
                    <ShoppingCart className="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
);

export default AssessmentResults;
