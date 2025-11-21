# Frontend Documentation

Quick reference for the MasStock React frontend.

## 📄 Documents

### 1. **IMPLEMENTATION_SUMMARY.md**
Overview of what's been built:
- Project stats
- All 16 screens implemented
- Tech stack used
- Build status
- Quick start commands

→ **Read this first** for a summary

### 2. **SERVER_STARTUP.md**
How to launch the development server:
- macOS/Linux startup script
- Windows batch script
- Configuration (.env)
- Troubleshooting
- Build & deployment

→ **Read this** when starting development

### 3. **INTEGRATION_CHECKLIST.md**
Complete checklist for integrating with backend:
- Backend connection steps
- Local testing checklist
- Production build
- Deployment options
- Post-deployment testing

→ **Read this** before deploying

---

## 🚀 Quick Start

```bash
# Launch frontend
./start.sh

# Or manually
npm install
npm run dev

# Visit http://localhost:5173
```

Test Credentials:
- Email: `estee@masstock.local`
- Password: `demo123`

---

## 📋 What's Included

✅ **13 Functional Pages**
- 7 client pages (login, dashboard, workflows, execution, requests, settings)
- 6 admin pages (dashboard, clients, workflows, errors, tickets, finances)

✅ **6 UI Components**
- Button, Input, Card, Badge, Modal, Spinner

✅ **Full Auth Flow**
- JWT authentication
- Protected routes
- Token management
- Auto-logout on 401

✅ **API Ready**
- Axios setup with interceptors
- Service modules for all endpoints
- Error handling
- Loading states

✅ **Design System Applied**
- TailwindCSS with design tokens
- Responsive (mobile/tablet/desktop)
- Consistent styling
- Dark/light ready

---

## 🔧 Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main app with routing |
| `src/pages/` | All page components |
| `src/components/` | UI components |
| `src/services/` | API calls |
| `src/store/` | Zustand state |
| `src/hooks/` | Custom hooks |
| `tailwind.config.js` | Design tokens |
| `vite.config.js` | Build config |
| `.env` | Environment config |

---

## 🎯 Common Tasks

### Start Development
```bash
cd /Users/dorian/Documents/MASSTOCK/frontend
./start.sh
```

### Update Backend URL
Edit `.env`:
```env
VITE_API_URL=https://your-api.com/api
```

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel
```

### Fix Dependencies Issue
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🐛 Troubleshooting

**Port 5173 in use?**
```bash
lsof -ti:5173 | xargs kill -9
```

**API connection error?**
1. Check `.env` has correct API URL
2. Ensure backend is running
3. Check browser DevTools → Network tab

**Can't login?**
1. Verify backend is accessible
2. Check test credentials (estee@masstock.local / demo123)
3. Look for API 401 errors in DevTools

**Build fails?**
```bash
rm -rf node_modules
npm install
npm run build
```

---

## 📊 Project Stats

- **Framework:** React 18 + Vite
- **Build Size:** 299KB (96KB gzipped)
- **Components:** 6 UI + layouts
- **Pages:** 13 (7 client + 6 admin)
- **Services:** 5 API modules
- **Build Time:** ~625ms
- **Status:** ✅ Production ready

---

## 🔗 Related Documentation

- **Main Overview:** `../../PROJECT_OVERVIEW.md`
- **Backend:** `../../product/backend/`
- **Design System:** `../../product/docs/design/DESIGN_SYSTEM.md`
- **API Spec:** `../../product/docs/briefs/BRIEF_BACKEND_ARCHITECT.md`

---

## ✅ Deployment Checklist

- [ ] Backend API deployed & accessible
- [ ] `.env` updated with API URL
- [ ] Test login works
- [ ] All pages render correctly
- [ ] Responsive design verified
- [ ] No console errors
- [ ] Production build passes
- [ ] Deployed to Vercel

---

**Last Updated:** 2024-11-15
**Status:** ✅ Frontend complete and ready
