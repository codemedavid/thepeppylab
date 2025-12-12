import React from 'react';
import { ArrowRight } from 'lucide-react';

type HeroProps = {
  onShopAll?: () => void;
};

const Hero: React.FC<HeroProps> = ({ onShopAll }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-theme-bg via-white to-theme-bg pt-12 pb-16 md:pt-20 md:pb-24 lg:pt-28 lg:pb-32 border-b-2 border-theme-secondary">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-theme-accent/5 blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-80 h-80 rounded-full bg-theme-secondary/5 blur-3xl opacity-50 pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge with cute icon */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-theme-secondary shadow-soft mb-6 md:mb-8 animate-fadeIn">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-theme-secondary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-theme-secondary"></span>
            </span>
            <span className="text-xs md:text-sm font-medium text-gray-600 tracking-wide">
              🧪 Peptides & Essentials
            </span>
          </div>

          {/* Main Heading with decorative underline */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-theme-text mb-6 tracking-tight leading-tight relative inline-block">
            Welcome to <span className="text-theme-accent relative">
              The Peppy Lab
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-theme-secondary via-theme-accent to-theme-secondary rounded-full opacity-30"></div>
            </span>
          </h1>

          {/* Subheading with cute emoji */}
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            At Peppy Lab, we offer high-quality peptides to support weight loss, glowing skin, wellness, and confidence. Because looking and feeling your best doesn't have to be expensive. 💕
          </p>

          {/* CTA Buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 md:mb-16">
            <button
              className="btn-primary w-full sm:w-auto group flex items-center justify-center gap-2 shadow-medium hover:shadow-lg"
              onClick={onShopAll}
            >
              Shop All Products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>



        </div>
      </div>
    </div>
  );
};

export default Hero;

