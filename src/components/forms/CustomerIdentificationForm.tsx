/**
 * CustomerIdentificationForm - Customer identification form
 */

import { useState } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { api } from '../../services/api';
import { analytics } from '../../services/analytics';
import { isValidEmail, isValidPhone } from '../../utils/validators';
import { formatPhoneNumber } from '../../utils/formatters';

export function CustomerIdentificationForm() {
  const {
    identifyMethod,
    customerData,
    setIdentifyMethod,
    updateCustomerData,
    setOrders,
    setStep,
    setTyping,
    addMessage,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (identifyMethod === 'email' && !isValidEmail(customerData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (identifyMethod === 'phone' && !isValidPhone(customerData.phone)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setTyping(true);

    // Add user message
    addMessage({
      type: 'user',
      content: identifyMethod === 'email'
        ? `${customerData.email}${customerData.firstName ? ` (${customerData.firstName})` : ''}`
        : formatPhoneNumber(customerData.phone),
    });

    try {
      const response = await api.lookupOrders({
        email: identifyMethod === 'email' ? customerData.email : undefined,
        phone: identifyMethod === 'phone' ? customerData.phone : undefined,
        firstName: customerData.firstName || undefined,
        orderNumber: customerData.orderNumber || undefined,
      });

      analytics.stepCompleted('identify', {
        method: identifyMethod,
        ordersFound: response.orders?.length || 0,
      });

      setTyping(false);

      if (response.success && response.orders && response.orders.length > 0) {
        setOrders(response.orders);
        addMessage({
          type: 'bot',
          persona: 'amy',
          content: `I found ${response.orders.length} order${response.orders.length > 1 ? 's' : ''} for you. Please select the one you need help with:`,
        });
        setStep('orders');
      } else {
        addMessage({
          type: 'bot',
          persona: 'amy',
          content: "I couldn't find any orders with that information. Please double-check and try again, or try a different search method.",
        });
        setError('No orders found');
      }
    } catch (err) {
      setTyping(false);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
      analytics.error('order_lookup_failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 pb-4 animate-slide-up">
      <div className="glass rounded-xl p-5">
        {/* Method Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setIdentifyMethod('email')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              identifyMethod === 'email'
                ? 'bg-brand-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => setIdentifyMethod('phone')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              identifyMethod === 'phone'
                ? 'bg-brand-navy text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Phone */}
          {identifyMethod === 'email' ? (
            <div>
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) => updateCustomerData({ email: e.target.value })}
                className="form-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={customerData.phone}
                onChange={(e) => updateCustomerData({ phone: e.target.value })}
                className="form-input"
                placeholder="+1 (555) 000-0000"
                required
                autoComplete="tel"
              />
            </div>
          )}

          {/* First Name (optional) */}
          <div>
            <label htmlFor="firstName" className="form-label">
              First Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={customerData.firstName}
              onChange={(e) => updateCustomerData({ firstName: e.target.value })}
              className="form-input"
              placeholder="Your first name"
              autoComplete="given-name"
            />
          </div>

          {/* Order Number (optional) */}
          <div>
            <label htmlFor="orderNumber" className="form-label">
              Order Number <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="orderNumber"
              type="text"
              value={customerData.orderNumber}
              onChange={(e) => updateCustomerData({ orderNumber: e.target.value })}
              className="form-input"
              placeholder="#12345"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="spinner w-4 h-4 border-2 border-white/30 border-t-white"></span>
                Looking up orders...
              </span>
            ) : (
              'Find My Orders'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
