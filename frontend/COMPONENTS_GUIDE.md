# MasStock Dashboard Components Guide

## Quick Start

Import components from the centralized export:

```jsx
import { CardAsset, StatsCarousel, FilterTabs, ViewToggle, Sparkline } from '../components/dashboard'
```

## Component API Reference

### 1. CardAsset

Professional card component for displaying workflow/asset information.

#### Usage
```jsx
<CardAsset
  icon="📊"
  iconBg="bg-blue-500"
  title="Data Processing"
  subtitle="Automated data pipeline"
  price="1,234 executions"
  change="+12% this week"
  isPositive={true}
  onClick={() => handleClick()}
  sparklineData={[...]}
/>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| icon | string | '📊' | Icon character or emoji |
| iconBg | string | 'bg-blue-500' | Tailwind background color class |
| title | string | 'Asset Name' | Card title |
| subtitle | string | 'Description' | Card subtitle |
| price | string | '$0.00' | Price or value to display |
| change | string | '+0.0%' | Percentage change |
| isPositive | boolean | true | Whether change is positive (affects gradient) |
| onClick | function | - | Click handler |
| sparklineData | array | [] | Data for sparkline chart |
| className | string | '' | Additional CSS classes |

#### Visual Features
- Gradient background (green for positive, red for negative)
- Square colored icon
- Integrated sparkline chart
- Hover effect with shadow transition
- Responsive text truncation

---

### 2. StatsCarousel

Horizontal scrolling carousel for displaying statistics.

#### Usage
```jsx
<StatsCarousel
  stats={[
    {
      label: 'Total Volume',
      value: '$2.4M',
      icon: '💰',
      color: 'bg-blue-500',
      subtitle: '+12% this week'
    },
    // ... more stats
  ]}
/>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| stats | array | [] | Array of stat objects |
| className | string | '' | Additional CSS classes |

#### Stat Object Structure
```typescript
{
  label: string      // Stat label
  value: string      // Stat value
  icon: string       // Icon emoji
  color: string      // Background color class
  subtitle?: string  // Optional subtitle
}
```

#### Features
- Horizontal scroll with smooth behavior
- Left/right navigation buttons
- Hidden scrollbar
- Responsive card width (264px)
- Auto-generated demo data if none provided

---

### 3. FilterTabs

Category filter tabs with active state and count badges.

#### Usage
```jsx
<FilterTabs
  tabs={[
    { id: 'all', label: 'All Items', count: 42 },
    { id: 'category1', label: 'Category 1', count: 18 },
  ]}
  activeTab="all"
  onTabChange={(tabId) => setActiveTab(tabId)}
/>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tabs | array | [] | Array of tab objects |
| activeTab | string | - | Currently active tab id |
| onTabChange | function | - | Callback when tab changes |
| className | string | '' | Additional CSS classes |

#### Tab Object Structure
```typescript
{
  id: string         // Unique tab identifier
  label: string      // Tab label
  count?: number     // Optional count badge
}
```

#### Styling
- Active: Blue background, white text
- Inactive: White background, gray text, border
- Hover: Light gray background (inactive only)
- Responsive horizontal scroll

---

### 4. ViewToggle

Toggle between grid and list view modes.

#### Usage
```jsx
<ViewToggle
  view="grid"  // or "list"
  onViewChange={(newView) => setView(newView)}
/>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| view | string | 'grid' | Current view mode ('grid' or 'list') |
| onViewChange | function | - | Callback when view changes |
| className | string | '' | Additional CSS classes |

#### Features
- SVG icons for grid and list
- Active state highlighting
- Smooth transitions
- Compact inline design

---

### 5. Sparkline

Minimal inline chart for trend visualization.

#### Usage
```jsx
<Sparkline
  data={[
    { value: 50 },
    { value: 65 },
    { value: 55 },
    { value: 70 },
  ]}
  color="#34C759"
  height={40}
/>
```

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | array | [] | Array of data points |
| color | string | '#34C759' | Line color |
| height | number | 40 | Chart height in pixels |

#### Data Point Structure
```typescript
{
  value: number  // Y-axis value
}
```

#### Features
- Uses recharts LineChart
- Smooth monotone curve
- No dots or grid
- Auto-generates sample data if none provided
- Responsive width (100%)

---

## Color Palette

### Icon Backgrounds
- Blue: `bg-blue-500`
- Green: `bg-green-500`
- Purple: `bg-purple-500`
- Orange: `bg-orange-500`
- Cyan: `bg-cyan-500`
- Indigo: `bg-indigo-500`
- Pink: `bg-pink-500`
- Emerald: `bg-emerald-500`

### Gradients
- Positive: Green to Light Green (`from-green-50 to-emerald-50`)
- Negative: Red to Light Red (`from-red-50 to-rose-50`)

### Status Colors
- Success: `#34C759`
- Error: `#FF3B30`
- Warning: `#FF9500`
- Primary: `#007AFF`

---

## Layout Patterns

### 3-Column Grid (Responsive)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <CardAsset key={item.id} {...item} />)}
</div>
```

Breakpoints:
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (> 1024px): 3 columns

### Stats Grid (4 Columns)
```jsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
</div>
```

### List View
```jsx
<div className="space-y-3">
  {items.map(item => <ListRow key={item.id} {...item} />)}
</div>
```

---

## Common Patterns

### Loading State
```jsx
{loading ? (
  <div className="flex justify-center py-12">
    <Spinner size="lg" />
  </div>
) : (
  <Content />
)}
```

### Empty State
```jsx
<div className="text-center py-12">
  <div className="text-6xl mb-4">🔍</div>
  <h3 className="text-h3 font-semibold mb-2">No items found</h3>
  <p className="text-neutral-600">Try adjusting your filters</p>
</div>
```

### Section Header with Action
```jsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-h2 font-bold">Section Title</h2>
  <button className="text-primary-main hover:text-primary-dark font-medium text-sm">
    View all →
  </button>
</div>
```

### Search Input
```jsx
<div className="relative">
  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400">
    {/* search icon */}
  </svg>
  <input
    type="text"
    placeholder="Search..."
    className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-main"
  />
</div>
```

---

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order is logical
- Enter/Space activates buttons

### ARIA Labels
```jsx
<button aria-label="Grid view">
  {/* icon */}
</button>
```

### Focus States
- Blue ring on focus: `focus:ring-2 focus:ring-primary-main`
- Visible focus indicators on all interactive elements

---

## Performance Tips

1. **Memoize expensive computations**
```jsx
const sortedData = useMemo(() =>
  data.sort((a, b) => b.value - a.value),
  [data]
)
```

2. **Debounce search input**
```jsx
const debouncedSearch = useMemo(
  () => debounce((value) => setSearch(value), 300),
  []
)
```

3. **Virtualize long lists**
```jsx
// Use react-window or react-virtualized for lists > 100 items
```

4. **Lazy load images**
```jsx
<img loading="lazy" src={src} alt={alt} />
```

---

## Testing Examples

### Component Testing
```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CardAsset } from './CardAsset'

test('CardAsset handles click', () => {
  const handleClick = jest.fn()
  render(<CardAsset title="Test" onClick={handleClick} />)

  fireEvent.click(screen.getByText('Test'))
  expect(handleClick).toHaveBeenCalled()
})
```

### Integration Testing
```jsx
test('Dashboard renders workflow cards', async () => {
  render(<Dashboard />)

  await waitFor(() => {
    expect(screen.getByText('Recent Workflows')).toBeInTheDocument()
  })
})
```

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Required features:
- CSS Grid
- CSS Flexbox
- ES6+ JavaScript
- SVG support
