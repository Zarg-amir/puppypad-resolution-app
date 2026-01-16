/**
 * ProductSelection - Product selection with checkboxes
 */

import { useChatStore } from '../../stores/chatStore';
import { analytics } from '../../services/analytics';
import type { ProcessedLineItem } from '@shared/types';

export function ProductSelection() {
  const {
    selectedOrder,
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    setStep,
    addMessage,
  } = useChatStore();

  if (!selectedOrder) return null;

  const selectableItems = selectedOrder.items.filter((item) => item.isSelectable);

  const handleSelectAll = () => {
    if (selectedItems.length === selectableItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectableItems);
    }
  };

  const handleContinue = () => {
    if (selectedItems.length === 0) return;

    analytics.stepCompleted('product_selection', {
      selectedCount: selectedItems.length,
      totalItems: selectableItems.length,
    });

    const itemNames = selectedItems.map((i) => i.title).join(', ');
    addMessage({
      type: 'user',
      content: `Selected: ${itemNames}`,
    });

    addMessage({
      type: 'bot',
      persona: 'amy',
      content: "Thanks! What's the issue with these item(s)?",
    });

    setStep('intent');
  };

  return (
    <div className="px-4 pb-4 animate-slide-up">
      <div className="glass rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50/80 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            {selectedItems.length} of {selectableItems.length} selected
          </span>
          <button
            onClick={handleSelectAll}
            className="text-sm text-brand-navy font-medium hover:underline"
          >
            {selectedItems.length === selectableItems.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Items */}
        <div className="divide-y divide-gray-100">
          {selectedOrder.items.map((item) => (
            <ProductItem
              key={item.id}
              item={item}
              isSelected={selectedItems.some((i) => i.id === item.id)}
              onToggle={() => toggleItemSelection(item)}
            />
          ))}
        </div>

        {/* Continue Button */}
        <div className="p-4 bg-gray-50/80 border-t border-gray-100">
          <button
            onClick={handleContinue}
            disabled={selectedItems.length === 0}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue ({selectedItems.length} selected)
          </button>
        </div>
      </div>
    </div>
  );
}

interface ProductItemProps {
  item: ProcessedLineItem;
  isSelected: boolean;
  onToggle: () => void;
}

function ProductItem({ item, isSelected, onToggle }: ProductItemProps) {
  const isDisabled = !item.isSelectable;

  return (
    <label
      className={`flex items-center gap-4 p-4 cursor-pointer transition-colors ${
        isSelected ? 'bg-brand-navy/5' : 'hover:bg-gray-50'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        disabled={isDisabled}
        className="w-5 h-5 rounded border-gray-300 text-brand-navy focus:ring-brand-navy"
      />

      {/* Image */}
      {item.image && (
        <img
          src={item.image}
          alt={item.title}
          className="w-14 h-14 rounded-lg object-cover"
        />
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-gray-900 truncate">{item.title}</p>
          {item.isUpsell && (
            <span className="badge bg-purple-100 text-purple-700">Upsell</span>
          )}
          {item.isFree && (
            <span className="badge bg-green-100 text-green-700">Free</span>
          )}
          {item.isDigital && (
            <span className="badge bg-gray-100 text-gray-600">Digital</span>
          )}
        </div>
        {item.variantTitle && (
          <p className="text-sm text-gray-500">{item.variantTitle}</p>
        )}
        <p className="text-sm text-gray-600">
          Qty: {item.quantity} · {item.formattedPrice}
        </p>
      </div>
    </label>
  );
}
