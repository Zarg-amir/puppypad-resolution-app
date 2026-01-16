/**
 * CaseConfirmation - Case created confirmation
 */

import { useChatStore } from '../../stores/chatStore';
import { formatDollarAmount } from '../../utils/formatters';

export function CaseConfirmation() {
  const {
    caseId,
    refundAmount,
    refundPercentage,
    ladderType,
    reset,
  } = useChatStore();

  const handleStartNew = () => {
    reset();
  };

  const handleCopyCaseId = () => {
    if (caseId) {
      navigator.clipboard.writeText(caseId);
    }
  };

  return (
    <div className="px-4 pb-4 animate-slide-up">
      <div className="glass rounded-2xl p-6 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 font-display mb-2">
          {caseId ? 'Your Request is Complete!' : 'Case Created'}
        </h2>

        {/* Case ID */}
        {caseId && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Case ID</p>
            <button
              onClick={handleCopyCaseId}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="font-mono font-medium text-gray-900">{caseId}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        )}

        {/* Resolution Summary */}
        {refundAmount > 0 && (
          <div className="mb-6 p-4 bg-brand-navy/5 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">
              {ladderType === 'subscription' ? 'Your Discount' : 'Your Refund'}
            </p>
            <p className="text-2xl font-bold text-brand-navy">
              {refundPercentage}% ({formatDollarAmount(refundAmount)})
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {ladderType === 'subscription'
                ? 'Applied to your next order'
                : 'Will be credited to your original payment method'}
            </p>
          </div>
        )}

        {/* Next Steps */}
        <div className="text-left mb-6">
          <h3 className="font-medium text-gray-900 mb-3">What happens next?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>You'll receive a confirmation email shortly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>
                {ladderType === 'subscription'
                  ? 'Discount will be applied to your next order'
                  : 'Refund will be processed within 3-5 business days'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Our team may follow up if needed</span>
            </li>
          </ul>
        </div>

        {/* Action */}
        <button onClick={handleStartNew} className="btn btn-secondary w-full">
          Start a New Request
        </button>
      </div>
    </div>
  );
}
