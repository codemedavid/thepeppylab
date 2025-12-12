import React from 'react';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (index: number, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout,
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-xl shadow-soft p-12 border border-gray-200">
            <div className="bg-theme-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-theme-accent" />
            </div>
            <h2 className="text-2xl font-bold text-theme-text mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-8">
              Start adding amazing products to your cart!
            </p>
            <button
              onClick={onContinueShopping}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  // Shipping fee will be discussed via chat
  const finalTotal = totalPrice;

  return (
    <div className="min-h-screen bg-theme-bg py-6 md:py-8">
      <div className="container mx-auto px-3 md:px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <button
            onClick={onContinueShopping}
            className="text-theme-text hover:text-theme-accent font-medium mb-4 flex items-center gap-2 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base">Continue Shopping</span>
          </button>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-theme-text flex items-center gap-2">
              Shopping Cart
            </h1>
            <button
              onClick={clearCart}
              className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 md:gap-2 transition-colors text-sm md:text-base hover:scale-105 transform"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-soft hover:shadow-medium p-4 md:p-6 transition-all animate-fadeIn border border-gray-200"
              >
                <div className="flex gap-4 md:gap-6">
                  {/* Product Image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl md:text-4xl font-bold text-theme-accent">
                        {item.product.name.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-1 truncate">
                          {item.product.name}
                        </h3>
                        {item.variation && (
                          <p className="text-xs md:text-sm text-gray-700 font-medium">
                            Variation: {item.variation.name}
                          </p>
                        )}
                        {item.isCompleteSet && (
                          <p className="text-xs md:text-sm text-purple-700 font-semibold flex items-center gap-1">
                            🎁 Complete Set
                          </p>
                        )}
                        {item.product.purity_percentage && item.product.purity_percentage > 0 ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium bg-green-100 text-green-700">
                              {item.product.purity_percentage}% Pure
                            </span>
                          </div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="p-1.5 md:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-2"
                        title="Remove from cart"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex justify-between items-center mt-3 md:mt-4">
                      <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white shadow-sm">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="p-1.5 md:p-2 hover:bg-gray-50 transition-colors rounded-l-lg"
                        >
                          <Minus className="w-3 h-3 md:w-4 md:h-4 text-black" />
                        </button>
                        <span className="px-3 md:px-4 py-1.5 md:py-2 font-bold text-gray-800 min-w-[32px] md:min-w-[40px] text-center text-sm md:text-base">
                          {item.quantity}
                          {(() => {
                            const availableStock = item.variation ? item.variation.stock_quantity : item.product.stock_quantity;
                            if (availableStock > 0) {
                              return <span className="block text-[10px] text-gray-500">/ {availableStock}</span>;
                            }
                            return null;
                          })()}
                        </span>
                        <button
                          onClick={() => {
                            const availableStock = item.variation ? item.variation.stock_quantity : item.product.stock_quantity;
                            if (item.quantity >= availableStock) {
                              alert(`Only ${availableStock} item(s) available in stock.`);
                              return;
                            }
                            updateQuantity(index, item.quantity + 1);
                          }}
                          disabled={(() => {
                            const availableStock = item.variation ? item.variation.stock_quantity : item.product.stock_quantity;
                            return item.quantity >= availableStock;
                          })()}
                          className="p-1.5 md:p-2 hover:bg-gray-50 transition-colors rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-3 h-3 md:w-4 md:h-4 text-black" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-xl md:text-2xl font-bold text-black">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500">
                          ₱{item.price.toLocaleString('en-PH', { minimumFractionDigits: 0 })} each
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-soft p-5 md:p-6 sticky top-24 border border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-700 text-sm md:text-base">
                  <span>Subtotal ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-semibold">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex flex-col gap-1 text-gray-700 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-gray-700 font-medium">Choose your location at checkout.</span>
                  </div>
                  <p className="text-gray-500">
                    Shipping rates apply to small pouches (4.1 × 9.5 inches) with a capacity of up to 3 pens. For bulk orders exceeding this size, our team will contact you for the adjusted shipping fees.
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-gray-200 pt-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base md:text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl md:text-3xl font-bold text-theme-text">
                      ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-right">+ Shipping fee (calculated on checkout)</p>
                </div>
              </div>

              <button
                onClick={onCheckout}
                className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Proceed to Checkout
              </button>

              <button
                onClick={onContinueShopping}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Continue Shopping
              </button>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                <p className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <span className="text-green-500 text-lg">✓</span>
                  Secure checkout
                </p>
                <p className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <span className="text-green-500 text-lg">✓</span>
                  Lab-tested products
                </p>
                <p className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                  <span className="text-green-500 text-lg">✓</span>
                  Fast delivery 🚚
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
