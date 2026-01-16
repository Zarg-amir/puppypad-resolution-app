/**
 * OrderSelection - Order selection cards
 */

import { useChatStore } from '../../stores/chatStore';
import { analytics } from '../../services/analytics';
import { formatDate } from '../../utils/formatters';
import type { ProcessedOrder } from '@shared/types';

export function OrderSelection() {
  const { orders, selectOrder, setStep, addMessage } = useChatStore();

  const handleSelectOrder = (order: ProcessedOrder) => {
    selectOrder(order);
    analytics.stepCompleted('order_selection', {
      orderNumber: order.orderNumber,
      itemCount: order.itemCount,
    });

    addMessage({
      type: 'user',
      content: `Order ${order.displayName}`,
    });

    addMessage({
      type: 'bot',
      persona: 'amy',
      content: order.itemCount > 1
        ? 'Great! Please select the item(s) you need help with:'
        : "Got it! What's the issue with this order?",
    });

    setStep(order.itemCount > 1 ? 'products' : 'intent');
  };

  return (
    <div className="px-4 pb-4 space-y-3 animate-slide-up">
      {orders.map((order, index) => (
        <OrderCard
          key={order.id}
          order={order}
          onSelect={() => handleSelectOrder(order)}
          delay={index * 100}
        />
      ))}
    </div>
  );
}

interface OrderCardProps {
  order: ProcessedOrder;
  onSelect: () => void;
  delay?: number;
}

function OrderCard({ order, onSelect, delay = 0 }: OrderCardProps) {
  const statusColors: Record<string, string> = {
    fulfilled: 'badge-completed',
    unfulfilled: 'badge-pending',
    partial: 'badge-in-progress',
  };

  return (
    <button
      onClick={onSelect}
      className="w-full glass rounded-xl p-4 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 group-hover:text-brand-navy transition-colors">
            Order {order.displayName}
          </h3>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`badge ${statusColors[order.fulfillmentStatus] || 'badge-pending'}`}>
          {order.fulfillmentStatusDisplay}
        </span>
      </div>

      {/* Items Preview */}
      <div className="space-y-2 mb-3">
        {order.items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
              <p className="text-xs text-gray-500">
                Qty: {item.quantity} · {item.formattedPrice}
              </p>
            </div>
          </div>
        ))}
        {order.items.length > 2 && (
          <p className="text-xs text-gray-500">
            +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <span className="text-sm text-gray-500">{order.itemCount} item{order.itemCount > 1 ? 's' : ''}</span>
        <span className="font-semibold text-gray-900">{order.formattedTotal}</span>
      </div>

      {/* Guarantee Warning */}
      {!order.isWithinGuarantee && (
        <div className="mt-3 px-3 py-2 bg-amber-50 rounded-lg">
          <p className="text-xs text-amber-700">
            ⚠️ This order is outside the 90-day guarantee period
          </p>
        </div>
      )}
    </button>
  );
}
