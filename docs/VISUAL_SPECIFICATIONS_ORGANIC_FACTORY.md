# Spécifications Visuelles : "The Organic Factory"
## MASSTOCK - Guide d'Implémentation Détaillé

**Version** : 1.0
**Date** : 21 Novembre 2025
**Référence** : UX_RESEARCH_REPORT_ORGANIC_FACTORY.md

Ce document complète le rapport UX avec des spécifications visuelles détaillées, des wireframes ASCII, et des exemples de code CSS/JSX pour faciliter l'implémentation.

---

## 1. Pages Prioritaires - Wireframes Détaillés

### 1.1. Dashboard (Landing After Login)

#### Layout Structure
```
┌────────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (280px, fixed)                    │ MAIN CONTENT                   │
│                                           │                                │
│ ┌──────────────────────┐                 │ ┌────────────────────────────┐ │
│ │                      │                 │ │ HEADER BAR                 │ │
│ │   [M] MasStock       │                 │ │ bg: white, border-b        │ │
│ │   (Indigo, Clash)    │                 │ │ height: 64px               │ │
│ │                      │                 │ └────────────────────────────┘ │
│ ├──────────────────────┤                 │                                │
│ │ NAV                  │                 │ ┌────────────────────────────┐ │
│ │                      │                 │ │ HERO SECTION (if empty)    │ │
│ │ • Dashboard          │                 │ │ bg: gradient-indigo        │ │
│ │ • Workflows          │                 │ │ padding: 48px              │ │
│ │ • Executions         │                 │ │ border-radius: 12px        │ │
│ │ • Requests           │                 │ │                            │ │
│ │ • Settings           │                 │ │ 🚀 Welcome to MasStock!   │ │
│ │                      │                 │ │ Generate AI visuals in 60s │ │
│ │                      │                 │ │                            │ │
│ │                      │                 │ │ [Start with Nano Banana]  │ │
│ │                      │                 │ │ (Lime button, glow)        │ │
│ │                      │                 │ │                            │ │
│ │                      │                 │ │ [Watch Tutorial] (Ghost)   │ │
│ │                      │                 │ └────────────────────────────┘ │
│ │                      │                 │                                │
│ │                      │                 │ ┌────────────────────────────┐ │
│ ├──────────────────────┤                 │ │ METRICS BENTO GRID         │ │
│ │ USER PROFILE         │                 │ │ grid-cols-4, gap: 16px     │ │
│ │                      │                 │ ├───────┬───────┬───────┬───┤ │
│ │ {Avatar}             │                 │ │ Active│ Total │Success│Time│ │
│ │ Marie Dubois         │                 │ │ Wkflw │ Exec  │ Rate  │Savd│ │
│ │ marie@agency.com     │                 │ │       │       │       │    │ │
│ │                      │                 │ │  [8]  │ [142] │[98.5%]│[24h│ │
│ │ [Logout]             │                 │ │Indigo │Ghost  │ Lime  │Ind.│ │
│ └──────────────────────┘                 │ └───────┴───────┴───────┴───┘ │
│                                           │                                │
│                                           │ ┌────────────────────────────┐ │
│                                           │ │ RECENT WORKFLOWS           │ │
│                                           │ │ grid-cols-3, gap: 16px     │ │
│                                           │ ├───────┬────────┬───────────┤ │
│                                           │ │ Card1 │ Card2  │  Card3    │ │
│                                           │ │       │        │           │ │
│                                           │ │ Hover:│ scale  │ shadow-md │ │
│                                           │ │[▶Run] │        │           │ │
│                                           │ └───────┴────────┴───────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

#### CSS Implementation

```css
/* Dashboard Container */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: var(--canvas-ghost-white);
}

/* Hero Section (Empty State) */
.dashboard-hero {
  background: linear-gradient(135deg,
    var(--brand-indigo-600) 0%,
    var(--brand-indigo-500) 50%,
    var(--brand-indigo-400) 100%
  );
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  color: white;
  margin-bottom: 32px;
  box-shadow: var(--shadow-xl);
}

