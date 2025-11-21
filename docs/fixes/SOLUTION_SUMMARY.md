# Solution: Problème de déconnexion au refresh de page

## Résumé Exécutif

Le problème était simple: **la fonction `initAuth()` n'était jamais appelée au démarrage de l'application**, ce qui causait la perte de l'état d'authentification à chaque refresh de page, même si les cookies httpOnly étaient toujours valides côté navigateur.

## Cause Racine

### Analyse du flux avant correction

1. Utilisateur se connecte → Login réussit
2. Backend définit cookies httpOnly (`access_token`, `refresh_token`)
3. State Zustand: `{ user: {...}, isAuthenticated: true }`
4. **Utilisateur refresh la page**
5. React recharge → State Zustand réinitialisé: `{ user: null, isAuthenticated: false }`
6. `initAuth()` existe mais **n'est jamais appelé**
7. Résultat: Utilisateur déconnecté alors que cookies valides

### Fichiers analysés

```
frontend/src/
├── store/authStore.js      ✓ initAuth() existe mais non utilisé
├── hooks/useAuth.js        ✓ Simple wrapper du store
├── App.jsx                 ✗ N'appelle pas initAuth()
├── main.jsx                ✗ N'appelle pas initAuth()
└── services/api.js         ✓ withCredentials: true (correct)

backend/src/
├── controllers/authController.js  ✓ Cookies httpOnly configurés
├── middleware/auth.js             ✓ Lit les cookies correctement
├── routes/authRoutes.js           ✓ GET /auth/me existe
└── server.js                      ✓ cookie-parser installé
```

## Solution Implémentée

### Modification 1: Appeler initAuth() au montage de l'app

**Fichier:** `/frontend/src/App.jsx`

```jsx
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { isAuthenticated, user, loading } = useAuth()
  const initAuth = useAuthStore((state) => state.initAuth)

  // ✅ Initialiser l'authentification au démarrage
  useEffect(() => {
    initAuth()
  }, [])

  // ✅ Afficher un loading pendant la vérification
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    // ... routes
  )
}
```

### Modification 2: Améliorer le store pour gérer le loading

**Fichier:** `/frontend/src/store/authStore.js`

```js
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // ✅ Commence à true pour éviter le clignotement
  error: null,

  initAuth: async () => {
    set({ loading: true })
    try {
      // ✅ Appelle /auth/me avec les cookies httpOnly
      const response = await api.get('/auth/me')
      set({
        user: response.user,
        isAuthenticated: true,
        loading: false, // ✅ Termine le loading après vérification
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        loading: false, // ✅ Termine le loading même en cas d'erreur
      })
    }
  },
  // ... autres méthodes
}))
```

## Flux d'authentification corrigé

### Démarrage de l'application

```
1. Page chargée
   ↓
2. App.jsx monte
   ↓
3. useEffect() appelle initAuth()
   ↓
4. State: { loading: true } → Affiche spinner
   ↓
5. Requête: GET /api/v1/auth/me
   Headers: Cookie: access_token=...; refresh_token=...
   ↓
6. Backend: Middleware auth.js
   - Extrait token du cookie (ligne 30)
   - Vérifie avec Supabase
   - Retourne user si valide
   ↓
7a. Si cookies valides:
    State: { user: {...}, isAuthenticated: true, loading: false }
    → Affiche Dashboard
    
7b. Si cookies invalides/expirés:
    State: { user: null, isAuthenticated: false, loading: false }
    → Redirige vers /login
```

### Login

```
1. Utilisateur soumet formulaire
   ↓
2. POST /api/v1/auth/login
   Body: { email, password }
   ↓
3. Backend authentifie avec Supabase
   ↓
4. Backend définit cookies:
   Set-Cookie: access_token=...; HttpOnly; SameSite=Lax; Max-Age=900
   Set-Cookie: refresh_token=...; HttpOnly; SameSite=Lax; Max-Age=604800
   ↓
5. Frontend met à jour state:
   { user: {...}, isAuthenticated: true }
   ↓
6. Redirection vers Dashboard
```

### Refresh de page

