'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { formatMoney } from '@/data/catalog';
import {
  NEPAL_PROVINCES,
  isValidNepalPhone,
  ProvinceInfo,
} from '@/data/nepalLocations';
import {
  checkoutFormSchema,
  CheckoutFormValues,
  PAYMENT_METHODS,
  PaymentMethod,
} from '@/types/checkout';

import { submitOrderAction } from '@/app/actions/checkout';
import { getUserAddressesAction } from '@/app/actions/addresses';
import { authClient } from '@/lib/auth-client';

type CheckoutStep = 'delivery' | 'payment' | 'review';

export default function CheckoutPage() {
  const router = useRouter();
  const itemsMap = useCartStore((s) => s.items);
  const isHydrated = useCartStore((s) => s.isHydrated);
  const clearCart = useCartStore((s) => s.clearCart);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('delivery');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  const { data: session } = authClient.useSession();

  const cartItems = isHydrated ? Object.values(itemsMap) : [];
  const totalCount = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.quantity, 0)
    : 0;
  const subtotal = isHydrated
    ? cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0)
    : 0;

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      phone: '',
      email: '',
      province: 'bagmati',
      district: 'Kathmandu',
      municipality: '',
      ward: '',
      areaTole: '',
      streetLandmark: '',
      deliveryInstructions: '',
      paymentMethod: 'cod',
    },
  });

  // Pre-fill user data & load saved addresses if authenticated
  useEffect(() => {
    if (session?.user) {
      if (session.user.name && !watch('fullName')) {
        setValue('fullName', session.user.name);
      }
      if (session.user.email && !watch('email')) {
        setValue('email', session.user.email);
      }
      getUserAddressesAction().then((res) => {
        if (res.success && res.addresses && res.addresses.length > 0) {
          setSavedAddresses(res.addresses);
        }
      });
    }
  }, [session, setValue, watch]);

  const handleSelectSavedAddress = (addr: any) => {
    if (addr.fullName) setValue('fullName', addr.fullName);
    if (addr.phone) setValue('phone', addr.phone);
    if (addr.province) setValue('province', addr.province);
    if (addr.district) setValue('district', addr.district);
    if (addr.municipality) setValue('municipality', addr.municipality);
    if (addr.ward) setValue('ward', addr.ward);
    if (addr.areaTole) setValue('areaTole', addr.areaTole);
    if (addr.streetLandmark) setValue('streetLandmark', addr.streetLandmark);
    if (addr.deliveryInstructions) setValue('deliveryInstructions', addr.deliveryInstructions);
  };

  const selectedProvinceId = watch('province');
  const selectedPaymentMethod = watch('paymentMethod');
  const formValues = watch();

  // Find districts for the selected province
  const currentProvince = NEPAL_PROVINCES.find((p) => p.id === selectedProvinceId) || NEPAL_PROVINCES[2];

  // Update district when province changes if current district doesn't belong
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provId = e.target.value;
    setValue('province', provId);
    const prov = NEPAL_PROVINCES.find((p) => p.id === provId);
    if (prov && prov.districts.length > 0) {
      setValue('district', prov.districts[0]);
    }
  };

  // Step navigation validations
  const goToPaymentStep = async () => {
    const valid = await trigger([
      'fullName',
      'phone',
      'email',
      'province',
      'district',
      'municipality',
      'ward',
      'areaTole',
    ]);
    if (valid) {
      setCurrentStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToReviewStep = async () => {
    const valid = await trigger('paymentMethod');
    if (valid) {
      setCurrentStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Authoritative server submission handler
  const onFinalSubmit = async (data: CheckoutFormValues) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const res = await submitOrderAction({
        customer: {
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
        },
        deliveryAddress: {
          country: 'Nepal',
          province: currentProvince.name,
          district: data.district,
          municipality: data.municipality,
          ward: data.ward,
          areaTole: data.areaTole,
          streetLandmark: data.streetLandmark || undefined,
          deliveryInstructions: data.deliveryInstructions || undefined,
        },
        paymentMethod: data.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        notes: data.deliveryInstructions || undefined,
      });

      if (!res.success) {
        setSubmissionError(res.error || 'Failed to place order.');
        setIsSubmitting(false);
        return;
      }

      // Handle Online Payment Gateway (eSewa / NPS)
      if (res.paymentInit?.formAction && res.paymentInit?.formData) {
        clearCart();
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = res.paymentInit.formAction;
        Object.entries(res.paymentInit.formData).forEach(([k, v]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = k;
          input.value = v;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      if (res.paymentInit?.redirectUrl) {
        clearCart();
        window.location.href = res.paymentInit.redirectUrl;
        return;
      }

      // Cash on Delivery: Clear client cart and navigate to order confirmation view
      clearCart();
      router.push(`/order-confirmation/${res.orderReference}`);
    } catch (err: any) {
      setSubmissionError(err?.message || 'A network error occurred while connecting to the server.');
      setIsSubmitting(false);
    }
  };

  // Render empty cart state
  if (isHydrated && cartItems.length === 0) {
    return (
      <div className="checkout-page-wrapper">
        <header className="checkout-minimal-header">
          <div className="checkout-header-inner">
            <Link href="/" className="wordmark" aria-label="Deal Drip home">
              <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
              <span>DEAL DRIP</span>
            </Link>
          </div>
        </header>

        <div className="checkout-empty-container">
          <div className="empty-symbol" aria-hidden="true">
            ✳
          </div>
          <h1>Your cart is empty.</h1>
          <p>
            You do not have any items in your cart to proceed with checkout.
            Explore our curated 3D catalog to select your next setup.
          </p>
          <Link href="/#collection" className="button button-lime">
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page-wrapper">
      {/* Distraction-free clean header */}
      <header className="checkout-minimal-header">
        <div className="checkout-header-inner">
          <Link href="/" className="wordmark" aria-label="Deal Drip home">
            <img src="/assets/logo.png" alt="" className="brand-logo" width="28" height="28" />
            <span>DEAL DRIP</span>
          </Link>

          <div className="checkout-header-actions">
            <Link href="/cart" className="checkout-back-link">
              <ArrowLeft size={16} />
              <span>Back to Cart</span>
            </Link>
            <div className="checkout-secure-badge">
              <Lock size={15} />
              <span>Secure Nepal Checkout</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Collapsible Order Summary Bar */}
      <div className="checkout-mobile-summary-bar">
        <button
          type="button"
          className="mobile-summary-toggle-btn"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          aria-expanded={mobileSummaryOpen}
        >
          <div className="mobile-toggle-left">
            <span>Order Summary ({totalCount} items)</span>
            {mobileSummaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
          <strong className="mobile-toggle-price">{formatMoney(subtotal)}</strong>
        </button>

        {mobileSummaryOpen && (
          <div className="mobile-summary-dropdown">
            <ul className="checkout-items-mini-list">
              {cartItems.map((item) => (
                <li key={item.id} className="mini-item-row">
                  <img src={item.thumbnail} alt="" width={48} height={48} />
                  <div className="mini-item-info">
                    <span className="mini-item-name">{item.name}</span>
                    {item.variantName && (
                      <span className="mini-item-variant">{item.variantName}</span>
                    )}
                    <span className="mini-item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="mini-item-price">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mobile-summary-subtotal-row">
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <div className="mobile-summary-shipping-row">
              <span>Shipping</span>
              <span className="shipping-tag">Calculated at checkout</span>
            </div>
          </div>
        )}
      </div>

      <main className="checkout-main-container">
        {/* Step Indicator */}
        <div className="checkout-stepper-nav" role="tablist" aria-label="Checkout Progress">
          <button
            type="button"
            className={`step-nav-btn ${currentStep === 'delivery' ? 'active' : ''} ${currentStep === 'payment' || currentStep === 'review' ? 'completed' : ''}`}
            onClick={() => setCurrentStep('delivery')}
          >
            <span className="step-number">1</span>
            <span className="step-text">Contact & Delivery</span>
          </button>
          <span className="step-nav-separator">›</span>

          <button
            type="button"
            className={`step-nav-btn ${currentStep === 'payment' ? 'active' : ''} ${currentStep === 'review' ? 'completed' : ''}`}
            onClick={goToPaymentStep}
          >
            <span className="step-number">2</span>
            <span className="step-text">Payment Method</span>
          </button>
          <span className="step-nav-separator">›</span>

          <button
            type="button"
            className={`step-nav-btn ${currentStep === 'review' ? 'active' : ''}`}
            onClick={goToReviewStep}
          >
            <span className="step-number">3</span>
            <span className="step-text">Review & Submit</span>
          </button>
        </div>

        <div className="checkout-content-grid">
          {/* Left Form Column */}
          <div className="checkout-form-column">
            <form onSubmit={handleSubmit(onFinalSubmit)} noValidate>
              {/* STEP 1: Contact & Nepal Delivery Address */}
              {currentStep === 'delivery' && (
                <div className="checkout-step-panel">
                  <div className="step-header">
                    <div className="guest-badge">
                      <ShieldCheck size={16} />
                      <span>{session?.user ? 'Authenticated Checkout' : 'Guest Checkout Enabled'}</span>
                    </div>
                    <h2>Contact & Nepal Delivery Details</h2>
                    <p className="step-description">
                      {session?.user
                        ? 'Select a saved address or enter custom delivery details for this order.'
                        : 'No account required. Please provide your direct phone number for courier call and delivery verification.'}
                    </p>
                  </div>

                  {savedAddresses.length > 0 && (
                    <div style={{
                      marginBottom: '1.25rem',
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(223, 255, 79, 0.05)',
                      border: '1px solid rgba(223, 255, 79, 0.2)',
                    }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dfff4f', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MapPin size={15} />
                        <span>Use Saved Nepal Delivery Destination:</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => handleSelectSavedAddress(addr)}
                            style={{
                              padding: '0.45rem 0.85rem',
                              borderRadius: '6px',
                              background: '#1a1d24',
                              border: '1px solid #282d38',
                              color: '#fff',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              fontWeight: 500,
                            }}
                          >
                            {addr.fullName} · {addr.areaTole}, {addr.district}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="form-card">
                    <h3 className="form-card-title">1. Contact Information</h3>
                    <div className="form-fields-grid">
                      <div className="form-group span-full">
                        <label htmlFor="fullName">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          autoComplete="name"
                          placeholder="e.g. Aarav Sharma"
                          className={errors.fullName ? 'input-error' : ''}
                          {...register('fullName')}
                        />
                        {errors.fullName && (
                          <span className="error-msg">{errors.fullName.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="phone">
                          Nepal Phone Number <span className="req">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="98XXXXXXXX or 97XXXXXXXX"
                          className={errors.phone ? 'input-error' : ''}
                          {...register('phone')}
                        />
                        <span className="helper-text">
                          Courier will contact you on this number prior to delivery.
                        </span>
                        {errors.phone && (
                          <span className="error-msg">{errors.phone.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="email">
                          Email Address <span className="req">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          placeholder="aarav@example.com"
                          className={errors.email ? 'input-error' : ''}
                          {...register('email')}
                        />
                        <span className="helper-text">
                          For order status updates & digital receipt.
                        </span>
                        {errors.email && (
                          <span className="error-msg">{errors.email.message}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="form-card">
                    <h3 className="form-card-title">2. Nepal Delivery Destination</h3>
                    <div className="form-fields-grid">
                      <div className="form-group">
                        <label htmlFor="province">
                          Province <span className="req">*</span>
                        </label>
                        <select
                          id="province"
                          value={selectedProvinceId}
                          onChange={handleProvinceChange}
                          className={errors.province ? 'input-error' : ''}
                        >
                          {NEPAL_PROVINCES.map((prov) => (
                            <option key={prov.id} value={prov.id}>
                              {prov.name} ({prov.nepaliName})
                            </option>
                          ))}
                        </select>
                        {errors.province && (
                          <span className="error-msg">{errors.province.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="district">
                          District <span className="req">*</span>
                        </label>
                        <select
                          id="district"
                          {...register('district')}
                          className={errors.district ? 'input-error' : ''}
                        >
                          {currentProvince.districts.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        {errors.district && (
                          <span className="error-msg">{errors.district.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="municipality">
                          Municipality / City <span className="req">*</span>
                        </label>
                        <input
                          id="municipality"
                          type="text"
                          placeholder="e.g. Kathmandu Metropolitan / Pokhara"
                          className={errors.municipality ? 'input-error' : ''}
                          {...register('municipality')}
                        />
                        {errors.municipality && (
                          <span className="error-msg">{errors.municipality.message}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="ward">
                          Ward Number <span className="req">*</span>
                        </label>
                        <input
                          id="ward"
                          type="text"
                          placeholder="e.g. 3 or Ward 10"
                          className={errors.ward ? 'input-error' : ''}
                          {...register('ward')}
                        />
                        {errors.ward && (
                          <span className="error-msg">{errors.ward.message}</span>
                        )}
                      </div>

                      <div className="form-group span-full">
                        <label htmlFor="areaTole">
                          Area / Tole / Chowk <span className="req">*</span>
                        </label>
                        <input
                          id="areaTole"
                          type="text"
                          placeholder="e.g. New Baneshwor, Thapagaun Chowk"
                          className={errors.areaTole ? 'input-error' : ''}
                          {...register('areaTole')}
                        />
                        {errors.areaTole && (
                          <span className="error-msg">{errors.areaTole.message}</span>
                        )}
                      </div>

                      <div className="form-group span-full">
                        <label htmlFor="streetLandmark">
                          Street / Landmark (Optional)
                        </label>
                        <input
                          id="streetLandmark"
                          type="text"
                          placeholder="e.g. Opposite Standard Chartered Bank, Red gate"
                          {...register('streetLandmark')}
                        />
                        <span className="helper-text">
                          Helps the delivery rider locate your address quickly.
                        </span>
                      </div>

                      <div className="form-group span-full">
                        <label htmlFor="deliveryInstructions">
                          Delivery Instructions / Notes (Optional)
                        </label>
                        <textarea
                          id="deliveryInstructions"
                          rows={2}
                          placeholder="e.g. Please call 15 minutes before arrival."
                          {...register('deliveryInstructions')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="step-actions">
                    <button
                      type="button"
                      className="button button-lime step-primary-btn"
                      onClick={goToPaymentStep}
                    >
                      <span>Continue to Payment Method</span>
                      <ArrowRight size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Payment Method Selection */}
              {currentStep === 'payment' && (
                <div className="checkout-step-panel">
                  <div className="step-header">
                    <h2>Select Payment Method</h2>
                    <p className="step-description">
                      Choose how you would like to complete your order. Real payment gateways will be activated in Prompt 8.
                    </p>
                  </div>

                  <div className="payment-options-list" role="radiogroup" aria-label="Payment methods">
                    {PAYMENT_METHODS.map((method) => {
                      const isSelected = selectedPaymentMethod === method.id;
                      return (
                        <label
                          key={method.id}
                          className={`payment-option-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="payment-option-radio">
                            <input
                              type="radio"
                              value={method.id}
                              checked={isSelected}
                              {...register('paymentMethod')}
                            />
                            <span className="custom-radio" />
                          </div>

                          <div className="payment-option-content">
                            <div className="payment-option-top">
                              <div className="payment-title-group">
                                {method.id === 'cod' && <Banknote size={20} className="payment-icon" />}
                                {method.id === 'esewa' && <Wallet size={20} className="payment-icon esewa-icon" />}
                                {method.id === 'nps' && <CreditCard size={20} className="payment-icon nps-icon" />}
                                <strong>{method.title}</strong>
                              </div>
                              {method.badge && (
                                <span className="payment-badge">{method.badge}</span>
                              )}
                            </div>
                            <p className="payment-desc">{method.description}</p>
                            <span className="payment-subtext">{method.subtext}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="step-actions split">
                    <button
                      type="button"
                      className="button step-back-btn"
                      onClick={() => setCurrentStep('delivery')}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Delivery</span>
                    </button>

                    <button
                      type="button"
                      className="button button-lime step-primary-btn"
                      onClick={goToReviewStep}
                    >
                      <span>Review Order</span>
                      <ArrowRight size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Review & Submission */}
              {currentStep === 'review' && (
                <div className="checkout-step-panel">
                  <div className="step-header">
                    <h2>Review Your Order</h2>
                    <p className="step-description">
                      Please double-check your delivery details and order summary before finalizing your draft.
                    </p>
                  </div>

                  {/* Review Cards */}
                  <div className="review-cards-stack">
                    <div className="review-card">
                      <div className="review-card-head">
                        <h3>Customer & Contact</h3>
                        <button
                          type="button"
                          className="edit-step-btn"
                          onClick={() => setCurrentStep('delivery')}
                        >
                          Edit
                        </button>
                      </div>
                      <p><strong>{formValues.fullName}</strong></p>
                      <p>Phone: {formValues.phone}</p>
                      <p>Email: {formValues.email}</p>
                    </div>

                    <div className="review-card">
                      <div className="review-card-head">
                        <h3>Delivery Address</h3>
                        <button
                          type="button"
                          className="edit-step-btn"
                          onClick={() => setCurrentStep('delivery')}
                        >
                          Edit
                        </button>
                      </div>
                      <p>
                        {formValues.municipality}, Ward {formValues.ward}, {formValues.areaTole}
                      </p>
                      <p>{formValues.district}, {currentProvince.name}</p>
                      {formValues.streetLandmark && (
                        <p className="text-dim">Landmark: {formValues.streetLandmark}</p>
                      )}
                      {formValues.deliveryInstructions && (
                        <p className="text-dim">Notes: {formValues.deliveryInstructions}</p>
                      )}
                    </div>

                    <div className="review-card">
                      <div className="review-card-head">
                        <h3>Payment Choice</h3>
                        <button
                          type="button"
                          className="edit-step-btn"
                          onClick={() => setCurrentStep('payment')}
                        >
                          Edit
                        </button>
                      </div>
                      <p>
                        <strong>
                          {selectedPaymentMethod === 'cod' && 'Cash on Delivery (COD)'}
                          {selectedPaymentMethod === 'esewa' && 'eSewa Mobile Wallet'}
                          {selectedPaymentMethod === 'nps' && 'Card / Bank Payment (Nepal Payment Solutions)'}
                        </strong>
                      </p>
                      <span className="payment-review-note">
                        Payment status will be verified through courier or gateway in Prompt 8.
                      </span>
                    </div>
                  </div>

                  {/* Architecture & Security Notice */}
                  <div className="security-notice-callout">
                    <ShieldCheck size={20} className="notice-icon" />
                    <div>
                      <strong>Authoritative Server Revalidation:</strong>
                      <p>
                        Stock availability and prices are verified against Neon PostgreSQL. Your order reference and line items will be securely saved.
                      </p>
                    </div>
                  </div>

                  {submissionError && (
                    <div style={{
                      marginTop: '1.25rem',
                      padding: '1rem',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #ef4444',
                      color: '#fca5a5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                    }}>
                      <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{submissionError}</div>
                    </div>
                  )}

                  <div className="step-actions split">
                    <button
                      type="button"
                      className="button step-back-btn"
                      onClick={() => setCurrentStep('payment')}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Payment</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="button button-lime step-primary-btn"
                    >
                      <span>
                        {isSubmitting
                          ? 'Securing Order...'
                          : selectedPaymentMethod === 'cod'
                          ? 'Place Order (Cash on Delivery)'
                          : selectedPaymentMethod === 'esewa'
                          ? 'Place Order (eSewa Pending)'
                          : 'Place Order (NPS Pending)'}
                      </span>
                      <Check size={18} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right: Sticky Desktop Order Summary */}
          <aside className="checkout-summary-column" aria-label="Order Summary">
            <div className="checkout-summary-card">
              <div className="summary-card-header">
                <h3>Order Summary</h3>
                <span className="summary-items-count">{totalCount} items</span>
              </div>

              {/* Items List */}
              <div className="summary-items-scroll">
                <ul className="checkout-summary-items">
                  {cartItems.map((item) => (
                    <li key={item.id} className="summary-item-row">
                      <div className="summary-item-thumb">
                        <img src={item.thumbnail} alt={item.name} width={56} height={56} />
                        <span className="summary-qty-badge">{item.quantity}</span>
                      </div>
                      <div className="summary-item-meta">
                        <span className="summary-item-name">{item.name}</span>
                        {item.variantName && (
                          <span className="summary-item-finish">Finish: {item.variantName}</span>
                        )}
                      </div>
                      <span className="summary-item-cost">
                        {formatMoney(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Breakdown */}
              <div className="summary-totals-block">
                <div className="summary-total-row">
                  <span>Subtotal</span>
                  <strong>{formatMoney(subtotal)}</strong>
                </div>

                <div className="summary-total-row">
                  <span>Shipping</span>
                  <span className="shipping-estimate-pill">Calculated at checkout</span>
                </div>

                <div className="summary-divider" />

                <div className="summary-total-row final-total-row">
                  <span>Estimated Total</span>
                  <strong className="final-total-price">{formatMoney(subtotal)}</strong>
                </div>
              </div>

              {/* Payment Method Selected Indicator */}
              <div className="summary-selected-payment">
                <span>Selected Method:</span>
                <strong>
                  {selectedPaymentMethod === 'cod' && 'Cash on Delivery'}
                  {selectedPaymentMethod === 'esewa' && 'eSewa Wallet'}
                  {selectedPaymentMethod === 'nps' && 'Card / Bank (NPS)'}
                </strong>
              </div>

              {/* Trust assurances */}
              <div className="summary-assurances">
                <div className="assurance-row">
                  <Truck size={16} />
                  <span>Doorstep delivery across all 7 provinces</span>
                </div>
                <div className="assurance-row">
                  <ShieldCheck size={16} />
                  <span>Official Deal Drip curated hardware</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