.dashboard-hero h1 {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  margin-bottom: 16px;
}

.dashboard-hero p {
  font-family: var(--font-body);
  font-size: var(--text-lg);
  margin-bottom: 32px;
  opacity: 0.9;
}

/* CTA Button (Lime) */
.btn-hero-primary {
  background: var(--action-lime);
  color: var(--structure-obsidian);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  padding: 16px 32px;
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 0 0 rgba(204, 255, 0, 0);
}

.btn-hero-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
}

.btn-hero-primary:active {
  transform: scale(0.98);
}

/* Metrics Bento Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--structure-neutral-200);
  transition: all 200ms ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.metric-card.metric-indigo {
  background: linear-gradient(135deg,
    var(--brand-indigo-50) 0%,
    var(--brand-indigo-100) 100%
  );
  border-color: var(--brand-indigo-200);
}

.metric-card.metric-lime-accent {
  background: white;
  border-left: 4px solid var(--action-lime);
}

.metric-card .label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--structure-neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.metric-card .value {
  font-family: var(--font-display);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  color: var(--structure-obsidian);
}

/* Workflow Cards Grid */
.workflows-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.workflow-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--structure-neutral-200);
  cursor: pointer;
  transition: all 200ms ease;
  position: relative;
  overflow: hidden;
}

.workflow-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg,
    var(--brand-indigo-600),
    var(--brand-indigo-400)
  );
  transform: scaleX(0);
  transition: transform 300ms ease;
}

.workflow-card:hover::before {
  transform: scaleX(1);
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-indigo-200);
}

.workflow-card .icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg,
    var(--brand-indigo-100),
    var(--brand-indigo-50)
  );
}

.workflow-card .title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--structure-obsidian);
  margin-bottom: 8px;
}

.workflow-card .description {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--structure-neutral-600);
  margin-bottom: 16px;
  line-height: var(--leading-relaxed);
}

.workflow-card .quick-action {
  background: var(--action-lime);
  color: var(--structure-obsidian);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border: none;
  cursor: pointer;
  opacity: 0;
  transform: translateY(10px);
  transition: all 200ms ease;
}

