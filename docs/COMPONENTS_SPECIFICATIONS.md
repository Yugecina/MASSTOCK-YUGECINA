# Component Specifications - "The Organic Factory"

**MASSTOCK Design System**
**Version**: 1.0
**Date**: November 21, 2025

This document provides detailed specifications for every component in the MASSTOCK design system, including CSS implementation, JSX examples, variants, states, and responsive behavior.

---

## Table of Contents

1. [Button Component](#1-button-component)
2. [Card Component](#2-card-component)
3. [Input Component](#3-input-component)
4. [Badge Component](#4-badge-component)
5. [Toast Notification](#5-toast-notification)
6. [Modal Component](#6-modal-component)
7. [Empty State Component](#7-empty-state-component)
8. [Skeleton Screen Component](#8-skeleton-screen-component)
9. [Spinner/Loading Component](#9-spinnerloading-component)
10. [Dropdown Component](#10-dropdown-component)
11. [Tooltip Component](#11-tooltip-component)
12. [Progress Bar Component](#12-progress-bar-component)

---

## 1. Button Component

### Visual Specifications

**Base Dimensions**:
- Height: 40px (default), 32px (sm), 48px (lg)
- Padding: 12px 24px (horizontal)
- Border-radius: 12px (var(--radius-lg))
- Font: Satoshi, 16px, semibold (600)

**States**: Default, Hover, Active, Focus, Disabled, Loading

### CSS Implementation

```css
/* ========== BASE BUTTON ========== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  padding: 12px 24px;
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal) var(--ease-out);
  white-space: nowrap;
  user-select: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* ========== VARIANT: PRIMARY (Indigo) ========== */
.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4338CA, #4F46E5);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--indigo-600);
  outline-offset: 2px;
}

/* ========== VARIANT: ACTION (Lime - USE SPARINGLY) ========== */
.btn-action {
  background: var(--lime-500);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(204, 255, 0, 0.2);
}

.btn-action:hover {
  background: var(--lime-400);
  box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
  transform: scale(1.02);
}

.btn-action:active {
  transform: scale(0.98);
  animation: glow-pulse 600ms var(--ease-spring);
}

/* ========== VARIANT: SECONDARY (Ghost) ========== */
.btn-secondary {
  background: var(--canvas-pure);
  color: var(--text-primary);
  border: 2px solid var(--border-color-default);
}

.btn-secondary:hover {
  background: var(--neutral-50);
  border-color: var(--border-color-hover);
}

/* ========== VARIANT: DANGER ========== */
.btn-danger {
  background: var(--error-main);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.2);
}

.btn-danger:hover {
  background: var(--error-dark);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

/* ========== VARIANT: GHOST (Transparent) ========== */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

/* ========== SIZE VARIANTS ========== */
.btn-sm {
  padding: 8px 16px;
  font-size: var(--text-sm);
  height: 32px;
}

.btn-lg {
  padding: 16px 32px;
  font-size: var(--text-lg);
  height: 48px;
}

/* ========== ICON BUTTON ========== */
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-md);
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
}

.btn-icon-lg {
  width: 48px;
  height: 48px;
}

/* ========== LOADING STATE ========== */
.btn-loading {
  position: relative;
  color: transparent;
  pointer-events: none;
}

.btn-loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  left: 50%;
  top: 50%;
  margin-left: -8px;
  margin-top: -8px;
}
```

### JSX Component

```jsx
import React from 'react';

export function Button({
  children,
  variant = 'primary',  // primary | action | secondary | danger | ghost
  size = 'md',          // sm | md | lg
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {icon && iconPosition === 'left' && !loading && icon}
      {children}
      {icon && iconPosition === 'right' && !loading && icon}
    </button>
  );
}

// Icon Button variant
export function IconButton({
  icon,
  size = 'md',
  ...props
}) {
  const classes = [
    'btn',
    'btn-icon',
    `btn-icon-${size}`,
    props.className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {icon}
    </button>
  );
}
```

### Usage Examples

```jsx
// Primary button
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Action button (Lime - sparingly)
<Button variant="action" onClick={handleGenerate}>
  Generate Now
</Button>

// Secondary button
<Button variant="secondary" onClick={handleCancel}>
  Cancel
</Button>

// With icon
<Button
  variant="primary"
  icon={<PlusIcon />}
  iconPosition="left"
>
  Create Workflow
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>

// Small danger button
<Button variant="danger" size="sm">
  Delete
</Button>

// Icon button
<IconButton
  icon={<SettingsIcon />}
  aria-label="Settings"
/>
```

### Responsive Behavior

```css
@media (max-width: 640px) {
  .btn {
    width: 100%;  /* Full-width on mobile */
  }

  .btn-icon {
    width: 40px;  /* Keep icon buttons same size */
  }
}
```

### Accessibility

```jsx
// Icon-only buttons MUST have aria-label
<IconButton
  icon={<CloseIcon />}
  aria-label="Close modal"
/>

// Loading state should announce to screen readers
<button aria-busy={loading} aria-live="polite">
  {loading ? 'Processing...' : 'Submit'}
</button>
```

---

## 2. Card Component

### Visual Specifications

**Base Dimensions**:
- Padding: 24px (var(--spacing-lg))
- Border-radius: 12px (var(--radius-lg))
- Border: 1px solid #E5E7EB (neutral-200)
- Background: white

**Hover Effect**: translateY(-2px) + shadow-md

### CSS Implementation

```css
/* ========== BASE CARD ========== */
.card {
  background: var(--canvas-pure);
  border: 1px solid var(--border-color-default);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-normal) var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* ========== INTERACTIVE CARD (Clickable) ========== */
.card-interactive {
  cursor: pointer;
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--indigo-200);
}

/* ========== VARIANT: INDIGO BACKGROUND ========== */
.card-indigo {
  background: linear-gradient(135deg, var(--indigo-50), var(--indigo-100));
  border-color: var(--indigo-200);
}

/* ========== VARIANT: LIME ACCENT ========== */
.card-lime-accent {
  border-left: 4px solid var(--lime-500);
}

/* ========== VARIANT: GRADIENT TOP BAR ========== */
.card-gradient-top {
  position: relative;
  overflow: hidden;
}

.card-gradient-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--indigo-600), var(--indigo-400));
  transform: scaleX(0);
  transition: transform var(--transition-slow) var(--ease-out);
}

.card-gradient-top:hover::before {
  transform: scaleX(1);
}

/* ========== VARIANT: GLASS (Overlays ONLY) ========== */
.card-glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-xl);
}

@supports not (backdrop-filter: blur(10px)) {
  .card-glass {
    background: rgba(255, 255, 255, 0.95);
  }
}

/* ========== COMPACT VARIANT ========== */
.card-compact {
  padding: var(--spacing-md);
}

/* ========== ELEVATED VARIANT ========== */
.card-elevated {
  box-shadow: var(--shadow-md);
}

.card-elevated:hover {
  box-shadow: var(--shadow-lg);
}
```

### JSX Component

```jsx
export function Card({
  children,
  variant = 'default',  // default | indigo | lime-accent | gradient-top | glass
  interactive = false,
  compact = false,
  elevated = false,
  className = '',
  ...props
}) {
  const classes = [
    'card',
    variant !== 'default' && `card-${variant}`,
    interactive && 'card-interactive',
    compact && 'card-compact',
    elevated && 'card-elevated',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
```

### Usage Examples

```jsx
// Standard card
<Card>
  <h3>Card Title</h3>
  <p>Card content...</p>
</Card>

// Interactive card (clickable)
<Card interactive onClick={() => navigate('/workflow/123')}>
  <h3>Workflow Name</h3>
  <p>Click to view details</p>
</Card>

// Indigo background card
<Card variant="indigo">
  <div className="flex items-center gap-md">
    <span className="text-4xl">8</span>
    <span className="text-sm text-neutral-600">Active Workflows</span>
  </div>
</Card>

// Lime accent card
<Card variant="lime-accent">
  <h3>Success Rate</h3>
  <span className="text-3xl font-bold">98.5%</span>
</Card>

// Card with gradient top bar (hover effect)
<Card variant="gradient-top" interactive>
  <h3>Recent Workflow</h3>
  <p>Hover to reveal gradient</p>
</Card>
```

### Responsive Behavior

```css
@media (max-width: 640px) {
  .card {
    padding: var(--spacing-md);  /* Reduce padding on mobile */
  }
}
```

---

## 3. Input Component

### Visual Specifications

**Base Dimensions**:
- Height: 44px
- Padding: 12px 16px
- Border-radius: 8px (var(--radius-md))
- Border: 1px solid #E5E7EB (neutral-200)
- Font: Satoshi, 16px, regular

**States**: Default, Hover, Focus, Error, Disabled

### CSS Implementation

```css
/* ========== BASE INPUT ========== */
.input {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--canvas-pure);
  border: 1px solid var(--border-color-default);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  width: 100%;
  transition: all var(--transition-fast) var(--ease-out);
}

.input::placeholder {
  color: var(--neutral-400);
}

.input:hover {
  border-color: var(--border-color-hover);
}

.input:focus {
  outline: none;
  border-color: var(--border-color-focus);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input:disabled {
  background: var(--neutral-100);
  color: var(--text-disabled);
  cursor: not-allowed;
}

/* ========== ERROR STATE ========== */
.input-error {
  border-color: var(--border-color-error);
}

.input-error:focus {
  border-color: var(--border-color-error);
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}

/* ========== SIZE VARIANTS ========== */
.input-sm {
  padding: 8px 12px;
  font-size: var(--text-sm);
  height: 36px;
}

.input-lg {
  padding: 16px 20px;
  font-size: var(--text-lg);
  height: 52px;
}

/* ========== WITH ICON ========== */
.input-wrapper {
  position: relative;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--neutral-400);
  pointer-events: none;
}

.input-with-icon {
  padding-left: 40px;
}

/* ========== TEXTAREA ========== */
.textarea {
  min-height: 120px;
  resize: vertical;
  line-height: var(--line-height-relaxed);
}
```

### JSX Component

```jsx
export function Input({
  type = 'text',
  error,
  disabled,
  icon,
  className = '',
  ...props
}) {
  const classes = [
    'input',
    error && 'input-error',
    icon && 'input-with-icon',
    className
  ].filter(Boolean).join(' ');

  if (icon) {
    return (
      <div className="input-wrapper">
        <span className="input-icon">{icon}</span>
        <input
          type={type}
          className={classes}
          disabled={disabled}
          aria-invalid={error ? 'true' : 'false'}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      type={type}
      className={classes}
      disabled={disabled}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
}

export function Textarea({
  error,
  className = '',
  ...props
}) {
  const classes = [
    'input',
    'textarea',
    error && 'input-error',
    className
  ].filter(Boolean).join(' ');

  return (
    <textarea
      className={classes}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
}
```

### Usage Examples

```jsx
// Basic input
<Input
  type="text"
  placeholder="Enter workflow name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Input with error
<Input
  type="email"
  placeholder="Email address"
  error={errors.email}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// Input with icon
<Input
  type="search"
  placeholder="Search workflows"
  icon={<SearchIcon />}
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>

// Textarea
<Textarea
  placeholder="Enter description"
  rows={5}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>

// Disabled input
<Input
  type="text"
  value="Cannot edit"
  disabled
/>
```

### Form Field Component

```jsx
export function FormField({
  label,
  error,
  required,
  children
}) {
  return (
    <div className="form-field">
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-error-main">*</span>}
        </label>
      )}
      {children}
      {error && (
        <span className="form-error text-sm text-error-main">
          {error}
        </span>
      )}
    </div>
  );
}

// CSS for FormField
.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-md);
}

.form-label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--text-secondary);
}

.form-error {
  animation: shake 400ms ease-in-out;
}
```

---

## 4. Badge Component

### Visual Specifications

**Base Dimensions**:
- Padding: 4px 12px
- Border-radius: 8px (var(--radius-md))
- Font: Satoshi, 12px, semibold (600)
- Text-transform: uppercase
- Letter-spacing: 0.05em

**Variants**: Success, Warning, Error, Info, Neutral, Lime

### CSS Implementation

```css
/* ========== BASE BADGE ========== */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
}

/* ========== VARIANT: SUCCESS ========== */
.badge-success {
  background: var(--success-light);
  color: var(--success-dark);
}

/* ========== VARIANT: WARNING ========== */
.badge-warning {
  background: var(--warning-light);
  color: var(--warning-dark);
}

/* ========== VARIANT: ERROR ========== */
.badge-error {
  background: var(--error-light);
  color: var(--error-dark);
}

/* ========== VARIANT: INFO ========== */
.badge-info {
  background: var(--info-light);
  color: var(--info-dark);
}

/* ========== VARIANT: NEUTRAL ========== */
.badge-neutral {
  background: var(--neutral-100);
  color: var(--neutral-700);
}

/* ========== VARIANT: LIME ========== */
.badge-lime {
  background: var(--lime-100);
  color: var(--text-primary);
}

/* ========== WITH DOT INDICATOR ========== */
.badge-with-dot {
  gap: 6px;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

/* ========== SIZE VARIANTS ========== */
.badge-sm {
  padding: 2px 8px;
  font-size: 10px;
}

.badge-lg {
  padding: 6px 16px;
  font-size: 14px;
}
```

### JSX Component

```jsx
export function Badge({
  children,
  variant = 'neutral',  // success | warning | error | info | neutral | lime
  size = 'md',          // sm | md | lg
  dot = false,
  className = '',
  ...props
}) {
  const classes = [
    'badge',
    `badge-${variant}`,
    size !== 'md' && `badge-${size}`,
    dot && 'badge-with-dot',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {dot && <span className="badge-dot" />}
      {children}
    </span>
  );
}
```

### Usage Examples

```jsx
// Success badge
<Badge variant="success">Active</Badge>

// Warning badge
<Badge variant="warning">Processing</Badge>

// Error badge
<Badge variant="error">Failed</Badge>

// With dot indicator
<Badge variant="success" dot>
  Online
</Badge>

// Small badge
<Badge variant="info" size="sm">
  New
</Badge>

// Lime badge (use sparingly)
<Badge variant="lime">
  Featured
</Badge>
```

---

## 5. Toast Notification

### Visual Specifications

**Position**: Fixed, top-right, stacked vertically
**Dimensions**: Max-width 400px, auto height
**Border-left**: 4px colored accent
**Auto-dismiss**: 3s (success), 5s (error/warning)

### CSS Implementation

```css
/* ========== TOAST CONTAINER ========== */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
  width: 100%;
}

/* ========== BASE TOAST ========== */
.toast {
  background: var(--canvas-pure);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-start;
  animation: slide-in-right 300ms var(--ease-out);
  border-left: 4px solid;
}

.toast.exiting {
  animation: slide-out-right 200ms var(--ease-in);
}

/* ========== VARIANTS ========== */
.toast-success {
  border-left-color: var(--success-main);
}

.toast-error {
  border-left-color: var(--error-main);
}

.toast-warning {
  border-left-color: var(--warning-main);
}

.toast-info {
  border-left-color: var(--info-main);
}

/* ========== TOAST ELEMENTS ========== */
.toast-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  color: var(--success-main);
}

.toast-error .toast-icon {
  color: var(--error-main);
}

.toast-warning .toast-icon {
  color: var(--warning-main);
}

.toast-info .toast-icon {
  color: var(--info-main);
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: 4px;
}

.toast-message {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: var(--line-height-relaxed);
}

.toast-action {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--indigo-600);
  font-weight: var(--weight-medium);
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color var(--transition-fast) var(--ease-out);
}

.toast-action:hover {
  color: var(--indigo-700);
}

.toast-close {
  background: transparent;
  border: none;
  color: var(--neutral-400);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color var(--transition-fast) var(--ease-out);
}

.toast-close:hover {
  color: var(--text-primary);
}
```

### JSX Component (using react-hot-toast)

```jsx
import toast, { Toaster } from 'react-hot-toast';

export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'toast',
        duration: 3000,
      }}
    />
  );
}

// Success Toast
export function showSuccessToast(title, message) {
  toast.custom((t) => (
    <div className={`toast toast-success ${t.visible ? '' : 'exiting'}`}>
      <span className="toast-icon">✅</span>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  ));
}

// Error Toast with Action
export function showErrorToast(title, message, action) {
  toast.custom((t) => (
    <div className={`toast toast-error ${t.visible ? '' : 'exiting'}`}>
      <span className="toast-icon">❌</span>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
        {action && (
          <a
            className="toast-action"
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => toast.dismiss(t.id)}
          >
            {action.label} →
          </a>
        )}
      </div>
      <button
        className="toast-close"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  ), { duration: 5000 });
}

// Warning Toast
export function showWarningToast(title, message) {
  toast.custom((t) => (
    <div className={`toast toast-warning ${t.visible ? '' : 'exiting'}`}>
      <span className="toast-icon">⚠️</span>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  ), { duration: 5000 });
}

// Info Toast
export function showInfoToast(title, message) {
  toast.custom((t) => (
    <div className={`toast toast-info ${t.visible ? '' : 'exiting'}`}>
      <span className="toast-icon">ℹ️</span>
      <div className="toast-content">
        <div className="toast-title">{title}</div>
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button
        className="toast-close"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  ));
}
```

### Usage Examples

```jsx
// Success
showSuccessToast(
  'Workflow executed successfully',
  'Results ready in 2.3s'
);

// Error with action
showErrorToast(
  'Invalid API Key',
  'Get a new key from Google AI Studio',
  {
    label: 'Get API Key',
    url: 'https://aistudio.google.com/app/apikey'
  }
);

// Warning
showWarningToast(
  'Rate limit approaching',
  '80% of daily quota used'
);

// Info
showInfoToast(
  'New feature available',
  'Check out batch processing'
);
```

---

Due to character limits, I'll create a second file for the remaining components. Let me continue with the Micro-interactions Guide:
