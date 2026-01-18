/**
 * Render Helper Utilities
 * React rendering utilities for displaying complex data structures
 */

import { isBase64Image, base64ToDataUrl } from '@/utils/imageHelpers';
import logger from '@/utils/logger';

/**
 * Render a base64 image with clickable full-size view
 * @param value - Base64 image string
 * @param className - Optional CSS class prefix
 * @returns JSX element for image display
 */
export function renderImageValue(
  value: string,
  className = 'execution-data'
): JSX.Element {
  const imageSrc = base64ToDataUrl(value);

  return (
    <div className={`${className}-image-container`}>
      <img
        src={imageSrc}
        alt="Reference"
        className={`${className}-image`}
        onClick={(e) => {
          e.stopPropagation();
          window.open(imageSrc, '_blank');
        }}
      />
      <div className={`${className}-image-hint`}>
        Click to view full size
      </div>
    </div>
  );
}

/**
 * Render an object that may contain base64 images
 * If all values are images, displays as a grid
 * Otherwise, renders as formatted JSON
 * @param obj - Object to render
 * @param className - Optional CSS class prefix
 * @returns JSX element
 */
export function renderObjectValue(
  obj: Record<string, unknown>,
  className = 'execution-data'
): JSX.Element {
  try {
    const entries = Object.entries(obj);
    const allValuesAreImages = entries.length > 0 && entries.every(
      ([, val]) => typeof val === 'string' && isBase64Image(val)
    );

    if (allValuesAreImages) {
      return (
        <div className={`${className}-images-grid`}>
          {entries.map(([objKey, objValue]) => (
            <div key={objKey} className={`${className}-image-item`}>
              <div className={`${className}-object-key`}>{objKey}:</div>
              {renderImageValue(objValue as string, className)}
            </div>
          ))}
        </div>
      );
    }

    // Fallback: render as JSON
    return (
      <pre className={`${className}-object-preview`}>
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  } catch (err) {
    logger.error('renderObjectValue: Error rendering object', { error: err });
    return (
      <pre className={`${className}-object-preview`}>
        {JSON.stringify(obj, null, 2)}
      </pre>
    );
  }
}

/**
 * Render input data in a pretty formatted view
 * Handles nested objects, arrays, and base64 images
 * @param data - Data object to render
 * @param className - Optional CSS class prefix
 * @returns JSX element
 */
export function renderPrettyData(
  data: Record<string, unknown>,
  className = 'execution-data'
): JSX.Element {
  if (!data || typeof data !== 'object') {
    return <div className={`${className}-value`}>{String(data)}</div>;
  }

  try {
    return (
      <div className={`${className}-pretty`}>
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className={`${className}-row`}>
            <div className={`${className}-key`}>{key}</div>
            <div className={`${className}-value`}>
              {renderValue(value, className)}
            </div>
          </div>
        ))}
      </div>
    );
  } catch (err) {
    logger.error('renderPrettyData: Error rendering data', { error: err });
    return (
      <div className={`${className}-value`}>
        Error rendering data. Check console for details.
      </div>
    );
  }
}

/**
 * Render a single value, handling different types appropriately
 * @param value - Value to render
 * @param className - Optional CSS class prefix
 * @returns JSX element
 */
function renderValue(value: unknown, className: string): JSX.Element {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className={`${className}-empty`}>null</span>;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return renderArrayValue(value, className);
  }

  // Handle objects
  if (typeof value === 'object') {
    return renderObjectValue(value as Record<string, unknown>, className);
  }

  // Handle base64 images
  if (typeof value === 'string' && isBase64Image(value)) {
    return renderImageValue(value, className);
  }

  // Handle primitives
  return <span>{String(value)}</span>;
}

/**
 * Render an array value
 * @param arr - Array to render
 * @param className - Optional CSS class prefix
 * @returns JSX element
 */
function renderArrayValue(arr: unknown[], className: string): JSX.Element {
  if (arr.length === 0) {
    return <span className={`${className}-empty`}>Empty array</span>;
  }

  return (
    <div className={`${className}-array`}>
      {arr.map((item, index) => (
        <div key={index} className={`${className}-array-item`}>
          {renderValue(item, className)}
        </div>
      ))}
    </div>
  );
}
