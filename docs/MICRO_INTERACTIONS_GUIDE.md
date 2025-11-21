# Micro-interactions Guide - "The Organic Factory"

**MASSTOCK Design System**
**Version**: 1.0
**Date**: November 21, 2025

This document provides precise timing, easing functions, and storyboard specifications for all micro-interactions in the MASSTOCK design system.

---

## Table of Contents

1. [Timing & Easing Standards](#1-timing--easing-standards)
2. [Button Interactions](#2-button-interactions)
3. [Card Interactions](#3-card-interactions)
4. [Form Interactions](#4-form-interactions)
5. [Workflow Execution Flow](#5-workflow-execution-flow)
6. [Loading States](#6-loading-states)
7. [Success & Error States](#7-success--error-states)
8. [Modal & Overlay Transitions](#8-modal--overlay-transitions)

---

## 1. Timing & Easing Standards

### Timing Constants

```javascript
export const ANIMATION_TIMING = {
  // Very Fast (100ms) - Hover, Focus
  HOVER: 100,
  FOCUS: 100,

  // Fast (150ms) - Color transitions
  FAST: 150,

  // Normal (200ms) - Standard transitions
  NORMAL: 200,

  // Slow (300ms) - Modal open/close, Drawer slide
  SLOW: 300,

  // Smooth (400ms) - Page transitions
  SMOOTH: 400,

  // Very Slow (500ms+) - Skeleton → Content
  SKELETON: 500,

  // Decorative (1000ms+) - Decorative animations only
  DECORATIVE: 1000,
};
```

### Easing Functions

```css
:root {
  /* Linear (rarely used) */
  --ease-linear: linear;

  /* Ease In (starts slow, ends fast) */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* Ease Out (starts fast, ends slow) - MOST COMMON */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);

  /* Ease In-Out (smooth both ends) */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* Spring (overshoots slightly) - Use sparingly */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Guidelines**:
- **Use `ease-out`** for 90% of interactions (feels responsive)
- **Use `ease-in`** for exits/disappearing elements
- **Use `ease-in-out`** for elements moving across screen
- **Use `spring`** ONLY for celebratory actions (success states)

---

## 2. Button Interactions

### 2.1. Primary Button (Indigo)

**Timeline**:

```
User Action          Visual Change               Timing      Easing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Default              Base styles                 -           -
                     ↓
Hover In             translateY(-1px)           200ms       ease-out
                     shadow: md → lg
                     background: darker
                     ↓
Mouse Down           translateY(0)              100ms       ease-in
                     shadow: lg → md
                     ↓
Mouse Up             Return to hover state      100ms       ease-out
                     ↓
Hover Out            Return to default          200ms       ease-out
```

**CSS**:

```css
.btn-primary {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    background 200ms var(--ease-out);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  background: linear-gradient(135deg, #4338CA, #4F46E5);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}
```

### 2.2. Action Button (Lime - "Generate")

**Timeline**:

```
Time     Action                     Visual State
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Mouse down                 scale(0.95)
                                    brightness(1.1)

T+100ms  Mouse up                   scale(1.05)
                                    Lime glow starts
                                    box-shadow: 0 0 20px rgba(204,255,0,0.6)

T+200ms  Normalize                  scale(1)
                                    box-shadow: 0 0 10px rgba(204,255,0,0.3)

T+300ms  Transition start           opacity: 0.8
                                    "Generate" → "Generating..."

T+400ms  Loading state active       Spinner appears (Indigo)
                                    Button disabled
```

**CSS**:

```css
/* Keyframe Animation */
@keyframes button-generate-click {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(204, 255, 0, 0);
  }
  25% {
    transform: scale(0.95);
    filter: brightness(1.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 10px rgba(204, 255, 0, 0.3);
  }
}

.btn-action:active {
  animation: button-generate-click 400ms var(--ease-spring);
}

/* Hover state */
.btn-action:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
  transition: all 200ms var(--ease-out);
}
```

**JavaScript Integration**:

```javascript
const handleGenerate = async () => {
  // Button click animation already handled by CSS
  setIsLoading(true);

  try {
    await executeWorkflow();
    // Success: Trigger confetti + success toast
    triggerSuccessConfetti();
    showSuccessToast('Workflow executed successfully', 'Results ready');
  } catch (error) {
    // Error: Trigger shake animation
    setError(error.message);
    triggerErrorShake();
  } finally {
    setIsLoading(false);
  }
};
```

### 2.3. Icon Button

**Timeline**:

```
Default              Transparent background
                     ↓
Hover                background: neutral-100     150ms       ease-out
                     color: obsidian
                     ↓
Active               scale(0.95)                 100ms       ease-in
                     ↓
Release              Return to hover             100ms       ease-out
```

**CSS**:

```css
.btn-icon {
  transition:
    background 150ms var(--ease-out),
    transform 100ms var(--ease-out),
    color 150ms var(--ease-out);
}

.btn-icon:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

.btn-icon:active {
  transform: scale(0.95);
}
```

---

## 3. Card Interactions

### 3.1. Standard Card Hover

**Timeline**:

```
Time     Action              Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Hover in            translateY(0) → translateY(-2px)
                             shadow: sm → md
                             200ms ease-out

T+200ms  Hover complete      Resting at -2px elevation

Hover    Hover out           translateY(-2px) → translateY(0)
Out                          shadow: md → sm
                             200ms ease-out
```

**CSS**:

```css
.card {
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### 3.2. Interactive Card (Clickable)

**Timeline**:

```
Time     Action              Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Hover in            translateY(0) → translateY(-4px)
                             shadow: md → lg
                             border: neutral-200 → indigo-200
                             200ms ease-out

T+200ms  Mouse down          scale(0.99)
                             100ms ease-in

T+300ms  Mouse up            scale(1)
                             Click registered
                             100ms ease-out

T+400ms  Navigation          Page transition begins
```

**CSS**:

```css
.card-interactive {
  cursor: pointer;
  transition:
    transform 200ms var(--ease-out),
    box-shadow 200ms var(--ease-out),
    border-color 200ms var(--ease-out);
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--indigo-200);
}

.card-interactive:active {
  transform: translateY(-4px) scale(0.99);
  transition-duration: 100ms;
}
```

### 3.3. Card with Gradient Top Bar

**Timeline**:

```
Time     Action              Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Hover in            Top bar: scaleX(0) → scaleX(1)
                             300ms ease-out
                             Transform origin: left

T+300ms  Hover complete      Gradient bar fully revealed

Hover    Hover out           Top bar: scaleX(1) → scaleX(0)
Out                          300ms ease-out
```

**CSS**:

```css
.card-gradient-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4F46E5, #6366F1);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 300ms var(--ease-out);
}

.card-gradient-top:hover::before {
  transform: scaleX(1);
}
```

---

## 4. Form Interactions

### 4.1. Input Focus

**Timeline**:

```
Time     Action              Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Focus in            border: neutral-200 → indigo-600
                             150ms ease-out
                             Glow appears: 0 → 0 0 0 3px rgba(79,70,229,0.1)

T+150ms  Focus complete      Input ready for typing

Blur     Focus out           border: indigo-600 → neutral-200
                             150ms ease-out
                             Glow fades out
```

**CSS**:

```css
.input {
  transition:
    border-color 150ms var(--ease-out),
    box-shadow 150ms var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--indigo-600);
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}
```

### 4.2. Input Error State

**Timeline**:

```
Time     Action              Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Validation fails    Shake animation starts
                             border → error-main
                             400ms ease-in-out

T+100ms  Shake left          translateX(-10px)

T+200ms  Shake center        translateX(0)

T+300ms  Shake right         translateX(10px)

T+400ms  Animation end       translateX(0)
                             Error message appears below
```

**CSS**:

```css
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.input-error {
  border-color: var(--error-main);
  animation: shake 400ms var(--ease-in-out);
}

.form-error {
  animation: fade-in-up 300ms var(--ease-out);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 5. Workflow Execution Flow

### 5.1. Complete Execution Timeline

**Storyboard**:

```
Time      User Action         System State              Visual Feedback
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0s      Click "Generate"    Button clicked            Button: scale animation
                                                        (400ms spring easing)

T+0.3s    -                   Request sent              Button → Loading state
                                                        Spinner appears (Indigo)

T+0.5s    -                   Page transition          Fade out form
                                                        Fade in processing view
                                                        (500ms ease-out)

T+1s      -                   Processing starts         Gradient glow animation
                                                        (Indigo, infinite)
                                                        Progress: 0/10 prompts

T+3s      -                   Prompt 1 done            Progress: 1/10 (10%)
                                                        Success badge pulse
                                                        (200ms lime flash)

T+5s      -                   Prompt 2 done            Progress: 2/10 (20%)

...       -                   ...                       ...

T+30s     -                   All complete             Stop gradient animation
                                                        Lime flash (600ms)
                                                        Confetti burst

T+30.6s   -                   Results ready            Fade in results grid
                                                        (500ms ease-out)
                                                        Success toast appears
```

### 5.2. Processing State Animation

**Gradient Glow (Indigo - Infinite)**:

```css
@keyframes gradient-rotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.loading-gradient {
  background: linear-gradient(
    270deg,
    var(--indigo-600),
    var(--indigo-500),
    var(--indigo-400),
    var(--indigo-500),
    var(--indigo-600)
  );
  background-size: 400% 400%;
  animation: gradient-rotate 3s ease infinite;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.8;
}
```

### 5.3. Progress Bar Animation

**CSS**:

```css
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4F46E5, #6366F1);
  border-radius: 4px;
  transition: width 500ms var(--ease-out);
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
}
```

**JavaScript**:

```javascript
// Smooth progress updates
const updateProgress = (current, total) => {
  const percentage = (current / total) * 100;
  setProgress(percentage); // CSS transition handles animation
};
```

---

## 6. Loading States

### 6.1. Skeleton Screen Transition

**Timeline**:

```
Time      State               Visual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms     Page load           Skeleton appears
                              (gray blocks pulsing)

T+0-2s    Loading data        Pulse animation continues
                              (1.5s infinite)

T+2s      Data received       Skeleton fade out
                              (200ms ease-out)

T+2.2s    -                   Content fade in + slide up
                              (300ms ease-out)
                              translateY(10px) → translateY(0)

T+2.5s    Complete            Content fully visible
```

**CSS**:

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.skeleton {
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

/* Fade out skeleton, fade in content */
.skeleton-exit {
  animation: fade-out 200ms var(--ease-out) forwards;
}

.content-enter {
  animation: fade-in-up 300ms var(--ease-out);
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 6.2. Spinner Animation

**CSS**:

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--neutral-200);
  border-top-color: var(--indigo-600);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
```

---

## 7. Success & Error States

### 7.1. Success State (Lime Pulse)

**Timeline**:

```
Time      Visual Change
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms     Element scale: 1
          Background: transparent
          box-shadow: none

T+100ms   scale: 1.02
          background: rgba(204,255,0,0.2)
          box-shadow: 0 0 20px rgba(204,255,0,0.3)

T+300ms   scale: 1
          background: transparent
          box-shadow: 0 0 40px rgba(204,255,0,0.6)

T+600ms   Animation complete
          box-shadow: none
```

**CSS**:

```css
@keyframes lime-pulse {
  0% {
    transform: scale(1);
    background-color: transparent;
    box-shadow: 0 0 0 0 rgba(204, 255, 0, 0);
  }
  50% {
    transform: scale(1.02);
    background-color: rgba(204, 255, 0, 0.2);
    box-shadow: 0 0 20px rgba(204, 255, 0, 0.3);
  }
  100% {
    transform: scale(1);
    background-color: transparent;
    box-shadow: 0 0 40px rgba(204, 255, 0, 0.6);
  }
}

.success-pulse {
  animation: lime-pulse 600ms var(--ease-spring);
}
```

### 7.2. Confetti Burst (Success)

**JavaScript (using canvas-confetti)**:

```javascript
import confetti from 'canvas-confetti';

export function triggerSuccessConfetti() {
  confetti({
    particleCount: 50,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#CCFF00', '#4F46E5', '#6366F1', '#D4FF33'],
    ticks: 200,
    gravity: 1.2,
    scalar: 1.2,
    shapes: ['circle', 'square'],
  });
}

// Trigger after workflow completion
useEffect(() => {
  if (execution.status === 'completed') {
    triggerSuccessConfetti();
    showSuccessToast('Workflow completed!', `Generated in ${duration}s`);
  }
}, [execution.status]);
```

### 7.3. Error State (Shake)

**Timeline**:

```
Time      Position (translateX)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms     0px
T+100ms   -10px (left)
T+200ms   0px (center)
T+300ms   +10px (right)
T+400ms   0px (complete)
```

**CSS**:

```css
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-10px);
  }
  75% {
    transform: translateX(10px);
  }
}

.error-shake {
  animation: shake 400ms var(--ease-in-out);
}
```

**JavaScript**:

```javascript
export function triggerErrorShake(elementRef) {
  if (!elementRef.current) return;

  elementRef.current.classList.add('error-shake');

  setTimeout(() => {
    elementRef.current.classList.remove('error-shake');
  }, 400);
}
```

---

## 8. Modal & Overlay Transitions

### 8.1. Modal Open

**Timeline**:

```
Time      Element             Animation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms     Trigger             Modal mount
                              Overlay opacity: 0

T+50ms    Overlay             Fade in
                              opacity: 0 → 1
                              (200ms ease-out)

T+100ms   Modal               Scale in + fade in
                              scale: 0.95 → 1
                              opacity: 0 → 1
                              (300ms ease-spring)

T+400ms   Complete            Modal fully visible
                              Focus trapped
```

**CSS**:

```css
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  animation: fade-in 200ms var(--ease-out);
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal */
.modal {
  animation: scale-in 300ms var(--ease-spring);
}

@keyframes scale-in {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
```

### 8.2. Toast Slide In

**Timeline**:

```
Time      Position (translateX)    Opacity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms     100% (off-screen right)  0
T+150ms   50%                      0.5
T+300ms   0 (on-screen)            1
```

**CSS**:

```css
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toast {
  animation: slide-in-right 300ms var(--ease-out);
}
```

---

## 9. Implementation Helpers

### 9.1. React Hooks

**useAnimation Hook**:

```javascript
import { useEffect, useRef } from 'react';

export function useAnimation(trigger, className, duration = 600) {
  const elementRef = useRef(null);

  useEffect(() => {
    if (!trigger || !elementRef.current) return;

    elementRef.current.classList.add(className);

    const timeout = setTimeout(() => {
      if (elementRef.current) {
        elementRef.current.classList.remove(className);
      }
    }, duration);

    return () => clearTimeout(timeout);
  }, [trigger, className, duration]);

  return elementRef;
}

// Usage
const successRef = useAnimation(isSuccess, 'success-pulse', 600);

<div ref={successRef}>Success content</div>
```

**useReducedMotion Hook**:

```javascript
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return prefersReducedMotion;
}

// Usage
const prefersReducedMotion = useReducedMotion();

<button
  className={prefersReducedMotion ? 'btn' : 'btn btn-animated'}
>
  Click me
</button>
```

### 9.2. Animation Utilities

**JavaScript Utilities**:

```javascript
// Trigger animation and wait for completion
export async function animateElement(element, className, duration) {
  return new Promise((resolve) => {
    element.classList.add(className);

    setTimeout(() => {
      element.classList.remove(className);
      resolve();
    }, duration);
  });
}

// Chain animations
export async function chainAnimations(animations) {
  for (const { element, className, duration } of animations) {
    await animateElement(element, className, duration);
  }
}

// Usage
await chainAnimations([
  { element: button, className: 'glow-pulse', duration: 600 },
  { element: card, className: 'lime-flash', duration: 300 },
]);
```

---

## 10. Testing Micro-interactions

### Checklist

**Before Deployment**:

- [ ] All timings match specifications (±50ms tolerance)
- [ ] Easing functions are correct (inspect in DevTools)
- [ ] Animations respect `prefers-reduced-motion`
- [ ] No janky animations (60fps maintained)
- [ ] Keyboard interactions have visual feedback
- [ ] Touch interactions feel responsive on mobile
- [ ] Loading states prevent double-clicks
- [ ] Success states feel celebratory but not excessive
- [ ] Error states are noticeable but not alarming
- [ ] Modal focus trap works correctly

**Testing Tools**:
- Chrome DevTools > Performance tab (60fps check)
- Chrome DevTools > Animations inspector
- Manual testing with keyboard navigation
- Manual testing with reduced motion enabled
- Mobile device testing (iOS Safari, Android Chrome)

---

**Document prepared by**: Design Team
**Last updated**: November 21, 2025
**Related**: DESIGN_SYSTEM_ORGANIC_FACTORY.md, COMPONENTS_SPECIFICATIONS.md
