import React, { useState } from 'react';
import { useCOA } from '../hooks/useCOA';
import { FileCheck, X, ZoomIn, ArrowLeft } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

const COA: React.FC = () => {
    const { coas, loading } = useCOA();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-theme-bg flex flex-col">
            <Header cartItemsCount={0} onCartClick={() => { }} onMenuClick={() => window.location.href = '/'} />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <button
                    onClick={() => window.location.href = '/'}
                    className="text-gray-600 hover:text-theme-accent font-medium mb-6 flex items-center gap-2 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm md:text-base">Back to Home</span>
                </button>

                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-white rounded-full shadow-sm mb-4">
                        <FileCheck className="w-8 h-8 text-theme-accent" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-theme-text mb-4">Certificates of Analysis</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        Transparency is our priority. Browse our lab reports to verify the purity and quality of our products.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {coas.map((coa) => (
                            <div
                                key={coa.id}
                                className="group bg-white rounded-xl shadow-soft overflow-hidden cursor-pointer transform transition-all hover:-translate-y-1 hover:shadow-medium border border-gray-100"
                                onClick={() => setSelectedImage(coa.image_url)}
                            >
                                <div className="aspect-[3/4] relative overflow-hidden bg-gray-50">
                                    <img
                                        src={coa.image_url}
                                        alt={coa.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                        <div className="bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                            <ZoomIn className="w-5 h-5 text-gray-800" />
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-gray-50">
                                    <h3 className="font-bold text-gray-800 text-lg truncate">{coa.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Verified Report • {new Date(coa.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && coas.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                        <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No certificates available yet</h3>
                        <p className="text-gray-500">Please check back later for updates.</p>
                    </div>
                )}
            </main>

            <Footer />

            {/* Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Certificate Full View"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default COA;
