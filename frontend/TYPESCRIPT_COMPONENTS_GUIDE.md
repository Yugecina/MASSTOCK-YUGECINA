# TypeScript Components Quick Reference

This guide covers the newly migrated TypeScript components in the MasStock frontend.

## Critical Components

### ProtectedRoute.tsx
Route guard for authentication and authorization.

**Location**: `src/components/ProtectedRoute.tsx`

**Usage**:
```typescript
import { ProtectedRoute } from './components/ProtectedRoute'

// Basic usage - authentication only
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Admin-only route
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>

// Multiple allowed roles
<ProtectedRoute requiredRole={['admin', 'member']}>
  <ReportsPage />
</ProtectedRoute>

// Custom redirect path
<ProtectedRoute 
  requiredRole="admin" 
  redirectPath="/access-denied"
>
  <AdminSettings />
</ProtectedRoute>
```

**Props**:
- `children` (ReactNode) - Component to render if authorized
- `requiredRole?` (UserRole | UserRole[]) - Single role or array of roles
- `redirectPath?` (string) - Where to redirect if unauthorized (default: `/login`)

**Return Type**: ReactNode (Navigate component or children)

---

## UI Components

### Button.tsx
Multi-variant button with loading states.

**Location**: `src/components/ui/Button.tsx`

**Usage**:
```typescript
import { Button } from './components/ui/Button'

// Primary button (default)
<Button onClick={handleClick}>Click Me</Button>

// Secondary button
<Button variant="secondary">Secondary</Button>

// Danger button
<Button variant="danger">Delete</Button>

// Small button
<Button size="sm">Small</Button>

// Large button
<Button size="lg">Large</Button>

// Loading state
<Button loading={isLoading}>
  Submit
</Button>

// Disabled
<Button disabled>Disabled</Button>

// Combined
<Button 
  variant="primary" 
  size="lg" 
  loading={isLoading}
  onClick={handleSubmit}
>
  Submit Form
</Button>
```

**Props**:
- `children` (ReactNode) - Button text/content
- `variant?` ('primary' | 'secondary' | 'danger') - Button style
- `size?` ('sm' | 'md' | 'lg') - Button size
- `loading?` (boolean) - Shows spinner and disables button
- `disabled?` (boolean) - Disables button
- All ButtonHTMLAttributes

**CSS Classes**: `btn btn-{variant} btn-{size}`

---

### Card.tsx
Container component for grouping content.

**Location**: `src/components/ui/Card.tsx`

**Usage**:
```typescript
import { Card } from './components/ui/Card'

// Basic card
<Card>
  <h2>Content Title</h2>
  <p>Card content</p>
</Card>

// Card with custom class
<Card className="card-elevated">
  <content />
</Card>

// Multiple children
<Card>
  <header>Title</header>
  <main>Content</main>
  <footer>Footer</footer>
</Card>
```

**Props**:
- `children` (ReactNode) - Card content
- `className?` (string) - Additional CSS classes
- All HTMLAttributes

**CSS Class**: `card` (+ any custom classes)

---

### Badge.tsx
Status indicator or label component.

**Location**: `src/components/ui/Badge.tsx`

**Usage**:
```typescript
import { Badge } from './components/ui/Badge'

// Default (neutral)
<Badge>Tag</Badge>

// Success
<Badge variant="success">Active</Badge>

// Warning
<Badge variant="warning">Pending</Badge>

// Danger
<Badge variant="danger">Failed</Badge>

// In a list
{statuses.map(status => (
  <Badge key={status.id} variant={status.variant}>
    {status.label}
  </Badge>
))}
```

**Props**:
- `children` (ReactNode) - Badge text
- `variant?` ('success' | 'warning' | 'danger' | 'neutral') - Badge color
- All HTMLAttributes

**CSS Classes**: `badge badge-{variant}`

---

### Input.tsx
Form input with optional label and error display.

**Location**: `src/components/ui/Input.tsx`

**Usage**:
```typescript
import { Input } from './components/ui/Input'

// Basic input
<Input 
  id="username"
  type="text" 
  placeholder="Enter username" 
/>

// With label
<Input 
  id="email"
  label="Email Address"
  type="email"
  placeholder="user@example.com"
/>

// With error
<Input 
  id="password"
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>

// Disabled
<Input 
  id="country"
  label="Country"
  disabled
  value="United States"
/>

// All together
<Input
  id="name"
  label="Full Name"
  type="text"
  placeholder="John Doe"
  error={errors.name}
  disabled={isSubmitting}
  required
/>
```

**Props**:
- `label?` (string) - Label text
- `error?` (string) - Error message (shows error styling)
- `disabled?` (boolean) - Disabled state
- All InputHTMLAttributes

