/**
 * ExamplePromptsModal Component
 * Modal displaying example prompts for NanoBanana workflow
 */

import './ExamplePromptsModal.css';

export interface ExamplePromptsModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Load examples handler */
  onLoadExamples: () => void;
}

/** Example prompt data structure */
interface ExamplePrompt {
  number: string;
  text: string;
}

/** Default example prompts */
const DEFAULT_EXAMPLES: ExamplePrompt[] = [
  {
    number: '01',
    text: '[product] on a rustic wooden table with natural morning light, warm atmosphere'
  },
  {
    number: '02',
    text: '[product] in a minimalist zen garden with smooth stones, clean aesthetic'
  },
  {
    number: '03',
    text: '[product] in a cozy hygge interior with candles and warm bokeh lights'
  },
  {
    number: '04',
    text: '[product] on tropical beach with turquoise water, golden hour sunlight'
  }
];

/**
 * Modal displaying example prompts with load option
 */
export function ExamplePromptsModal({
  isOpen,
  onClose,
  onLoadExamples
}: ExamplePromptsModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="nb-modal-overlay" onClick={onClose}>
      <div className="nb-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nb-modal-header">
          <h3>Example Prompts</h3>
          <button onClick={onClose} className="nb-modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="nb-modal-body">
          <p className="nb-modal-desc">
            Replace [product] with your actual product description.
          </p>

          <div className="nb-examples">
            {DEFAULT_EXAMPLES.map((example) => (
              <div key={example.number} className="nb-example">
                <span className="nb-example-num">{example.number}</span>
                <p>{example.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="nb-modal-footer">
          <button onClick={onClose} className="nb-btn-secondary">
            Cancel
          </button>
          <button onClick={onLoadExamples} className="nb-btn-primary">
            Load Examples
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Get example prompts text for loading into form
 */
export function getExamplePromptsText(): string {
  return `[product] on a rustic wooden table with natural morning light, surrounded by fresh herbs and organic ingredients, warm atmosphere, professional food photography


[product] floating in a minimalist zen garden setting with smooth stones, raked sand patterns, soft shadows, clean modern aesthetic, 8k resolution


[product] in a cozy hygge-inspired interior with candles, soft blankets, and warm bokeh lights in background, intimate atmosphere, Scandinavian design


[product] on a vibrant tropical beach scene with turquoise water, palm leaves, white sand, golden hour sunlight, vacation lifestyle photography`;
}
