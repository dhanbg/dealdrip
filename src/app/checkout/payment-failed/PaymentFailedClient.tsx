'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  RotateCw,
  Truck,
  ShoppingBag,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  initiatePaymentAction,
  recheckPaymentStatusAction,
  switchOrderToCodAction,
} from '@/app/actions/payments';
import { formatMoney } from '@/data/catalog';

interface PaymentFailedClientProps {
  orderReference: string;
  reason?: string;
  orderTotal?: number;
  currentPaymentStatus?: string;
}

export function PaymentFailedClient({
  orderReference,
  reason,
  orderTotal,
  currentPaymentStatus = 'unpaid',
}: PaymentFailedClientProps) {
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSwitchingCod, setIsSwitchingCod] = useState(false);

  // Friendly reason interpretation
  const getFriendlyReason = () => {
    if (!reason) return 'The payment could not be completed at this time.';
    if (reason === 'cancelled_by_user') {
      return 'The payment session was cancelled before completing on the payment gateway.';
    }
    if (reason === 'missing_payload') {
      return 'Payment response data was not received from the payment gateway.';
    }
    if (reason.toLowerCase().includes('signature')) {
      return 'The payment response signature could not be verified securely.';
    }
    if (reason.toLowerCase().includes('amount mismatch')) {
      return 'Authoritative payment amount did not match the gateway record.';
    }
    return reason;
  };

  const handleRetryEsewa = async () => {
    if (!orderReference) {
      toast.error('Missing order reference. Please return to checkout.');
      return;
    }

    try {
      setIsRetrying(true);
      const res = await initiatePaymentAction({
        orderReference,
        method: 'esewa',
      });

      if (!res.success) {
        toast.error((res as any).error || 'Failed to initialize payment with eSewa.');
        setIsRetrying(false);
        return;
      }

      const initResult = res as any;
      if (initResult.formAction && initResult.formData) {
        toast.loading('Redirecting to eSewa secure checkout...');
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = initResult.formAction;
        form.style.display = 'none';

        Object.entries(initResult.formData).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      } else if (initResult.redirectUrl) {
        window.location.href = initResult.redirectUrl;
      } else {
        toast.error('Incomplete payment parameters received.');
        setIsRetrying(false);
      }


    } catch (err: any) {
      toast.error(err.message || 'Error retrying payment');
      setIsRetrying(false);
    }
  };

  const handleRecheckStatus = async () => {
    if (!orderReference) return;
    try {
      setIsChecking(true);
      const res = await recheckPaymentStatusAction(orderReference);
      const result: any = res.result;
      if (res.success && result?.success && result?.status === 'paid') {
        toast.success('Payment authoritatively verified! Redirecting...');
        router.push(`/order-confirmation/${orderReference}?verified=true`);
      } else if (res.success && result?.status === 'pending') {
        toast.info('Payment is still pending gateway confirmation.');
      } else {
        toast.error(result?.error || 'Payment not completed or not yet confirmed by provider.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification check failed');
    } finally {
      setIsChecking(false);
    }
  };


  const handleSwitchToCod = async () => {
    if (!orderReference) return;
    try {
      setIsSwitchingCod(true);
      const res = await switchOrderToCodAction(orderReference);
      if (res.success) {
        toast.success('Order switched to Cash on Delivery!');
        router.push(`/order-confirmation/${orderReference}`);
      } else {
        toast.error(res.error || 'Could not switch order to COD.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error switching to COD');
    } finally {
      setIsSwitchingCod(false);
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1.25rem' }}>
      <div style={{
        background: 'var(--panel-bg, #121316)',
        border: '1px solid var(--border-color, #23272f)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        textAlign: 'center',
      }}>
        {/* Status Icon */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          color: '#ef4444',
          marginBottom: '1.25rem',
        }}>
          <AlertTriangle size={36} />
        </div>

        <div style={{
          display: 'inline-block',
          padding: '0.35rem 0.85rem',
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          marginBottom: '0.75rem',
        }}>
          Payment Incomplete
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em', color: '#fff' }}>
          Payment Was Not Completed
        </h1>

        <p style={{ color: 'var(--text-secondary, #94a3b8)', margin: '0 0 1.5rem 0', fontSize: '0.95rem', lineHeight: 1.5 }}>
          {getFriendlyReason()}
        </p>

        {orderReference && (
          <div style={{
            background: 'var(--surface-color, #181b22)',
            border: '1px solid var(--border-color, #272c38)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '2rem',
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>Order Reference:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#dfff4f' }}>{orderReference}</span>
            </div>
            {orderTotal !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>Authoritative Amount:</span>
                <span style={{ fontWeight: 700, color: '#fff' }}>{formatMoney(orderTotal)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>Status:</span>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#eab308',
              }}>
                {currentPaymentStatus}
              </span>
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '2rem',
          fontSize: '0.85rem',
          color: 'var(--text-secondary, #94a3b8)',
          textAlign: 'left',
          lineHeight: 1.5,
        }}>
          <strong style={{ color: '#fff', display: 'block', marginBottom: '0.25rem' }}>
            Did your balance get deducted?
          </strong>
          If eSewa debited your account, click <strong>Recheck Status</strong> below. Our server will query the provider directly and confirm your order without charging you again.
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {orderReference && (
            <>
              <button
                type="button"
                onClick={handleRetryEsewa}
                disabled={isRetrying || isChecking || isSwitchingCod}
                className="button button-lime"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  opacity: isRetrying ? 0.7 : 1,
                }}
              >
                <RotateCw size={18} className={isRetrying ? 'spin' : ''} />
                <span>{isRetrying ? 'Connecting to eSewa...' : 'Retry Payment with eSewa'}</span>
              </button>

              <button
                type="button"
                onClick={handleRecheckStatus}
                disabled={isRetrying || isChecking || isSwitchingCod}
                className="button"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-color, #272c38)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: isChecking ? 'not-allowed' : 'pointer',
                  opacity: isChecking ? 0.7 : 1,
                }}
              >
                <Clock size={18} className={isChecking ? 'spin' : ''} />
                <span>{isChecking ? 'Checking Provider...' : 'Recheck Payment Status'}</span>
              </button>

              <button
                type="button"
                onClick={handleSwitchToCod}
                disabled={isRetrying || isChecking || isSwitchingCod}
                className="button"
                style={{
                  width: '100%',
                  padding: '0.85rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  background: 'rgba(74, 222, 128, 0.1)',
                  border: '1px solid rgba(74, 222, 128, 0.3)',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: isSwitchingCod ? 'not-allowed' : 'pointer',
                  opacity: isSwitchingCod ? 0.7 : 1,
                }}
              >
                <Truck size={18} />
                <span>{isSwitchingCod ? 'Updating Order...' : 'Switch to Cash on Delivery (COD)'}</span>
              </button>
            </>
          )}

          <Link
            href="/shop"
            className="button"
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              fontWeight: 600,
              fontSize: '0.95rem',
              background: 'transparent',
              border: '1px solid var(--border-color, #272c38)',
              color: 'var(--text-muted, #94a3b8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              marginTop: '0.5rem',
            }}
          >
            <ShoppingBag size={18} />
            <span>Return to Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
