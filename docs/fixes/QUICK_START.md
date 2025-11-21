# Quick Start - Test de la correction

## 1. Lancer l'application (1 minute)

```bash
# Terminal 1: Backend
cd /Users/dorian/Documents/MASSTOCK/backend
npm run dev

# Terminal 2: Frontend
cd /Users/dorian/Documents/MASSTOCK/frontend
npm run dev
```

Attendez de voir:
```
✓ Backend: Server running on port 3000
✓ Frontend: Local: http://localhost:5173
```

## 2. Test de la correction (30 secondes)

### Étape 1: Login
1. Ouvrir http://localhost:5173
2. Se connecter avec vos identifiants

### Étape 2: Vérifier cookies
1. Ouvrir DevTools (F12)
2. Onglet **Application** > **Cookies**
3. Voir: `access_token` et `refresh_token` avec `HttpOnly`

### Étape 3: Test du refresh
1. Appuyer sur **F5**
2. **SUCCÈS:** Vous restez connecté sur le dashboard

## 3. Vérification visuelle

### Avant la correction
```
Login → Dashboard → F5 → ❌ Redirected to /login
```

### Après la correction
```
Login → Dashboard → F5 → ✅ Still on /dashboard
```

## 4. Test avec le script (optionnel)

```bash
cd /Users/dorian/Documents/MASSTOCK
chmod +x test-auth-persistence.sh
./test-auth-persistence.sh
```

## 5. Comprendre ce qui s'est passé

### Le problème
Au refresh de page, le state Zustand était réinitialisé mais les cookies restaient.
**Résultat:** L'app ne vérifiait pas si l'utilisateur était encore authentifié.

### La solution
Ajout d'un `useEffect()` dans `App.jsx` qui appelle `initAuth()` au démarrage.
**Résultat:** L'app vérifie maintenant l'authentification à chaque chargement.

### Le code (simplifié)

**Avant:**
```jsx
function App() {
  const { isAuthenticated } = useAuth()
  return <Router>...</Router>
}
```

**Après:**
```jsx
function App() {
  const { isAuthenticated, loading } = useAuth()
  const initAuth = useAuthStore((state) => state.initAuth)
  
  useEffect(() => {
    initAuth() // ← Vérifie l'authentification
  }, [])
  
  if (loading) return <Loading />
  return <Router>...</Router>
}
```

## 6. Documentation complète

Pour plus de détails, consultez:

| Fichier | Description | Lecture |
|---------|-------------|---------|
| `README_AUTH_FIX.md` | Vue d'ensemble | 2 min |
| `CORRECTIONS_APPLIQUEES.md` | Changements appliqués | 5 min |
| `CODE_CHANGES.md` | Diff détaillé | 10 min |
| `SOLUTION_SUMMARY.md` | Analyse technique | 15 min |
| `AUTHENTICATION_FIX.md` | Doc complète | 30 min |
| `GUIDE_TEST_AUTH.md` | Guide de test | 10 min |

## 7. Troubleshooting rapide

### Problème: Backend ne démarre pas
```bash
# Vérifier si le port 3000 est libre
lsof -i :3000

# Si occupé, tuer le processus
kill -9 <PID>
```

### Problème: Frontend ne démarre pas
```bash
# Vérifier si le port 5173 est libre
lsof -i :5173

# Nettoyer le cache
cd frontend
rm -rf node_modules/.vite
npm run dev
```

### Problème: Toujours déconnecté après F5
```bash
# Vérifier les variables d'environnement
cat frontend/.env
# Doit contenir: VITE_API_URL=http://localhost:3000/api/v1

cat backend/.env
# Doit contenir: CORS_ORIGIN=http://localhost:5173
```

### Problème: Erreur CORS
```bash
# Vérifier que withCredentials est true
grep -r "withCredentials" frontend/src/services/api.js

# Vérifier que credentials est true dans CORS
grep -r "credentials" backend/src/server.js
```

## 8. Résumé en une ligne

**Avant:** État perdu au refresh → Déconnexion
**Après:** État restauré via cookie → Connexion maintenue

---

**Correction appliquée:** 2025-11-18
**Fichiers modifiés:** 2 (`App.jsx`, `authStore.js`)
**Temps de test:** 30 secondes
**Impact:** Critique (UX vastly improved)

Pour revenir à ce guide plus tard:
```bash
cat /Users/dorian/Documents/MASSTOCK/QUICK_START.md
```