.workflow-card:hover .quick-action {
  opacity: 1;
  transform: translateY(0);
}
```

#### JSX Component Example

```jsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ClientLayout } from '../components/layout/ClientLayout'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [hasWorkflows, setHasWorkflows] = useState(false)

  return (
    <ClientLayout>
      {/* Hero Section (Empty State) */}
      {!hasWorkflows && (
        <div className="dashboard-hero">
          <h1>Welcome to MasStock!</h1>
          <p>Generate your first AI visuals in 60 seconds</p>
          <button
            className="btn-hero-primary"
            onClick={() => navigate('/workflows/nano-banana/execute')}
          >
            Start with Nano Banana
          </button>
          <button className="btn-hero-secondary">
            Watch Tutorial
          </button>
        </div>
      )}

      {/* Metrics Bento Grid */}
      <div className="metrics-grid">
        <div className="metric-card metric-indigo">
          <div className="label">Active Workflows</div>
          <div className="value">8</div>
        </div>
        <div className="metric-card">
          <div className="label">Total Executions</div>
          <div className="value">142</div>
        </div>
        <div className="metric-card metric-lime-accent">
          <div className="label">Success Rate</div>
          <div className="value">98.5%</div>
        </div>
        <div className="metric-card metric-indigo">
          <div className="label">Time Saved</div>
          <div className="value">24h</div>
        </div>
      </div>

      {/* Recent Workflows Grid */}
      <div className="workflows-grid">
        {workflows.map(wf => (
          <div
            key={wf.id}
            className="workflow-card"
            onClick={() => navigate(`/workflows/${wf.id}`)}
          >
            <div className="icon">📊</div>
            <div className="title">{wf.name}</div>
            <div className="description">{wf.description}</div>
            <button
              className="quick-action"
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/workflows/${wf.id}/execute`)
              }}
            >
              ▶ Run Now
            </button>
          </div>
        ))}
      </div>
    </ClientLayout>
  )
}
```

---

### 1.2. WorkflowExecute - Processing State (Reference Implementation)

#### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          PROCESSING STATE                                  │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     STEP INDICATOR                                 │   │
│  │  [▰▰▰▰▰▰] Configure  [▰▰▰▰▰▰] Processing  [▱▱▱▱▱▱] Results        │   │
│  │    ✓ Complete          ⚡ Active         ⏱️ Pending               │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │                     CARD (Glassmorphism subtle)                    │   │
│  │                                                                    │   │
│  │          ┌───────────────────────────────────────────┐            │   │
│  │          │                                           │            │   │
│  │          │        [Indigo Gradient Glow]            │            │   │
│  │          │        Animated Pulse (infinite)          │            │   │
│  │          │                                           │            │   │
│  │          │     Generating your images...             │            │   │
│  │          │     (Satoshi, 20px, Obsidian)            │            │   │
│  │          │                                           │            │   │
│  │          │     Processing prompt 3 of 10             │            │   │
│  │          │     (2 succeeded, 0 failed)               │            │   │
│  │          │     (JetBrains Mono, 14px, Neutral-600)  │            │   │
│  │          │                                           │            │   │
│  │          │     ⏱️ Elapsed: 0:24  |  🔮 Est: 1:36     │            │   │
│  │          │     (Satoshi, 14px, Neutral-500)         │            │   │
│  │          │                                           │            │   │
│  │          │  [██████████░░░░░░░░░░] 30%               │            │   │
│  │          │  (Progress bar: Indigo fill, Ghost bg)    │            │   │
│  │          │                                           │            │   │
│  │          │     [Cancel Batch] (Ghost button)         │            │   │
│  │          │                                           │            │   │
│  │          └───────────────────────────────────────────┘            │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Animated Gradient Glow (CSS)

```css
/* Gradient Glow Container */
.processing-glow-container {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto 32px;
}

/* Animated Gradient Glow */
@keyframes gradient-pulse {
  0%, 100% {
    background-position: 0% 50%;
    opacity: 1;
  }
  50% {
    background-position: 100% 50%;
    opacity: 0.7;
  }
}

.gradient-glow {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    270deg,
    var(--brand-indigo-600),
    var(--brand-indigo-500),
    var(--brand-indigo-400),
    var(--brand-indigo-500),
    var(--brand-indigo-600)
  );
  background-size: 400% 400%;
  animation: gradient-pulse 3s ease infinite;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.8;
}

/* Processing State Card */
.processing-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  box-shadow: var(--shadow-xl);
  max-width: 600px;
  margin: 0 auto;
}

/* Processing Text */
.processing-title {
  font-family: var(--font-body);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  color: var(--structure-obsidian);
  margin-bottom: 16px;
}

.processing-stats {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--structure-neutral-600);
  margin-bottom: 24px;
}

.processing-time {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--structure-neutral-500);
  margin-bottom: 24px;
}

/* Progress Bar */
.progress-bar-container {
  width: 100%;
  height: 8px;
  background: var(--structure-neutral-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 24px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg,
    var(--brand-indigo-600),
    var(--brand-indigo-500)
  );
  border-radius: 4px;
  transition: width 500ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(79, 70, 229, 0.5);
}

/* Cancel Button */
.btn-cancel {
  background: transparent;
  color: var(--structure-neutral-600);
  border: 1px solid var(--structure-neutral-300);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-cancel:hover {
  background: var(--structure-neutral-100);
  border-color: var(--structure-neutral-400);
}
```

#### JSX Implementation

```jsx
export function ProcessingState({ stats, elapsedTime, progress, onCancel }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const estimateRemaining = () => {
    if (stats.current === 0) return null
    const avgTime = elapsedTime / stats.current
    const remaining = Math.floor(avgTime * (stats.total - stats.current))
    return formatTime(remaining)
  }

  return (
    <div className="processing-card">
      {/* Animated Glow */}
      <div className="processing-glow-container">
        <div className="gradient-glow" />
      </div>

      {/* Status Text */}
      <h2 className="processing-title">Generating your images...</h2>

      {/* Live Stats */}
      <div className="processing-stats">
        Processing prompt {stats.current} of {stats.total}
        <br />
        ({stats.succeeded} succeeded, {stats.failed} failed)
      </div>

      {/* Time Stats */}
      <div className="processing-time">
        ⏱️ Elapsed: {formatTime(elapsedTime)}
        {estimateRemaining() && ` | 🔮 Est: ${estimateRemaining()}`}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Cancel Button */}
      <button className="btn-cancel" onClick={onCancel}>
        Cancel Batch
      </button>
    </div>
  )
}
```

---

### 1.3. Executions Page - Enhanced Layout

#### Layout Structure

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         EXECUTIONS PAGE                                    │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ HEADER                                                             │   │
│  │ Workflow Executions                      [Refresh] [Back]         │   │
│  │ Monitor and review all your execution history                      │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ STATUS CARDS (Clickable Filters)                                   │   │
│  ├──────┬──────┬──────┬──────┬──────┐                                │   │
│  │Total │ ✅   │  ⚡  │  ⏱️  │  ❌  │                                  │   │
│  │ 120  │ 115  │  2   │  0   │  3   │                                  │   │
│  │      │Complt│Proce │Pend. │Fail  │                                  │   │
│  └──────┴──────┴──────┴──────┴──────┘                                │   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ FILTERS CARD                                                       │   │
│  │ [Status: All ▾] [Workflow: All ▾] [Sort: Newest ▾] [Clear]       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ EXECUTIONS LIST                                                    │   │
│  │ Executions (120 results)                                           │   │
│  │                                                                    │   │
│  │ ┌──────────────────────────────────────────────────────────────┐ │   │
│  │ │ [✅] Nano Banana Workflow    [Success]                       │ │   │
│  │ │      Nov 21, 2025 14:32      Duration: 2.3s          [→]     │ │   │
│  │ └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │ ┌──────────────────────────────────────────────────────────────┐ │   │
│  │ │ [⚡] Product Images           [Processing]                    │ │   │
│  │ │      Nov 21, 2025 14:28      Progress: 75%           [→]     │ │   │
│  │ └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │ ┌──────────────────────────────────────────────────────────────┐ │   │
│  │ │ [❌] Social Media Posts       [Failed]                        │ │   │
│  │ │      Nov 21, 2025 14:20      Error: API Key Invalid  [→]     │ │   │
│  │ └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Status Card Styles

```css
/* Status Cards Grid */
.status-cards-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.status-card {
  background: white;
  border: 2px solid var(--structure-neutral-200);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 200ms ease;
  text-align: center;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* Active State */
.status-card.active {
  border-color: var(--brand-indigo-600);
  background: var(--brand-indigo-50);
  box-shadow: var(--shadow-sm);
}

/* Success Variant */
.status-card.success:hover {
  border-color: var(--success);
}

.status-card.success.active {
  border-color: var(--success);
  background: var(--success-light);
}

/* Error Variant */
.status-card.error:hover {
  border-color: var(--error);
}

.status-card.error.active {
  border-color: var(--error);
  background: var(--error-light);
}

/* Warning Variant */
.status-card.warning:hover {
  border-color: var(--warning);
}

.status-card.warning.active {
  border-color: var(--warning);
  background: var(--warning-light);
}

.status-card .icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.status-card .count {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--structure-obsidian);
  margin-bottom: 4px;
}

.status-card .label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--structure-neutral-600);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
```

#### Execution List Item Styles

```css
/* Execution List Item */
.execution-item {
  background: white;
  border: 1px solid var(--structure-neutral-200);
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: all 200ms ease;
  margin-bottom: 12px;
}

.execution-item:hover {
  background: var(--structure-neutral-50);
  border-color: var(--structure-neutral-300);
  box-shadow: var(--shadow-sm);
  transform: translateX(4px);
}

/* Status Icon */
.execution-item .status-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.execution-item .status-icon.success {
  background: var(--success-light);
  color: var(--success-dark);
}

.execution-item .status-icon.error {
  background: var(--error-light);
  color: var(--error-dark);
}

.execution-item .status-icon.processing {
  background: var(--warning-light);
  color: var(--warning-dark);
  animation: spin 2s linear infinite;
}

/* Content */
.execution-item .content {
  flex: 1;
  min-width: 0;
}

.execution-item .title {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--structure-obsidian);
  margin-bottom: 4px;
}

.execution-item .meta {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--structure-neutral-600);
  display: flex;
  align-items: center;
  gap: 16px;
}

.execution-item .meta .timestamp {
  display: flex;
  align-items: center;
  gap: 4px;
}

.execution-item .meta .duration {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Badge */
.execution-item .badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  flex-shrink: 0;
}

.execution-item .badge.success {
  background: var(--success-light);
  color: var(--success-dark);
}

.execution-item .badge.error {
  background: var(--error-light);
  color: var(--error-dark);
}

.execution-item .badge.processing {
  background: var(--warning-light);
  color: var(--warning-dark);
}

/* Arrow Icon */
.execution-item .arrow {
  color: var(--structure-neutral-400);
  transition: all 200ms ease;
  flex-shrink: 0;
}

.execution-item:hover .arrow {
  color: var(--brand-indigo-600);
  transform: translateX(4px);
}
```

---

## 2. Composants Atomiques

### 2.1. Button Variants

#### Specifications

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: var(--font-semibold);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  user-select: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Primary Button (Indigo) */
.btn-primary {
  background: linear-gradient(135deg,
    var(--brand-indigo-600),
    var(--brand-indigo-500)
  );
  color: white;
  padding: 12px 24px;
  font-size: var(--text-base);
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg,
    var(--brand-indigo-700),
    var(--brand-indigo-600)
  );
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);
}

/* Action Button (Lime) */
.btn-action {
  background: var(--action-lime);
  color: var(--structure-obsidian);
  padding: 12px 24px;
  font-size: var(--text-base);
  box-shadow: 0 2px 8px rgba(204, 255, 0, 0.2);
}

.btn-action:hover {
  background: var(--action-lime-soft);
  box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
  transform: scale(1.02);
}

.btn-action:active {
  transform: scale(0.98);
}

/* Secondary Button (Ghost) */
.btn-secondary {
  background: white;
  color: var(--structure-obsidian);
  padding: 12px 24px;
  font-size: var(--text-base);
  border: 2px solid var(--structure-neutral-200);
}

.btn-secondary:hover {
  background: var(--structure-neutral-50);
  border-color: var(--structure-neutral-300);
}

/* Danger Button */
.btn-danger {
  background: var(--error);
  color: white;
  padding: 12px 24px;
  font-size: var(--text-base);
  box-shadow: 0 2px 8px rgba(255, 59, 48, 0.2);
}

.btn-danger:hover {
  background: var(--error-dark);
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
}

/* Size Variants */
.btn-sm {
  padding: 8px 16px;
  font-size: var(--text-sm);
}

.btn-lg {
  padding: 16px 32px;
  font-size: var(--text-lg);
}

/* Icon Button */
.btn-icon {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--structure-neutral-600);
  border: 1px solid transparent;
}

.btn-icon:hover {
  background: var(--structure-neutral-100);
  color: var(--structure-obsidian);
}
```

#### React Component

```jsx
export function Button({
  children,
  variant = 'primary',  // primary | action | secondary | danger
  size = 'md',          // sm | md | lg
  icon,
  loading,
  disabled,
  ...props
}) {
  const className = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    loading && 'btn-loading',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={className}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={16} />}
      {icon && !loading && icon}
      {children}
    </button>
  )
}