**CSS Classes**: 
- `form-input` (normal state)
- `input-error` (error state)

**ARIA Attributes**: `aria-invalid`, `aria-describedby`

---

### Modal.tsx
Dialog/overlay component.

**Location**: `src/components/ui/Modal.tsx`

**Usage**:
```typescript
import { Modal } from './components/ui/Modal'
import { useState } from 'react'

function ConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
      >
        <p>Are you sure?</p>
        <div className="modal-actions">
          <Button onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  )
}
```

**Props**:
- `isOpen` (boolean) - Controls visibility
- `onClose` () => void - Called when backdrop is clicked
- `title?` (string) - Modal title (optional)
- `children` (ReactNode) - Modal content

**Features**:
- Prevents body scroll when open
- Click backdrop to close
- Full ARIA modal support
- Centered positioning

---

### Spinner.tsx
Loading indicator component.

**Location**: `src/components/ui/Spinner.tsx`

**Usage**:
```typescript
import { Spinner } from './components/ui/Spinner'

// Default size (md)
<Spinner />

// Small
<Spinner size="sm" />

// Large
<Spinner size="lg" />

// With custom class
<Spinner size="md" className="custom-spinner" />

// Loading state
{isLoading ? <Spinner /> : <Content />}

// Inline
<button>
  {isLoading ? <Spinner /> : 'Click me'}
</button>
```

**Props**:
- `size?` ('sm' | 'md' | 'lg') - Spinner size
- `className?` (string) - Additional CSS classes
- All HTMLAttributes

**Sizes**:
- `sm`: 16px
- `md`: 24px (default)
- `lg`: 32px

**CSS Variables**: Uses `var(--primary)` for color

---

## Type Definitions

All components export their prop types:

```typescript
import { ProtectedRouteProps } from './components/ProtectedRoute'
import { ButtonProps } from './components/ui/Button'
import { CardProps } from './components/ui/Card'
import { BadgeProps } from './components/ui/Badge'
import { InputProps } from './components/ui/Input'
import { ModalProps } from './components/ui/Modal'
import { SpinnerProps } from './components/ui/Spinner'
```

## Accessibility

All components include proper ARIA attributes:

**Button**: `aria-busy` for loading state
**Input**: `aria-invalid`, `aria-describedby` for error messaging
**Modal**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
**Spinner**: `aria-busy="true"`, `aria-label="Loading"`

## CSS Classes

All components use CSS classes from `src/styles/`:

```css
/* Button */
.btn, .btn-primary, .btn-secondary, .btn-danger
.btn-sm, .btn-md, .btn-lg

/* Card */
.card

/* Badge */
.badge, .badge-success, .badge-warning, .badge-danger, .badge-neutral

/* Input */
.form-input, .input-error, .form-label

/* Modal */
[role="dialog"], [aria-modal="true"]

/* Spinner */
.spinner
```

## Testing

All components have comprehensive tests in `src/__tests__/`:

- ProtectedRoute.test.tsx (7 tests)
- Button.test.tsx (11 tests)
- Card.test.tsx (6 tests)
- Badge.test.tsx (7 tests)
- Input.test.tsx (12 tests)
- Modal.test.tsx (10 tests)
- Spinner.test.tsx (13 tests)

Run tests:
```bash
npm test                    # All tests
npm test -- ui/            # UI component tests only
npm test -- ProtectedRoute # Route guard tests
```

## Migration Notes

- Old JSX versions (.jsx) still work alongside new TypeScript versions
- Module resolution automatically handles both extensions
- No breaking changes - all APIs remain the same
- Gradual migration supported

## Common Patterns

### Form with validation
```typescript
import { Input } from './components/ui/Input'
import { Button } from './components/ui/Button'

function LoginForm() {
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <form onSubmit={handleSubmit}>
      <Input
        id="email"
        label="Email"
        type="email"
        error={errors.email}
        disabled={isSubmitting}
      />
      <Input
        id="password"
        label="Password"
        type="password"
        error={errors.password}
        disabled={isSubmitting}
      />
      <Button loading={isSubmitting} type="submit">
        Login
      </Button>
    </form>
  )
}
```

### Protected admin panel
```typescript
import { ProtectedRoute } from './components/ProtectedRoute'

<ProtectedRoute requiredRole="admin" redirectPath="/access-denied">
  <AdminPanel />
</ProtectedRoute>
```

### Loading state
```typescript
{isLoading ? (
  <Card>
    <Spinner size="lg" />
  </Card>
) : (
  <Content />
)}
```

---

**Last Updated**: 2025-12-08
**Status**: Production Ready
**Test Coverage**: 100%
