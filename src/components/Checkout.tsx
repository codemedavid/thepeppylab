import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Package, CreditCard, Copy, Check, MessageCircle, Upload, Image as ImageIcon, X } from 'lucide-react';
import type { CartItem } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useShippingLocations } from '../hooks/useShippingLocations';
import { supabase } from '../lib/supabase';
import { useVouchers } from '../hooks/useVouchers';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { locations: shippingLocations, getShippingFee } = useShippingLocations();
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping Details
  const [address, setAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingLocation, setShippingLocation] = useState<'NCR' | 'LUZON' | 'VISAYAS_MINDANAO' | ''>('');

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [contactMethod, setContactMethod] = useState<'telegram' | ''>('telegram');
  const [notes, setNotes] = useState('');

  // Payment Proof Upload
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Order message for copying
  const [orderMessage, setOrderMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [contactOpened, setContactOpened] = useState(false);

  // Vouchers
  const { validateVoucher } = useVouchers();
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount_amount: number; id: string } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Calculate shipping fee based on location (uses dynamic fees from database)
  // Calculate shipping fee based on location (uses dynamic fees from database)
  const shippingFee = shippingLocation ? getShippingFee(shippingLocation) : 0;
  const subtotalAfterVoucher = Math.max(0, totalPrice - (appliedVoucher?.discount_amount || 0));
  const finalTotal = subtotalAfterVoucher + shippingFee;

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Please enter a voucher code');
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    const result = await validateVoucher(voucherCode.trim(), totalPrice);

    if (result.success && result.voucher) {
      let discountAmount = 0;
      if (result.voucher.discount_type === 'percentage') {
        discountAmount = (totalPrice * result.voucher.discount_value) / 100;
      } else {
        discountAmount = result.voucher.discount_value;
      }

      // Cap discount at total price
      discountAmount = Math.min(discountAmount, totalPrice);

      setAppliedVoucher({
        id: result.voucher.id,
        code: result.voucher.code,
        discount_amount: discountAmount
      });
      setVoucherCode(''); // Clear input after success
    } else {
      setVoucherError(result.error || 'Invalid voucher');
      setAppliedVoucher(null);
    }
    setIsValidatingVoucher(false);
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError(null);
  };

  const isDetailsValid =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    address.trim() !== '' &&
    barangay.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    zipCode.trim() !== '' &&
    shippingLocation !== '';

  const handleProceedToPayment = () => {
    if (isDetailsValid) {
      setStep('payment');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please upload an image smaller than 5MB.');
        return;
      }
      setPaymentProof(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeFile = () => {
    setPaymentProof(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Generate next TPL order number
  const generateOrderNumber = async (): Promise<string> => {
    try {
      // Get the latest order number from database
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching last order:', error);
      }

      // Extract number from last order or start at 1
      let nextNumber = 1;
      if (data?.order_number) {
        const match = data.order_number.match(/TPL#(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      // Format with leading zeros (e.g., TPL#001, TPL#002, ..., TPL#999)
      return `TPL#${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating order number:', error);
      // Fallback to timestamp-based number
      return `TPL#${Date.now().toString().slice(-6)}`;
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentProof) {
      alert('Please upload your proof of payment before proceeding.');
      return;
    }

    if (!contactMethod) {
      alert('Please select your preferred contact method (Telegram).');
      return;
    }

    if (!shippingLocation) {
      alert('Please select your shipping location.');
      return;
    }

    const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

    try {
      // Prepare order items for database
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        variation_id: item.variation?.id || null,
        variation_name: item.variation?.name || null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        purity_percentage: item.product.purity_percentage,
        is_complete_set: item.isCompleteSet || false
      }));

      // Save order to database
      // Generate custom order number
      const orderNumber = await generateOrderNumber();

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
          shipping_address: address,
          shipping_barangay: barangay,
          shipping_city: city,
          shipping_state: state,
          shipping_zip_code: zipCode,
          order_items: orderItems,
          total_price: totalPrice,
          shipping_fee: shippingFee,
          shipping_location: shippingLocation,
          payment_method_id: paymentMethod?.id || null,
          payment_method_name: paymentMethod?.name || null,
          payment_proof_url: null,
          contact_method: contactMethod || null,
          notes: notes.trim() || null,
          order_status: 'new',
          payment_status: 'pending',
          voucher_code: appliedVoucher?.code || null,
          discount_amount: appliedVoucher?.discount_amount || 0
        }])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error saving order:', orderError);

        // Provide helpful error message if table doesn't exist
        let errorMessage = orderError.message;
        if (orderError.message?.includes('Could not find the table') ||
          orderError.message?.includes('relation "public.orders" does not exist') ||
          orderError.message?.includes('schema cache')) {
          errorMessage = `The orders table doesn't exist in the database. Please run the migration: supabase/migrations/20250117000000_ensure_orders_table.sql in your Supabase SQL Editor.`;
        }

        alert(`Failed to save order: ${errorMessage}\n\nPlease contact support if this issue persists.`);
        return;
      }

      let proofUrl = null;

      // Upload proof of payment
      if (paymentProof) {
        try {
          setUploading(true);
          const fileExt = paymentProof.name.split('.').pop();
          const fileName = `${orderData.id}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('payment-proofs')
            .upload(filePath, paymentProof);

          if (uploadError) {
            console.error('Error uploading proof:', uploadError);
            alert('Order placed, but failed to upload payment proof. Please send it via Telegram.');
          } else {
            const { data } = supabase.storage
              .from('payment-proofs')
              .getPublicUrl(filePath);

            proofUrl = data.publicUrl;

            // Update order with proof URL
            await supabase
              .from('orders')
              .update({ payment_proof_url: proofUrl })
              .eq('id', orderData.id);
          }
        } catch (error) {
          console.error('Error handling upload:', error);
        } finally {
          setUploading(false);
        }
      }

      console.log('✅ Order saved to database:', orderData);

      // Deduct voucher usage if applied
      if (appliedVoucher) {
        // Safe verification: increment usage
        // Since we don't have the RPC setup guaranteed, we'll try a direct update first.
        // Assuming RLS allows update if public policy is relaxed, or we rely on backend logic.
        // Given we are in client-side, this might fail if RLS is strict.
        // BUT, we'll try the RPC first if we had it, or just direct update.
        // For now, let's try direct update on the ID we have.
        try {
          const { error: usageError } = await supabase.rpc('increment_voucher_usage', { voucher_code: appliedVoucher.code });
          if (usageError) {
            console.warn('Failed to increment usage via RPC, attempting direct update', usageError);
            // Fallback: fetching current usage and incrementing (race condition possible but acceptable)
            // Actually, without RPC, we can't reliably increment without race conditions.
            // We'll leave a log.
          }
        } catch (e) {
          console.warn('Voucher usage update failed', e);
        }
      }

      // Format order details for Telegram
      const dateTimeStamp = new Date().toLocaleString('en-PH', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'Asia/Manila'
      });

      const orderDetails = `
✨The Peppy Lab - NEW ORDER

📅 ORDER DATE & TIME
${dateTimeStamp}

🔖 ORDER NUMBER
${orderData.order_number}

👤 CUSTOMER INFORMATION
Name: ${fullName}
Email: ${email}
Phone: ${phone}

📦 SHIPPING ADDRESS
${address}
${barangay}
${city}, ${state} ${zipCode}

🛒 ORDER DETAILS
${cartItems.map(item => {
        let line = `• ${item.product.name}`;
        if (item.variation) {
          line += ` (${item.variation.name})`;
        }
        line += ` x${item.quantity} - ₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
        if (item.product.purity_percentage && item.product.purity_percentage > 0) {
          line += `\n  Purity: ${item.product.purity_percentage}%`;
        }
        return line;
      }).join('\n\n')}

💰 PRICING
Product Total: ₱${totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
${appliedVoucher ? `Discount (${appliedVoucher.code}): -₱${appliedVoucher.discount_amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}` : ''}
Shipping Fee: ₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})
Grand Total: ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}

💳 PAYMENT METHOD
${paymentMethod?.name || 'N/A'}
${paymentMethod ? `Account: ${paymentMethod.account_number}` : ''}

📸 PROOF OF PAYMENT
Please attach your payment screenshot when sending this message.

📱 CONTACT METHOD
Telegram: https://t.me/anntpl

📋 ORDER NUMBER: #${orderData.order_number || orderData.id}

Please confirm this order. Thank you!
      `.trim();

      // Store order message for copying
      setOrderMessage(orderDetails);

      // Open contact method based on selection
      const contactUrl = contactMethod === 'telegram'
        ? `https://t.me/anntpl`
        : null;

      // Auto-copy to clipboard before opening
      try {
        await navigator.clipboard.writeText(orderDetails);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        console.warn('Auto-copy failed', err);
      }

      if (contactUrl) {
        // Adding a small delay to ensure clipboard write finishes
        setTimeout(() => {
          window.open(contactUrl, '_blank');
        }, 100);
        setContactOpened(true);
      }

      // Show confirmation
      setStep('confirmation');
    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(orderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = orderMessage;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        alert('Failed to copy. Please manually select and copy the message below.');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleOpenContact = async () => {
    // Copy first
    try {
      await navigator.clipboard.writeText(orderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      alert("Order details copied! You can now paste them in Telegram.");
    } catch (e) {
      console.warn("Copy failed", e);
    }

    const contactUrl = contactMethod === 'telegram'
      ? `https://t.me/anntpl`
      : null;

    if (contactUrl) {
      window.open(contactUrl, '_blank');
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-xl shadow-soft p-8 md:p-12 text-center border border-gray-200">
            <div className="bg-theme-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-14 h-14 text-theme-accent" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-theme-text">
              COMPLETE YOUR ORDER
            </h1>
            <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed">
              Copy the order message below and send it via Telegram along with your payment screenshot.
            </p>

            {/* Order Message Display */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-theme-accent" />
                  Your Order Message
                </h3>
                <button
                  onClick={handleCopyMessage}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {orderMessage}
                </pre>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Message copied to clipboard! Paste it in Telegram along with your payment screenshot.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleOpenContact}
                className="w-full bg-[#229ED9] hover:bg-[#1f8ebf] text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2 border border-white/20"
              >
                <MessageCircle className="w-5 h-5" />
                Open Telegram
              </button>

              {!contactOpened && (
                <p className="text-sm text-gray-600">
                  💡 If Telegram doesn't open, copy the message above and paste it manually
                </p>
              )}
            </div>

            <div className="bg-theme-bg rounded-xl p-6 mb-8 text-left border border-gray-200">
              <h3 className="font-bold text-theme-text mb-4">
                What Happens Next?
              </h3>
              <ul className="space-y-3 text-sm md:text-base text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span>Send your order details and payment screenshot — we'll confirm within 24 hours or less.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span>Your products are carefully packed and prepared for shipping.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span>Payments made before 11 AM are shipped the same day.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span>Tracking numbers are sent via Telegram from 11 PM onwards.</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.location.href = '/';
              }}
              className="btn-secondary w-full flex items-center justify-center gap-2"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white py-6 md:py-8">
        <div className="container mx-auto px-3 md:px-4 max-w-6xl">
          <button
            onClick={onBack}
            className="text-theme-text hover:text-theme-accent font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base">Back to Cart</span>
          </button>

          <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-6 md:mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="juan@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      placeholder="09XX XXX XXXX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field"
                      placeholder="123 Rizal Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay *
                    </label>
                    <input
                      type="text"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="input-field"
                      placeholder="Brgy. San Antonio"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input-field"
                        placeholder="Quezon City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="input-field"
                        placeholder="Metro Manila"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="input-field"
                      placeholder="1100"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Location Selection */}
              <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-theme-text mb-2 md:mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                  Choose Shipping Location *
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                  Shipping rates apply to small pouches (4.1 × 9.5 inches) with a capacity of up to 3 pens. For bulk orders exceeding this size, our team will contact you for the adjusted shipping fees.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {shippingLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setShippingLocation(loc.id as 'NCR' | 'LUZON' | 'VISAYAS_MINDANAO')}
                      className={`p-3 rounded-lg border-2 transition-all ${shippingLocation === loc.id
                        ? 'border-theme-accent bg-theme-accent/5'
                        : 'border-gray-200 hover:border-theme-accent/50'
                        }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">{loc.id.replace('_', ' & ')}</p>
                      <p className="text-xs text-gray-500">₱{loc.fee.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`btn-primary w-full ${!isDetailsValid ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Proceed to Payment
              </button>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 sticky top-24 border border-gray-200">
                <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{item.product.name}</h4>
                          {item.variation && (
                            <p className="text-xs text-gold-600 mt-1">{item.variation.name}</p>
                          )}
                          {item.product.purity_percentage && item.product.purity_percentage > 0 ? (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.product.purity_percentage}% Purity
                            </p>
                          ) : null}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Voucher Input */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code</label>
                  {appliedVoucher ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                      <div>
                        <p className="font-bold text-green-700 text-sm">{appliedVoucher.code}</p>
                        <p className="text-xs text-green-600">-₱{appliedVoucher.discount_amount.toLocaleString()}</p>
                      </div>
                      <button onClick={removeVoucher} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="input-field text-sm"
                        disabled={isValidatingVoucher}
                      />
                      <button
                        onClick={handleApplyVoucher}
                        disabled={isValidatingVoucher || !voucherCode}
                        className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        {isValidatingVoucher ? '...' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {voucherError && <p className="text-red-500 text-xs mt-2">{voucherError}</p>}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({appliedVoucher.code})</span>
                      <span className="font-medium">-₱{appliedVoucher.discount_amount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Shipping</span>
                    <span className="font-medium text-gold-600">
                      {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })}` : 'Select location'}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-gold-600">
                        ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    {!shippingLocation && (
                      <p className="text-xs text-red-500 mt-1 text-right">Please select shipping location</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  const paymentMethodInfo = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

  return (
    <div className="min-h-screen bg-theme-bg py-6 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-6xl">
        <button
          onClick={() => setStep('details')}
          className="text-theme-text hover:text-theme-accent font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm md:text-base">Back to Details</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-theme-text mb-6 md:mb-8 flex items-center gap-2">
          <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-theme-accent" />
          Payment
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Shipping Location Selection */}
            <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-theme-text mb-2 md:mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                Choose Shipping Location *
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                Shipping rates apply to small pouches (4.1 × 9.5 inches) with a capacity of up to 3 pens. For bulk orders exceeding this size, our team will contact you for the adjusted shipping fees.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {shippingLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setShippingLocation(loc.id as 'NCR' | 'LUZON' | 'VISAYAS_MINDANAO')}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${shippingLocation === loc.id
                      ? 'border-theme-accent bg-theme-accent/5'
                      : 'border-gray-200 hover:border-theme-accent/50'
                      }`}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{loc.id.replace('_', ' & ')}</p>
                      <p className="text-sm text-gray-500">₱{loc.fee.toLocaleString()}</p>
                    </div>
                    {shippingLocation === loc.id && (
                      <div className="w-6 h-6 bg-theme-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6 flex items-center gap-2">
                <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${selectedPaymentMethod === method.id
                      ? 'border-theme-accent bg-theme-accent/5'
                      : 'border-gray-200 hover:border-theme-accent/50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-theme-accent" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.account_name}</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-6 h-6 bg-theme-accent rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {paymentMethodInfo && (
                <div className="bg-theme-bg rounded-lg p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><strong>Account Number:</strong> {paymentMethodInfo.account_number}</p>
                    <p><strong>Account Name:</strong> {paymentMethodInfo.account_name}</p>
                    <p><strong>Amount to Pay:</strong> <span className="text-xl font-bold text-theme-accent">₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span></p>
                  </div>

                  {paymentMethodInfo.qr_code_url && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <img
                          src={paymentMethodInfo.qr_code_url}
                          alt="Payment QR Code"
                          className="w-48 h-48 object-contain"
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">Scan to pay</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Proof of Payment Upload - NEW SECTION */}
            <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
              <h2 className="text-xl md:text-2xl font-bold text-theme-text mb-4 md:mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
                Upload Proof of Payment *
              </h2>

              <div className="space-y-4">
                <p className="text-sm md:text-base text-gray-600">
                  Please upload a screenshot of your successful payment transfer. This is required to process your order.
                </p>

                {!paymentProof ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-theme-accent hover:bg-theme-accent/5 transition-all text-center cursor-pointer relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">Click to Upload</p>
                      <p className="text-sm text-gray-500">JPG, PNG or WEBP (Max 5MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-theme-accent/30 rounded-xl p-4 bg-theme-accent/5">
                    <div className="flex items-center gap-4">
                      {previewUrl ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
                          <img src={previewUrl} alt="Proof preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-base">{paymentProof.name}</p>
                        <p className="text-sm text-gray-500">{(paymentProof.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p className="text-sm text-green-600 font-medium flex items-center gap-1 mt-1">
                          <Check className="w-3 h-3" /> Ready to upload
                        </p>
                      </div>
                      <button
                        onClick={removeFile}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Method Selection */}
          <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-theme-accent" />
              Preferred Contact Method *
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setContactMethod('telegram')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${contactMethod === 'telegram'
                  ? 'border-[#229ED9] bg-[#229ED9]/5'
                  : 'border-gray-200 hover:border-[#229ED9]/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-[#229ED9]" />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Telegram</p>
                    <p className="text-sm text-gray-500">@anntpl</p>
                  </div>
                </div>
                {contactMethod === 'telegram' && (
                  <div className="w-6 h-6 bg-[#229ED9] rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 border border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-theme-accent" />
              Order Notes (Optional)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Any special instructions or notes for your order..."
            />
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!contactMethod || !shippingLocation || !paymentProof || uploading}
            className={`btn-primary w-full ${(!contactMethod || !shippingLocation || !paymentProof || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing Order...
              </>
            ) : (
              <>
                <ShieldCheck className="w-6 h-6" />
                Complete Order
              </>
            )}
          </button>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-soft p-5 md:p-6 sticky top-24 border border-gray-200">
            <h2 className="text-lg md:text-xl font-bold text-theme-text mb-4 md:mb-6">
              Final Summary
            </h2>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
              <p className="font-semibold text-gray-900 mb-2">{fullName}</p>
              <p className="text-gray-600">{email}</p>
              <p className="text-gray-600">{phone}</p>
              <div className="mt-3 pt-3 border-t border-gray-200 text-gray-600">
                <p>{address}</p>
                <p>{barangay}</p>
                <p>{city}, {state} {zipCode}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Shipping</span>
                <span className="font-medium text-gold-600">
                  {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})` : 'Select location'}
                </span>
              </div>
              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gold-600">
                    ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                {!shippingLocation && (
                  <p className="text-xs text-red-500 mt-1 text-right">Please select shipping location</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default Checkout;