// Usage Examples
<Button variant="primary">Save Changes</Button>
<Button variant="action">Generate Now</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="primary" loading>Processing...</Button>
```

---

### 2.2. Toast Notifications

#### Visual Specification

```
┌────────────────────────────────────────────┐
│ [✅] Success                        [×]    │
│ Workflow executed successfully            │
│ Results ready in 2.3s                     │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [❌] Error                          [×]    │
│ Invalid API key                           │
│ Get a new key from Google AI Studio      │
│ [Get API Key →]                           │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [⚠️] Warning                        [×]    │
│ Rate limit approaching                    │
│ 80% of daily quota used                   │
└────────────────────────────────────────────┘
```

#### CSS Implementation

```css
/* Toast Container */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 400px;
}

/* Toast Base */
.toast {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: toast-slide-in 300ms cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 4px solid;
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.toast.exiting {
  animation: toast-slide-out 200ms cubic-bezier(0.4, 0, 1, 1);
}

/* Variants */
.toast.success {
  border-left-color: var(--success);
}

.toast.error {
  border-left-color: var(--error);
}

.toast.warning {
  border-left-color: var(--warning);
}

.toast.info {
  border-left-color: var(--brand-indigo-600);
}

/* Toast Icon */
.toast .icon {
  font-size: 20px;
  flex-shrink: 0;
}

.toast.success .icon {
  color: var(--success);
}

.toast.error .icon {
  color: var(--error);
}

.toast.warning .icon {
  color: var(--warning);
}

.toast.info .icon {
  color: var(--brand-indigo-600);
}

/* Toast Content */
.toast .content {
  flex: 1;
  min-width: 0;
}

.toast .title {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--structure-obsidian);
  margin-bottom: 4px;
}