```
1. Utilisateur appuie sur F5
   ↓
2. React recharge
   ↓
3. Cookies TOUJOURS présents (HttpOnly, stockés par navigateur)
   ↓
4. App.jsx monte → useEffect() appelle initAuth()
   ↓
5. GET /auth/me avec cookies
   ↓
6. Backend valide token du cookie
   ↓
7. ✅ Utilisateur reste connecté
```

## Configuration backend déjà correcte

### Cookies httpOnly

```js
// backend/src/controllers/authController.js (lignes 52-63)
const cookieOptions = {
  httpOnly: true,      // ✅ Protège contre XSS
  secure: NODE_ENV === 'production', // ✅ HTTPS en production
  sameSite: 'lax',     // ✅ Protège contre CSRF
  maxAge: 15 * 60 * 1000 // 15 minutes
};

res.cookie('access_token', data.session.access_token, cookieOptions);
res.cookie('refresh_token', data.session.refresh_token, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});
```

### Middleware d'authentification

```js
// backend/src/middleware/auth.js (lignes 27-46)
async function authenticate(req, res, next) {
  // ✅ Extrait token du cookie d'abord
  let token = req.cookies?.access_token;

  // Fallback sur Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ ... });
  }

  // Vérifie avec Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  // ...
}
```

### CORS avec credentials

```js
// backend/src/server.js (lignes 16-19)
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true // ✅ Permet l'envoi des cookies
}));

app.use(cookieParser()); // ✅ Parse les cookies
```

## Configuration frontend déjà correcte

### Axios avec credentials

```js
// frontend/src/services/api.js (lignes 6-10)
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // ✅ Envoie les cookies
})
```

## Tests

### Test manuel (rapide)

```bash
# 1. Démarrer le backend
cd backend && npm run dev

# 2. Démarrer le frontend
cd frontend && npm run dev

# 3. Dans le navigateur (http://localhost:5173):
#    - Se connecter
#    - Ouvrir DevTools > Application > Cookies
#    - Vérifier access_token et refresh_token
#    - Appuyer sur F5
#    - ✅ Vous devez rester connecté
```

### Script de test automatisé

```bash
# Tester le flux complet avec curl
./test-auth-persistence.sh
```

## Fichiers modifiés

| Fichier | Lignes | Changement |
|---------|--------|------------|
| `frontend/src/App.jsx` | 1, 22, 26, 29-43 | Import useEffect, import authStore, appel initAuth(), affichage loading |
| `frontend/src/store/authStore.js` | 7, 12, 18, 24 | loading: true initial, set loading dans initAuth() |

## Améliorations futures

1. **Refresh token automatique**
   - Intercepteur axios pour détecter 401
   - Appeler endpoint `/auth/refresh` avec refresh_token
   - Retry la requête initiale

2. **Loading skeleton**
   - Remplacer le spinner par un skeleton du layout
   - Meilleure UX

3. **Persistence localStorage (optionnel)**
   - Sauvegarder l'ID ou l'email (pas le token)
   - Afficher rapidement le nom de l'utilisateur
   - Toujours vérifier avec `/auth/me`

## Sécurité

La solution maintient tous les standards de sécurité:

| Aspect | Statut | Détail |
|--------|--------|--------|
| httpOnly cookies | ✅ | Tokens inaccessibles via JavaScript |
| SameSite: lax | ✅ | Protection contre CSRF |
| Secure flag | ✅ | HTTPS en production |
| withCredentials | ✅ | Cookies envoyés automatiquement |
| Validation backend | ✅ | Chaque requête vérifie le token |
| Pas de localStorage | ✅ | Évite les attaques XSS |

## Conclusion

Le problème était une simple **omission d'appel de fonction** au démarrage de l'app. Toute l'infrastructure était déjà en place (cookies httpOnly, middleware, endpoints). Il suffisait d'appeler `initAuth()` dans un `useEffect()` au montage de `App.jsx`.

**Résultat:** Les utilisateurs restent maintenant connectés après un refresh de page.

---

**Documentation complète:** `/AUTHENTICATION_FIX.md`
**Script de test:** `/test-auth-persistence.sh`
**Tests intégration:** `/backend/src/__tests__/integration/auth-persistence.integration.test.js`
