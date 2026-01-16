/**
 * CaseModal - Case detail modal
 */

import { useState } from 'react';
import { useHubStore } from '../../stores/hubStore';
import { api } from '../../services/api';
import {
  formatDateTime,
  formatCurrency,
  formatResolutionType,
  toTitleCase,
} from '../../utils/formatters';

export function CaseModal() {
  const { selectedCase, selectedCaseComments, closeCaseModal, setSelectedCase } = useHubStore();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedCase) return null;

  const handleClose = () => {
    closeCaseModal();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await api.addCaseComment(selectedCase.caseId, newComment.trim(), true);
      setNewComment('');
      // Refresh case data
      const response = await api.getCase(selectedCase.caseId);
      if (response.success) {
        setSelectedCase(response.case, response.comments);
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await api.updateCase(selectedCase.caseId, { status: newStatus });
      const response = await api.getCase(selectedCase.caseId);
      if (response.success) {
        setSelectedCase(response.case, response.comments);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const statusClasses: Record<string, string> = {
    pending: 'badge-pending',
    in_progress: 'badge-in-progress',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-bold text-gray-900 font-display">
              Case {selectedCase.caseId}
            </h2>
            <p className="text-sm text-gray-500">
              Created {formatDateTime(selectedCase.createdAt)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - Case Details */}
            <div className="space-y-6">
              {/* Customer Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer</h3>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{selectedCase.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedCase.customerEmail}</p>
                  {selectedCase.customerPhone && (
                    <p className="text-sm text-gray-600">{selectedCase.customerPhone}</p>
                  )}
                </div>
              </section>

              {/* Order Info */}
              {selectedCase.orderNumber && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Order</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 font-mono">#{selectedCase.orderNumber}</p>
                    {selectedCase.orderTotal && (
                      <p className="text-sm text-gray-600">
                        Total: {formatCurrency(selectedCase.orderTotal)}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Resolution */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Resolution</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="font-medium">
                      {selectedCase.resolutionType
                        ? formatResolutionType(selectedCase.resolutionType)
                        : 'Pending'}
                    </span>
                  </div>
                  {selectedCase.refundAmount && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Refund:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(selectedCase.refundAmount)}
                        {selectedCase.refundPercentage && ` (${selectedCase.refundPercentage}%)`}
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* Tracking */}
              {selectedCase.trackingNumber && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Tracking</h3>
                  <div className="space-y-2">
                    <p className="text-gray-900 font-mono">{selectedCase.trackingNumber}</p>
                    {selectedCase.carrierName && (
                      <p className="text-sm text-gray-600">{selectedCase.carrierName}</p>
                    )}
                    {selectedCase.trackingStatus && (
                      <p className="text-sm text-gray-600">{selectedCase.trackingStatus}</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Status & Actions */}
            <div className="space-y-6">
              {/* Status */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
                <div className="flex items-center gap-3">
                  <span className={`badge ${statusClasses[selectedCase.status] || 'badge-pending'}`}>
                    {toTitleCase(selectedCase.status)}
                  </span>
                  <select
                    value={selectedCase.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </section>

              {/* Case Type */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Case Type</h3>
                <span className={`badge badge-${selectedCase.caseType}`}>
                  {toTitleCase(selectedCase.caseType)}
                </span>
              </section>

              {/* Notes */}
              {selectedCase.notes && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Notes</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedCase.notes}</p>
                </section>
              )}

              {/* Comments */}
              <section>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Comments ({selectedCaseComments.length})
                </h3>
                <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                  {selectedCaseComments.length === 0 ? (
                    <p className="text-sm text-gray-400">No comments yet</p>
                  ) : (
                    selectedCaseComments.map((comment) => (
                      <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 form-input text-sm py-2"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSubmitting}
                    className="btn btn-primary text-sm px-4 disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : 'Add'}
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          {selectedCase.clickupTaskId && (
            <a
              href={`https://app.clickup.com/t/${selectedCase.clickupTaskId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-sm"
            >
              View in ClickUp
            </a>
          )}
          <button onClick={handleClose} className="btn btn-primary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