.toast .message {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--structure-neutral-600);
  line-height: var(--leading-relaxed);
}

.toast .action {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--brand-indigo-600);
  font-weight: var(--font-medium);
  margin-top: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 200ms ease;
}

.toast .action:hover {
  color: var(--brand-indigo-700);
}

/* Close Button */
.toast .close {
  background: transparent;
  border: none;
  color: var(--structure-neutral-400);
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: color 200ms ease;
}

.toast .close:hover {
  color: var(--structure-obsidian);
}
```

#### React Component (using react-hot-toast)

```jsx
import toast, { Toaster } from 'react-hot-toast'

// Toast Wrapper Component
export function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'toast',
        duration: 3000,
        style: {
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        },
      }}
    />
  )
}

// Success Toast
export function showSuccessToast(title, message) {
  toast.custom((t) => (
    <div className={`toast success ${t.visible ? '' : 'exiting'}`}>
      <div className="icon">✅</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="message">{message}</div>
      </div>
      <button className="close" onClick={() => toast.dismiss(t.id)}>
        ×
      </button>
    </div>
  ))
}

// Error Toast with Action
export function showErrorToast(title, message, action) {
  toast.custom((t) => (
    <div className={`toast error ${t.visible ? '' : 'exiting'}`}>
      <div className="icon">❌</div>
      <div className="content">
        <div className="title">{title}</div>
        <div className="message">{message}</div>
        {action && (
          <a
            className="action"
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {action.label} →
          </a>
        )}
      </div>
      <button className="close" onClick={() => toast.dismiss(t.id)}>
        ×
      </button>
    </div>
  ))
}

