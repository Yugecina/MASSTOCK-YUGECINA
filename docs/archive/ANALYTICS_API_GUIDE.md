# Analytics API - Frontend Integration Guide

Quick reference for frontend developers to integrate analytics endpoints.

## Base URL
```
http://localhost:3000/api/v1/admin/analytics
```

## Authentication

All endpoints require:
- Bearer token in Authorization header
- Admin role
- Example:
```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

## Endpoints

### 1. Overview Metrics (Dashboard KPIs)

```javascript
// GET /analytics/overview
const response = await fetch('/api/v1/admin/analytics/overview', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const data = await response.json();
/*
{
  "success": true,
  "data": {
    "totalUsers": 45,
    "activeUsers": 38,
    "totalExecutions": 2450,
    "successRate": 94.2,
    "failureRate": 5.8,
    "revenueThisMonth": 12500.00,
    "revenueLastMonth": 11200.00,
    "successTrend": 11.61,      // Percentage change
    "executionsTrend": 8.3       // Percentage change
  }
}
*/
```

**Use for:**
- Dashboard KPI cards
- Summary statistics
- Trend indicators

---

### 2. Executions Trend (LineChart Data)

```javascript
// GET /analytics/executions-trend?period=7d
const period = '7d'; // '7d', '30d', or '90d'
const response = await fetch(
  `/api/v1/admin/analytics/executions-trend?period=${period}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const data = await response.json();
/*
{
  "success": true,
  "period": "7d",
  "data": [
    {
      "date": "2025-11-17",
      "total": 150,
      "successful": 141,
      "failed": 9
    },
    // ... more days
  ]
}
*/
```

**Use for:**
- Line charts (Recharts LineChart)
- Trend visualization
- Date range: last 7, 30, or 90 days

**Recharts Example:**
```jsx
<LineChart data={data.data}>
  <Line dataKey="successful" stroke="#10b981" />
  <Line dataKey="failed" stroke="#ef4444" />
  <XAxis dataKey="date" />
  <YAxis />
</LineChart>
```

---

### 3. Workflow Performance (Top Workflows)

```javascript
// GET /analytics/workflow-performance?period=30d
const period = '30d';
const response = await fetch(
  `/api/v1/admin/analytics/workflow-performance?period=${period}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const data = await response.json();
/*
{
  "success": true,
  "period": "30d",
  "data": [
    {
      "id": "workflow-uuid",
      "name": "Content Generation",
      "executions": 500,
      "successRate": 95.0,
      "avgDuration": 45.2,    // seconds
      "revenue": 2500.00
    },
    // ... more workflows (top 20)
  ]
}
*/
```

**Use for:**
- Workflow performance tables
- Bar charts comparing workflows
- Success rate badges

---

### 4. Revenue Breakdown

```javascript
// By Client
const response = await fetch(
  '/api/v1/admin/analytics/revenue-breakdown?type=client&period=30d',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

// By Workflow
const response = await fetch(
  '/api/v1/admin/analytics/revenue-breakdown?type=workflow&period=30d',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const data = await response.json();
/*
Client type:
{
  "success": true,
  "type": "client",
  "period": "30d",
  "data": [
    {
      "client_id": "uuid",
      "client_name": "ACME Corp",
      "total_revenue": 5000.00,
      "executions": 500
    }
  ]
}

Workflow type:
{
  "success": true,
  "type": "workflow",
  "period": "30d",
  "data": [
    {
      "workflow_id": "uuid",
      "workflow_name": "Content Gen",
      "total_revenue": 4500.00,
      "executions": 450
    }
  ]
}
*/
```

**Use for:**
- Pie charts (revenue distribution)
- Revenue tables
- Client/workflow comparisons

**Recharts Pie Chart:**
```jsx
<PieChart>
  <Pie
    data={data.data}
    dataKey="total_revenue"
    nameKey="client_name"
  />
</PieChart>
```

---

### 5. Recent Failures (Error Logs)

```javascript
// GET /analytics/failures?period=30d&limit=50
const response = await fetch(
  '/api/v1/admin/analytics/failures?period=30d&limit=50',
  { headers: { 'Authorization': `Bearer ${token}` } }
);

const data = await response.json();
/*
{
  "success": true,
  "period": "30d",
  "total": 12,
  "data": [
    {
      "id": "execution-uuid",
      "workflow_id": "workflow-uuid",
      "workflow_name": "Content Gen",
      "client_id": "client-uuid",
      "client_name": "ACME Corp",
      "error_message": "API timeout",
      "error_stack_trace": "Error: timeout at line 42...",
      "created_at": "2025-11-17T10:30:00Z",
      "duration_seconds": 120,
      "retry_count": 2
    }
  ]
}
*/
```

**Use for:**
- Error logs table
- Debugging panel
- Failure rate monitoring

---

## Query Parameters

### period
- Valid values: `'7d'`, `'30d'`, `'90d'`
- Default: varies by endpoint
- Used in: executions-trend, workflow-performance, revenue-breakdown, failures

### type
- Valid values: `'client'`, `'workflow'`
- Default: `'client'`
- Used in: revenue-breakdown

### limit
- Valid range: 1-500
- Default: 100
- Used in: failures

---

## Error Handling

```javascript
try {
  const response = await fetch(endpoint, options);
  const data = await response.json();

  if (!response.ok) {
    // Handle error
    console.error(data.message);
    // data.code will contain error code
    // data.statusCode will contain HTTP status
  }

  // Success
  return data.data;
} catch (error) {
  console.error('Network error:', error);
}
```

**Common Error Codes:**
- `INVALID_PERIOD` - Invalid period parameter
- `INVALID_TYPE` - Invalid type parameter
- `DATABASE_ERROR` - Database query failed
- `ANALYTICS_ERROR` - General analytics error

---

## React Hook Example

```jsx
import { useState, useEffect } from 'react';

export function useAnalyticsOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/v1/admin/analytics/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOverview();
  }, []);

  return { data, loading, error };
}

// Usage in component:
function Dashboard() {
  const { data, loading, error } = useAnalyticsOverview();

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;

  return (
    <div>
      <KPICard label="Total Users" value={data.totalUsers} />
      <KPICard label="Success Rate" value={`${data.successRate}%`} />
    </div>
  );
}
```

---

## Service Layer Example

```javascript
// services/analyticsService.js
const API_BASE = '/api/v1/admin/analytics';

export const analyticsService = {
  async getOverview() {
    const response = await fetch(`${API_BASE}/overview`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  },

  async getExecutionsTrend(period = '7d') {
    const response = await fetch(
      `${API_BASE}/executions-trend?period=${period}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  },

  async getWorkflowPerformance(period = '30d') {
    const response = await fetch(
      `${API_BASE}/workflow-performance?period=${period}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  },

  async getRevenueBreakdown(type = 'client', period = '30d') {
    const response = await fetch(
      `${API_BASE}/revenue-breakdown?type=${type}&period=${period}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  },

  async getFailures(period = '30d', limit = 100) {
    const response = await fetch(
      `${API_BASE}/failures?period=${period}&limit=${limit}`,
      { headers: this.getHeaders() }
    );
    return this.handleResponse(response);
  },

  getHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  async handleResponse(response) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data;
  }
};
```

---

## Zustand Store Example

```javascript
// store/analyticsStore.js
import { create } from 'zustand';
import { analyticsService } from '../services/analyticsService';

export const useAnalyticsStore = create((set) => ({
  overview: null,
  executionsTrend: null,
  workflowPerformance: null,
  loading: false,
  error: null,

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const data = await analyticsService.getOverview();
      set({ overview: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchExecutionsTrend: async (period = '7d') => {
    set({ loading: true, error: null });
    try {
      const data = await analyticsService.getExecutionsTrend(period);
      set({ executionsTrend: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // ... other actions
}));

// Usage:
function AnalyticsDashboard() {
  const { overview, fetchOverview } = useAnalyticsStore();

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return <div>{/* Use overview data */}</div>;
}
```

---

## Testing with Postman

Import these endpoints into Postman:
1. Set environment variable `{{baseUrl}}` = `http://localhost:3000`
2. Set auth token in Authorization tab (Bearer Token)
3. Test each endpoint:

```
GET {{baseUrl}}/api/v1/admin/analytics/overview
GET {{baseUrl}}/api/v1/admin/analytics/executions-trend?period=7d
GET {{baseUrl}}/api/v1/admin/analytics/workflow-performance?period=30d
GET {{baseUrl}}/api/v1/admin/analytics/revenue-breakdown?type=client&period=30d
GET {{baseUrl}}/api/v1/admin/analytics/failures?period=30d&limit=50
```

---

## Notes

1. All endpoints require admin authentication
2. Rate limiting applies (check adminLimiter settings)
3. Dates are in ISO 8601 format (UTC)
4. Revenue values are in decimal format (2 decimal places)
5. Success/failure rates are percentages (0-100)
6. Trends are percentage changes (can be negative)

---

## Support

For issues or questions:
- Check backend logs for errors
- Verify authentication token is valid
- Ensure admin role is assigned
- Check network tab for request details
