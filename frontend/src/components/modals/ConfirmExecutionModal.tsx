/**
 * ConfirmExecutionModal Component
 * Modal for confirming workflow execution with summary stats
 */

import './ConfirmExecutionModal.css';

export interface ConfirmExecutionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Confirm handler */
  onConfirm: () => void;
  /** Number of items to process */
  itemCount: number;
  /** Model being used (e.g., 'flash' or 'pro') */
  model: string;
  /** Aspect ratio setting */
  aspectRatio: string;
  /** Resolution setting (for Pro model) */
  resolution?: string;
  /** Number of reference images */
  referenceImagesCount: number;
  /** Estimated cost (optional) */
  estimatedCost?: string;
  /** Show cost information */
  showCost?: boolean;
}

/**
 * Modal for confirming workflow execution
 */
export function ConfirmExecutionModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount,
  model,
  aspectRatio,
  resolution,
  referenceImagesCount,
  estimatedCost,
  showCost = false
}: ConfirmExecutionModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const modelDisplay = model === 'flash' ? 'Flash' : 'Pro';

  return (
    <div className="nb-modal-overlay" onClick={onClose}>
      <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nb-modal-header">
          <h3>Confirm Generation</h3>
          <button onClick={onClose} className="nb-modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="nb-modal-body">
          <div className="nb-modal-stats">
            <div className="nb-modal-stat nb-modal-stat-accent">
              <span className="nb-modal-stat-label">Total Images</span>
              <span className="nb-modal-stat-value">{itemCount}</span>
            </div>

            {showCost && estimatedCost && (
              <div className="nb-modal-stat nb-modal-stat-accent">
                <span className="nb-modal-stat-label">Est. Cost</span>
                <span className="nb-modal-stat-value">${estimatedCost}</span>
              </div>
            )}

            <div className="nb-modal-stat">
              <span className="nb-modal-stat-label">Model</span>
              <span className="nb-modal-stat-value">{modelDisplay}</span>
            </div>

            <div className="nb-modal-stat">
              <span className="nb-modal-stat-label">Format</span>
              <span className="nb-modal-stat-value">{aspectRatio}</span>
            </div>

            {model === 'pro' && resolution && (
              <div className="nb-modal-stat">
                <span className="nb-modal-stat-label">Resolution</span>
                <span className="nb-modal-stat-value">{resolution}</span>
              </div>
            )}

            <div className="nb-modal-stat">
              <span className="nb-modal-stat-label">References</span>
              <span className="nb-modal-stat-value">{referenceImagesCount}</span>
            </div>
          </div>
        </div>

        <div className="nb-modal-footer">
          <button onClick={onClose} className="nb-btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="nb-btn-primary">
            Confirm & Generate
          </button>
        </div>
      </div>
    </div>
  );
}
