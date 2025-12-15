import React, { useState } from 'react';
import { ShoppingCart, Menu, X, MessageCircle, Calculator } from 'lucide-react';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);




  return (
    <>
      <header className="bg-white sticky top-0 z-50 border-b-2 border-theme-secondary">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo and Brand */}
            <button
              onClick={() => { onMenuClick(); setMobileMenuOpen(false); }}
              className="flex items-center space-x-3 hover:opacity-80 transition-all group min-w-0 flex-1 max-w-[calc(100%-130px)] sm:max-w-none sm:flex-initial"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-gray-200">
                  <img
                    src="/assets/logo.jpeg"
                    alt="The Peppy Lab"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="text-left min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bold text-theme-text leading-tight whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                  The Peppy Lab
                </h1>
                <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    Peptides & Essentials
                  </span>
                </p>
              </div>
            </button>

            {/* Right Side Navigation */}
            <div className="flex items-center gap-2 md:gap-4 ml-auto">
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2 lg:gap-4">
                <button
                  onClick={onMenuClick}
                  className="text-sm font-medium text-gray-600 hover:text-theme-accent transition-colors"
                >
                  Products
                </button>

                <a
                  href="https://t.me/anntpl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 hover:text-theme-accent transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Contact
                </a>

                <button
                  onClick={() => window.location.href = '/calculator'}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-theme-accent transition-colors"
                >
                  <Calculator className="w-4 h-4" />
                  Calculator
                </button>

                <button
                  onClick={() => window.location.href = '/coa'}
                  className="text-sm font-medium text-gray-600 hover:text-theme-accent transition-colors"
                >
                  Lab Results (COA)
                </button>

                <button
                  onClick={() => {
                    window.location.href = '/calculator';
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left text-theme-text font-medium text-base hover:text-theme-accent transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Peptide Calculator
                </button>
              </nav>

              {/* Cart Button */}
              <button
                onClick={onCartClick}
                className="relative p-2 text-theme-text hover:text-theme-accent transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-theme-secondary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-theme-text hover:text-theme-accent transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute top-[65px] right-0 left-0 bg-white shadow-soft animate-slideIn border-b border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="px-4 py-6">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => {
                    onMenuClick();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-theme-text font-medium text-base hover:text-theme-accent transition-colors"
                >
                  Products
                </button>

                <button
                  onClick={() => {
                    window.location.href = '/coa';
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-theme-text font-medium text-base hover:text-theme-accent transition-colors"
                >
                  Lab Results (COA)
                </button>

                <button
                  onClick={() => {
                    window.location.href = '/calculator';
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-left text-theme-text font-medium text-base hover:text-theme-accent transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  Peptide Calculator
                </button>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                  <a
                    href="https://t.me/anntpl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-theme-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Contact Seller</span>
                  </a>
                  <a
                    href="https://t.me/+I1VczGgB-JJlMmU9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-600 hover:text-theme-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Join Community</span>
                  </a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
