# MasStock Frontend

A complete React 18 application for managing automation workflows.

## Setup

```bash
npm install
```

## Development

```bash
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`

**Test Credentials:**
- Email: `estee@masstock.local`
- Password: `demo123`

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Project Structure

- `src/components/` - UI components and layouts
- `src/pages/` - Page components
- `src/services/` - API service calls
- `src/store/` - Zustand stores
- `src/hooks/` - Custom React hooks

## Features

- ✅ Authentication (JWT)
- ✅ Client dashboard
- ✅ Workflow management
- ✅ Workflow execution (4-step process)
- ✅ Admin dashboard
- ✅ Client management
- ✅ Error tracking
- ✅ Support tickets
- ✅ Financial analytics
- ✅ Responsive design

## Tech Stack

- React 18
- Vite
- TailwindCSS
- Zustand
- React Router v6
- Axios
- React Hook Form
- Recharts
- React Hot Toast