// Usage Examples
showSuccessToast('Success', 'Workflow executed successfully')

showErrorToast(
  'Invalid API Key',
  'Get a new key from Google AI Studio',
  {
    label: 'Get API Key',
    url: 'https://aistudio.google.com/app/apikey'
  }
)
```

---

### 2.3. Empty States

#### Visual Specifications

```
┌────────────────────────────────────────────────────────┐
│                                                        │
│               [Custom SVG Illustration]                │
│                     (200x200px)                        │
│                                                        │
│            No workflows yet                            │
│            (Clash Display, 24px, Obsidian)            │
│                                                        │
│      Create your first workflow to start              │
│      automating your content production               │
│      (Satoshi, 16px, Neutral-600)                    │
│                                                        │
│              [Create Workflow]                         │
│              (Lime button)                             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### CSS Implementation

```css
/* Empty State Container */
.empty-state {
  text-align: center;
  padding: 64px 32px;
  max-width: 500px;
  margin: 0 auto;
}

/* Illustration */
.empty-state .illustration {
  width: 200px;
  height: 200px;
  margin: 0 auto 32px;
  opacity: 0;
  animation: fade-in-up 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Title */
.empty-state .title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--structure-obsidian);
  margin-bottom: 12px;
}

/* Description */
.empty-state .description {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--structure-neutral-600);
  line-height: var(--leading-relaxed);
  margin-bottom: 32px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* CTA */
.empty-state .cta {
  display: inline-flex;
  gap: 12px;
}
```

