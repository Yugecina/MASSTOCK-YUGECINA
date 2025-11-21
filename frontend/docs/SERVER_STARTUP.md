# MasStock Frontend - Server Startup Guide

## 🚀 Quick Start

### macOS/Linux
```bash
cd /Users/dorian/Documents/MASSTOCK/frontend
./start.sh
```

### Windows
```cmd
cd \Users\dorian\Documents\MASSTOCK\frontend
start.bat
```

### Manual (Any OS)
```bash
cd /Users/dorian/Documents/MASSTOCK/frontend
npm install      # Only needed once
npm run dev
```

---

## 📝 What the Scripts Do

Both `start.sh` (macOS/Linux) and `start.bat` (Windows) automatically:

1. ✅ Check if dependencies are installed
2. ✅ Install npm packages if needed
3. ✅ Create `.env` file from template if missing
4. ✅ Show current configuration
5. ✅ Start the development server on port 5173

---

## 🌐 Access the App

Once the server starts, open your browser:

**URL:** `http://localhost:5173`

**Test Account:**
- Email: `estee@masstock.local`
- Password: `demo123`

---

## ⚙️ Configuration

### Update API URL

Edit `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3000/api    # For local backend
# or
VITE_API_URL=https://your-api-url.com/api # For remote backend
VITE_ENV=development
```

### Important
- The API URL must match your backend server
- Backend must be running before you can login
- Check that CORS is enabled on backend

---

## 🔧 Troubleshooting

### "Port 5173 already in use"
```bash
# Kill the process using port 5173
# macOS/Linux:
lsof -ti:5173 | xargs kill -9

# Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### "Cannot find module" errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Cannot connect to API"
1. Check `.env` has correct API URL
2. Verify backend is running
3. Check CORS configuration on backend
4. Look at Network tab in DevTools

### "npm: command not found"
- Install Node.js from https://nodejs.org
- Restart terminal
- Run `node --version` to verify

---

## 🛑 Stop the Server

Press `Ctrl+C` in the terminal

---

## 📦 Building for Production

```bash
npm run build
```

Output goes to `dist/` folder

### Preview Production Build
```bash
npm run preview
```

### Deploy
```bash
vercel      # Deploy to Vercel
# or manually upload dist/ to your server
```

---

## 📊 Development Server Info

- **Framework:** Vite (React 18)
- **Port:** 5173 (default)
- **Hot Module Reload:** ✅ Enabled
- **Auto-refresh:** ✅ On file save

### Network Tab Tips
- Watch for API calls to your backend
- Check response status (200, 401, 500, etc.)
- Look at request/response payloads
- Check headers for Authorization token

---

## 💡 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint  # (if configured)

# Format code
npm run format  # (if configured)
```

---

## 🔗 Useful Links

- **Frontend:** http://localhost:5173
- **DevTools Console:** F12 or Cmd+Option+I
- **Network Monitor:** DevTools → Network tab
- **Local Storage:** DevTools → Application → Local Storage

---

## 📋 Common Issues Checklist

- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] .env file exists with correct API_URL
- [ ] Backend API is running and accessible
- [ ] Port 5173 is not in use
- [ ] No firewall blocking localhost:5173
- [ ] Browser cache cleared (Ctrl+Shift+Delete)

---

## 🎯 Next Steps

1. Run `./start.sh` or `start.bat`
2. Open http://localhost:5173
3. Login with test credentials
4. Verify dashboard loads
5. Check browser console for errors
6. Test API connectivity

---

## 📞 Support

If issues occur:
1. Check the error message in console (F12)
2. Check network requests in DevTools
3. Verify .env configuration
4. Verify backend is running
5. Review INTEGRATION_CHECKLIST.md

---

**Status:** ✅ Ready to start!
