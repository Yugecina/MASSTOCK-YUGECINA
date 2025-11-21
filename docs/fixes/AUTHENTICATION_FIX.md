# Correction du problème de déconnexion au refresh

## Problème identifié

Lorsqu'un utilisateur rafraîchissait la page, il était déconnecté alors que les cookies httpOnly étaient toujours présents et valides.

### Cause racine

La fonction `initAuth()` dans le store Zustand n'était **jamais appelée** au démarrage de l'application. Le state Zustand repartait donc à son état initial (`user: null`, `isAuthenticated: false`) à chaque refresh de page, même si les cookies httpOnly étaient toujours présents.

## Solution appliquée

### 1. Initialisation de l'authentification au démarrage

**Fichier modifié:** `/frontend/src/App.jsx`

```jsx
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { isAuthenticated, user, loading } = useAuth()
  const initAuth = useAuthStore((state) => state.initAuth)

  // Initialize authentication state on app startup
  useEffect(() => {
    initAuth()
  }, [])

  // Show loading indicator while checking authentication
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

### 2. Amélioration du store pour gérer l'état de chargement

**Fichier modifié:** `/frontend/src/store/authStore.js`

```js
export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // Start with loading true to prevent flicker
  error: null,

  // Initialize auth state from server
  initAuth: async () => {
    set({ loading: true })
    try {
      const response = await api.get('/auth/me')
      set({
        user: response.user,
        isAuthenticated: true,
        loading: false,
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      })
    }
  },
  // ... autres méthodes
}))
```

## Flux d'authentification corrigé

### Au démarrage de l'application

1. L'utilisateur ouvre/rafraîchit la page
2. `App.jsx` monte et appelle `initAuth()` dans un `useEffect`
3. `loading` est mis à `true` → affichage d'un spinner
4. `initAuth()` appelle `GET /api/v1/auth/me` avec les cookies httpOnly
5. Le backend vérifie le cookie `access_token`
6. Si valide → retourne les données utilisateur
7. Le store met à jour: `user`, `isAuthenticated: true`, `loading: false`
8. L'application affiche les routes protégées

### Au login

1. L'utilisateur soumet le formulaire de login
2. `POST /api/v1/auth/login` est appelé
3. Le backend définit les cookies httpOnly:
   - `access_token` (15 minutes)
   - `refresh_token` (7 jours)
4. Le store met à jour l'état
5. L'utilisateur est redirigé vers le dashboard

### Au logout

1. L'utilisateur clique sur "Déconnexion"
2. `POST /api/v1/auth/logout` est appelé
3. Le backend efface les cookies
4. Le store réinitialise l'état
5. L'utilisateur est redirigé vers `/login`

## Configuration backend déjà en place

### Cookies httpOnly (authController.js)

```js
const cookieOptions = {
  httpOnly: true, // Protège contre XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS uniquement en production
  sameSite: 'lax', // Protège contre CSRF
  maxAge: 15 * 60 * 1000 // 15 minutes
};

res.cookie('access_token', data.session.access_token, cookieOptions);
res.cookie('refresh_token', data.session.refresh_token, {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});
```

### Middleware d'authentification (auth.js)

```js
async function authenticate(req, res, next) {
  // Extract token from httpOnly cookie or fallback to Authorization header
  let token = req.cookies?.access_token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Missing or invalid authorization token',
      code: 'UNAUTHORIZED'
    });
  }

  // Verify token with Supabase
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  // ... suite
}
```

### Configuration CORS (server.js)

```js
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true // Permet l'envoi des cookies
}));

app.use(cookieParser()); // Parse les cookies
```

## Configuration frontend déjà en place

### Axios avec credentials (api.js)

```js
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true, // Enable sending cookies with requests
})
```

## Tests

### Tests automatisés

1. **Backend:** `/backend/src/__tests__/controllers/authController.refresh.test.js`
   - Vérifie que les cookies sont définis au login
   - Vérifie que l'authentification fonctionne avec les cookies
   - Vérifie que les cookies sont effacés au logout

2. **Frontend:** `/frontend/src/__tests__/App.init.test.jsx`
   - Vérifie que `initAuth()` est appelé au montage
   - Vérifie que l'état est restauré avec un cookie valide
   - Vérifie que l'authentification persiste après un refresh

### Test manuel

```bash
# Terminal 1: Démarrer le backend
cd backend
npm run dev

# Terminal 2: Démarrer le frontend
cd frontend
npm run dev

# Dans le navigateur:
# 1. Aller sur http://localhost:5173
# 2. Se connecter avec un compte valide
# 3. Vérifier que vous êtes redirigé vers le dashboard
# 4. Ouvrir les DevTools > Application > Cookies
#    - Vérifier la présence de "access_token" et "refresh_token"
#    - Vérifier que "HttpOnly" est coché
# 5. Rafraîchir la page (F5)
# 6. SUCCÈS: Vous devez rester connecté
```

## Améliorations futures possibles

1. **Refresh token automatique:**
   - Implémenter un système de refresh automatique quand l'access token expire
   - Utiliser un intercepteur axios pour détecter les 401 et tenter un refresh

2. **Persistance locale (optionnelle):**
   - Ajouter le middleware `persist` de Zustand pour sauvegarder l'email ou l'ID (pas le token)
   - Permet d'afficher rapidement l'UI sans attendre `/auth/me`

3. **Monitoring:**
   - Logger les tentatives de refresh échouées
   - Alerter si trop d'utilisateurs sont déconnectés après refresh

## Sécurité

La solution appliquée maintient tous les standards de sécurité:

- **Cookies httpOnly:** Les tokens ne sont pas accessibles via JavaScript
- **SameSite: lax:** Protection contre CSRF
- **Secure en production:** HTTPS uniquement en production
- **Validation côté serveur:** Chaque requête vérifie le token
- **Pas de token dans localStorage:** Évite les attaques XSS

## Références

- Store: `/frontend/src/store/authStore.js`
- App: `/frontend/src/App.jsx`
- Auth Controller: `/backend/src/controllers/authController.js`
- Auth Middleware: `/backend/src/middleware/auth.js`
- Auth Routes: `/backend/src/routes/authRoutes.js`
- API Config: `/frontend/src/services/api.js`