#### React Component with SVG Illustration

```jsx
export function EmptyState({
  illustration = 'workflows',
  title,
  description,
  action
}) {
  const illustrations = {
    workflows: WorkflowsEmptyIllustration,
    executions: ExecutionsEmptyIllustration,
    requests: RequestsEmptyIllustration,
  }

  const Illustration = illustrations[illustration]

  return (
    <div className="empty-state">
      <div className="illustration">
        <Illustration />
      </div>
      <h3 className="title">{title}</h3>
      <p className="description">{description}</p>
      {action && (
        <div className="cta">
          <Button
            variant="action"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}

// Custom SVG Illustration (Organic Factory Style)
function WorkflowsEmptyIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="indigo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id="lime-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#D4FF33" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Background Circle (Glow) */}
      <circle
        cx="100"
        cy="100"
        r="80"
        fill="url(#indigo-gradient)"
        opacity="0.1"
      />

      {/* Workflow Icon (Abstract) */}
      <path
        d="M60,80 L80,60 L120,60 L140,80 L140,120 L120,140 L80,140 L60,120 Z"
        fill="url(#indigo-gradient)"
        opacity="0.3"
      />

      {/* Center Glow */}
      <circle
        cx="100"
        cy="100"
        r="30"
        fill="url(#lime-glow)"
      />

      {/* Particles */}
      <circle cx="70" cy="70" r="4" fill="#4F46E5" opacity="0.6" />
      <circle cx="130" cy="70" r="4" fill="#4F46E5" opacity="0.6" />
      <circle cx="70" cy="130" r="4" fill="#4F46E5" opacity="0.6" />
      <circle cx="130" cy="130" r="4" fill="#4F46E5" opacity="0.6" />

      {/* Animation (CSS or SMIL) */}
      <animate
        attributeName="opacity"
        values="0.6;1;0.6"
        dur="2s"
        repeatCount="indefinite"
      />
    </svg>
  )
}

// Usage
<EmptyState
  illustration="workflows"
  title="No workflows yet"
  description="Create your first workflow to start automating your content production"
  action={{
    label: 'Create Workflow',
    onClick: () => navigate('/workflows/create')
  }}
/>
```

---

## 3. Animation Specifications

### 3.1. Micro-interactions Timing

```javascript
// Timing Constants
export const ANIMATION_TIMING = {
  // Very Fast (100ms) - Hover, Focus
  HOVER: 100,
  FOCUS: 100,

  // Fast (200ms) - Color transitions, Opacity
  COLOR: 200,
  OPACITY: 200,

  // Medium (300ms) - Modal open, Drawer slide
  MODAL: 300,
  DRAWER: 300,

  // Slow (500ms) - Page transitions, Skeleton → Content
  PAGE: 500,
  SKELETON: 500,

  // Very Slow (1000ms+) - Decorative animations only
  DECORATIVE: 1000,
}

// Easing Functions
export const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}
```

