import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react';
import type { Product, ProductVariation } from '../types';

interface MenuItemCardProps {
  product: Product;
  onAddToCart: (product: Product, variation?: ProductVariation, quantity?: number, isCompleteSet?: boolean) => void;
  cartQuantity?: number;
  onUpdateQuantity?: (index: number, quantity: number) => void;
  onProductClick?: (product: Product) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  product,
  onAddToCart,
  cartQuantity = 0,
  onProductClick,
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [isCompleteSet, setIsCompleteSet] = useState(false); // Track if customer wants complete set


  // Calculate price based on complete set selection
  const getCurrentPrice = () => {
    if (isCompleteSet && product.is_complete_set && product.complete_set_price) {
      return product.complete_set_price;
    }
    return selectedVariation
      ? selectedVariation.price
      : (product.discount_active && product.discount_price)
        ? product.discount_price
        : product.base_price;
  };

  const currentPrice = getCurrentPrice();
  const hasDiscount = !selectedVariation && product.discount_active && product.discount_price && !isCompleteSet;

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariation, quantity, isCompleteSet);
    setQuantity(1);
  };

  const availableStock = selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity;

  // Check if product has any available stock (either in variations or product itself)
  const hasAnyStock = product.variations && product.variations.length > 0
    ? product.variations.some(v => v.stock_quantity > 0)
    : product.stock_quantity > 0;

  const incrementQuantity = () => {
    setQuantity(prev => {
      if (prev >= availableStock) {
        alert(`Only ${availableStock} item(s) available in stock.`);
        return prev;
      }
      return prev + 1;
    });
  };

  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <div className="card h-full flex flex-col group relative border-2 border-theme-secondary hover:border-theme-accent transition-colors">
      {/* Click overlay for product details */}
      <div
        onClick={() => onProductClick?.(product)}
        className="absolute inset-x-0 top-0 h-48 z-10 cursor-pointer"
        title="View details"
      />

      {/* Product Image */}
      <div className="relative h-40 bg-gray-50 overflow-hidden rounded-t-lg">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-10 h-10" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          {product.featured && (
            <span className="badge badge-accent text-[10px] px-1.5 py-0.5">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="badge bg-theme-secondary text-white text-[10px] px-1.5 py-0.5">
              {Math.round((1 - currentPrice / product.base_price) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Stock Status Overlay */}
        {!hasAnyStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-900 text-white px-2 py-1 text-[10px] font-semibold rounded">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="font-semibold text-theme-text text-sm mb-0.5 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-[2rem] leading-snug">{product.description}</p>

        {/* Variations (Sizes) */}
        <div className="mb-2 space-y-1.5">
          {product.variations && product.variations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.variations.slice(0, 3).map((variation) => {
                const isOutOfStock = variation.stock_quantity === 0;
                return (
                  <button
                    key={variation.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        setSelectedVariation(variation);
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`
                      px-1.5 py-0.5 text-[10px] rounded border transition-colors relative z-20
                      ${selectedVariation?.id === variation.id && !isOutOfStock
                        ? 'bg-theme-text text-white border-theme-text'
                        : isOutOfStock
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-theme-text'
                      }
                    `}
                  >
                    {variation.name}
                  </button>
                );
              })}
              {product.variations.length > 3 && (
                <span className="text-[10px] text-gray-400 self-center">
                  +{product.variations.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Vial Only vs Complete Set Options */}
          {product.is_complete_set && product.complete_set_price && (
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompleteSet(false);
                }}
                className={`
                  px-1.5 py-0.5 text-[10px] rounded border transition-colors relative z-20
                  ${!isCompleteSet
                    ? 'bg-theme-text text-white border-theme-text'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-theme-text'
                  }
                `}
              >
                Vial Only
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompleteSet(true);
                }}
                className={`
                  px-1.5 py-0.5 text-[10px] rounded border transition-colors relative z-20
                  ${isCompleteSet
                    ? 'bg-[#FFE8D6] text-theme-text border-[#FFE8D6]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#FFE8D6]'
                  }
                `}
              >
                🎁 Complete Set
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Price and Cart Actions */}
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-theme-text">
              ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                ₱{product.base_price.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 relative z-20">
            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-200 rounded-md flex-shrink-0 h-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementQuantity();
                }}
                className="w-7 h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                disabled={!hasAnyStock}
              >
                <Minus className="w-3 h-3 text-gray-500" />
              </button>
              <span className="w-6 text-center text-xs font-medium text-theme-text leading-none">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  incrementQuantity();
                }}
                className="w-7 h-full flex items-center justify-center hover:bg-gray-50 transition-colors"
                disabled={quantity >= availableStock || !hasAnyStock}
              >
                <Plus className="w-3 h-3 text-gray-500" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (quantity > availableStock) {
                  alert(`Only ${availableStock} item(s) available in stock.`);
                  setQuantity(availableStock);
                  return;
                }
                handleAddToCart();
              }}
              disabled={!hasAnyStock || availableStock === 0}
              className="flex-1 min-w-0 bg-theme-text text-white h-8 px-2 rounded-md text-xs font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              <ShoppingCart className="w-3 h-3 flex-shrink-0" />
              <span>Add</span>
            </button>
          </div>

          {/* Cart Status */}
          {cartQuantity > 0 && (
            <div className="text-center text-[10px] text-theme-accent font-medium mt-0.5">
              {cartQuantity} in cart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
