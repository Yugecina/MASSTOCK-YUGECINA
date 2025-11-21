# Correction: Déconnexion au refresh de page

## Résumé en 30 secondes

**Problème:** Utilisateur déconnecté après F5
**Cause:** `initAuth()` jamais appelé au démarrage
**Solution:** Ajout d'un `useEffect()` dans App.jsx qui appelle `initAuth()`
**Résultat:** ✅ L'authentification persiste après refresh

## Fichiers modifiés

1. `/frontend/src/App.jsx` - Ajout de useEffect pour appeler initAuth()
2. `/frontend/src/store/authStore.js` - Gestion du loading dans initAuth()

## Test rapide

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Navigateur:
# 1. http://localhost:5173
# 2. Se connecter
# 3. F5
# 4. ✅ Toujours connecté
```

## Documentation

| Fichier | Description |
|---------|-------------|
| `CORRECTIONS_APPLIQUEES.md` | ⭐ **COMMENCER ICI** - Vue d'ensemble des changements |
| `SOLUTION_SUMMARY.md` | Analyse technique détaillée du problème et de la solution |
| `AUTHENTICATION_FIX.md` | Documentation complète du flux d'authentification |
| `GUIDE_TEST_AUTH.md` | Guide de test pour l'utilisateur |
| `test-auth-persistence.sh` | Script de test automatisé avec curl |

## Qu'est-ce qui a changé?

### Avant

```jsx
// App.jsx
export default function App() {
  const { isAuthenticated, user } = useAuth()
  // initAuth() jamais appelé ❌
  
  return <Router>...</Router>
}
```

Au refresh: État Zustand réinitialisé → Déconnexion

### Après

```jsx
// App.jsx
export default function App() {
  const { isAuthenticated, user, loading } = useAuth()
  const initAuth = useAuthStore((state) => state.initAuth)
  
  // ✅ Appel de initAuth au montage
  useEffect(() => {
    initAuth()
  }, [])
  
  if (loading) return <LoadingScreen />
  
  return <Router>...</Router>
}
```

Au refresh: initAuth() vérifie le cookie → Reste connecté

## Architecture

```
User → Browser
         │
         ├─ Cookies (HttpOnly)
         │   ├─ access_token (15min)
         │   └─ refresh_token (7 jours)
         │
         ├─ React App
         │   ├─ App.jsx → useEffect(() => initAuth())
         │   └─ authStore.js → initAuth() → GET /auth/me
         │
         └─ Backend
             ├─ Middleware auth → Lit cookie
             ├─ Vérifie avec Supabase
             └─ Retourne user
```

## Flux corrigé

```
Page load → App mount → useEffect
              ↓
         initAuth()
              ↓
      GET /auth/me (avec cookies)
              ↓
         Backend vérifie
              ↓
      ┌──────┴──────┐
      │             │
   Valid         Invalid
      │             │
   Set user    Clear state
      │             │
   Dashboard    Login page
```

## Sécurité

Tous les standards de sécurité sont maintenus:

- ✅ HttpOnly cookies (protection XSS)
- ✅ SameSite: Lax (protection CSRF)
- ✅ Secure en production (HTTPS)
- ✅ withCredentials: true (envoi automatique)
- ✅ Validation backend à chaque requête

## Checklist de test

- [ ] Login fonctionne
- [ ] Dashboard s'affiche
- [ ] Cookies visibles dans DevTools
- [ ] F5 conserve l'authentification
- [ ] Logout efface les cookies
- [ ] Pas d'erreurs dans la console

## Commandes utiles

```bash
# Test manuel avec curl
./test-auth-persistence.sh

# Vérifier santé backend
curl http://localhost:3000/health

# Vérifier cookies
curl -i http://localhost:3000/api/v1/auth/me

# Tests Jest backend
cd backend && npm test

# Tests Vitest frontend
cd frontend && npm test
```

## En cas de problème

1. Vérifier que le backend tourne sur :3000
2. Vérifier que le frontend tourne sur :5173
3. Vérifier les cookies dans DevTools
4. Vérifier la console pour erreurs CORS
5. Lire `GUIDE_TEST_AUTH.md` pour le troubleshooting

## Support

- **Documentation complète:** `AUTHENTICATION_FIX.md`
- **Analyse technique:** `SOLUTION_SUMMARY.md`
- **Changements appliqués:** `CORRECTIONS_APPLIQUEES.md`
- **Guide de test:** `GUIDE_TEST_AUTH.md`

---

**Correction appliquée le:** 2025-11-18
**Temps de correction:** ~30 minutes
**Complexité:** Simple (2 fichiers modifiés)
**Impact:** Critique (UX amélioré significativement)