### 3.2. Button Click Animation

```css
/* Button Click - Generate (Lime) */
@keyframes button-click-generate {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(204, 255, 0, 0);
  }
  25% {
    transform: scale(0.95);
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
  animation: button-click-generate 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### 3.3. Card Hover

```css
/* Card Hover - Elevation + Scale */
.workflow-card {
  transition:
    transform 200ms cubic-bezier(0, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
```

### 3.4. Confetti Burst (Success)

```jsx
import confetti from 'canvas-confetti'

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
  })
}

// Trigger after successful execution
useEffect(() => {
  if (execution.status === 'completed') {
    triggerSuccessConfetti()
  }
}, [execution.status])
```

---

## 4. Responsive Breakpoints

### 4.1. Breakpoint System

```css
:root {
  /* Breakpoints */
  --breakpoint-sm: 640px;   /* Mobile large */
  --breakpoint-md: 768px;   /* Tablet */
  --breakpoint-lg: 1024px;  /* Desktop */
  --breakpoint-xl: 1280px;  /* Desktop large */
  --breakpoint-2xl: 1536px; /* Desktop XL */
}

/* Mobile First Approach */

/* Base (Mobile) - 0px+ */
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet - 768px+ */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop - 1024px+ */
@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### 4.2. Sidebar Responsive

```css
/* Desktop - Sidebar visible */
@media (min-width: 1024px) {
  .sidebar {
    display: block;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 280px;
  }

  .main-content {
    margin-left: 280px;
  }
}

/* Mobile - Sidebar hidden (hamburger menu) */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    bottom: 0;
    width: 280px;
    z-index: 1000;
    transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  .sidebar.open {
    left: 0;
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  }

  .main-content {
    margin-left: 0;
  }

  .hamburger-menu {
    display: block;
  }
}
```

---

## 5. Dark Mode (Future Implementation)

### 5.1. Color Tokens (Dark Mode)

```css
/* Dark Mode Palette */
:root[data-theme='dark'] {
  /* Canvas */
  --canvas-ghost-white: #0D0D0D;
  --canvas-white: #1A1A1A;

  /* Structure */
  --structure-obsidian: #F4F5F9;
  --structure-neutral-900: #E5E7EB;
  --structure-neutral-800: #D1D5DB;
  --structure-neutral-700: #9CA3AF;
  --structure-neutral-600: #6B7280;
  --structure-neutral-500: #4B5563;
  --structure-neutral-400: #374151;
  --structure-neutral-300: #1F2937;
  --structure-neutral-200: #111827;
  --structure-neutral-100: #0D0D0D;

  /* Brand Identity (unchanged) */
  --brand-indigo-600: #6366F1;
  --brand-indigo-500: #818CF8;

  /* Action (slightly softer) */
  --action-lime: #D4FF33;
}
```

---

## Conclusion

Ce document fournit les spécifications visuelles détaillées pour implémenter le concept "The Organic Factory" sur MASSTOCK. Toutes les mesures, couleurs, animations, et timings sont définis avec précision pour garantir une exécution fidèle au concept.

**Prochaines étapes** :
1. Valider spécifications avec stakeholders
2. Créer composants Storybook
3. Implémenter Phase 1 (Dashboard + Composants de base)
4. Tests utilisateurs sur prototypes interactifs

**Fichiers de référence** :
- `/Users/dorian/Documents/MASSTOCK/docs/UX_RESEARCH_REPORT_ORGANIC_FACTORY.md` (Rapport UX complet)
- `/Users/dorian/Downloads/DA-MASSTOCK.MD` (Brief DA original)
