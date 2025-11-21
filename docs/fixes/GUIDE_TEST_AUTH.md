# Guide de test: Vérification de la correction

## Test rapide (2 minutes)

### Étape 1: Démarrer l'application

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Étape 2: Tester le login

1. Ouvrir http://localhost:5173
2. Se connecter avec vos identifiants
3. Vérifier que vous êtes redirigé vers le dashboard

### Étape 3: Vérifier les cookies

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet **Application** (Chrome) ou **Storage** (Firefox)
3. Dans la section **Cookies**, sélectionner `http://localhost:5173`
4. Vous devez voir:
   ```
   Name              Value                    HttpOnly  SameSite
   access_token      eyJh...                  ✓         Lax
   refresh_token     eyJh...                  ✓         Lax
   ```

### Étape 4: Tester le refresh

1. **Appuyer sur F5** (ou Cmd+R / Ctrl+R)
2. **SUCCÈS:** Vous devez rester connecté sur le dashboard
3. **ÉCHEC:** Si vous êtes redirigé vers /login, il y a un problème

### Étape 5: Vérifier la console

Ouvrir la console DevTools et vérifier:

```
✓ Aucune erreur 401 ou 403
✓ Requête GET /api/v1/auth/me réussie
✓ Pas d'erreur CORS
```

## Test détaillé avec curl

Si vous voulez tester l'API directement:

```bash
# Exécuter le script de test
./test-auth-persistence.sh

# Ou tester manuellement:

# 1. Login
curl -i -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre@email.com","password":"votrepassword"}' \
  -c cookies.txt

# 2. Vérifier avec cookies
curl -X GET http://localhost:3000/api/v1/auth/me \
  -b cookies.txt

# 3. Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -b cookies.txt
```

## Scénarios de test

### Scénario 1: Login puis refresh (PRINCIPAL)

```
1. Aller sur /login
2. Se connecter
3. Vérifier qu'on est sur /dashboard
4. F5
5. ✓ Toujours sur /dashboard (connecté)
```

### Scénario 2: Fermer onglet puis rouvrir

```
1. Se connecter
2. Fermer l'onglet
3. Rouvrir http://localhost:5173
4. ✓ Toujours connecté (dans les 15min)
```

### Scénario 3: Logout puis refresh

```
1. Se connecter
2. Cliquer sur "Déconnexion"
3. Vérifier qu'on est sur /login
4. F5
5. ✓ Toujours sur /login (déconnecté)
```

### Scénario 4: Token expiré

```
1. Se connecter
2. Attendre 15 minutes (expiration access_token)
3. F5 ou faire une action
4. ✓ Déconnecté automatiquement
```

## Que vérifier dans DevTools

### Network

```
Request: GET /api/v1/auth/me
Status: 200 OK
Request Headers:
  Cookie: access_token=...; refresh_token=...
Response:
  {
    "user": {
      "id": "...",
      "email": "...",
      "role": "..."
    }
  }
```

### Application > Cookies

```
✓ access_token présent
✓ refresh_token présent
✓ HttpOnly coché
✓ SameSite = Lax
✓ Secure = true (en production seulement)
```

### Console

```
✓ Pas d'erreur "Unauthorized"
✓ Pas d'erreur "CORS"
✓ Pas d'erreur "Failed to fetch"
```

## Problèmes possibles

### 1. Toujours déconnecté après refresh

**Cause possible:** Backend non démarré ou mauvaise URL

**Solution:**
```bash
# Vérifier que le backend tourne
curl http://localhost:3000/health

# Vérifier la config frontend
cat frontend/.env
# VITE_API_URL doit être: http://localhost:3000/api/v1
```

### 2. Erreur CORS

**Cause:** CORS_ORIGIN mal configuré

**Solution:**
```bash
# backend/.env
CORS_ORIGIN=http://localhost:5173
```

### 3. Cookies non définis

**Cause:** withCredentials manquant ou CORS

**Solution:** Vérifier dans frontend/src/services/api.js:
```js
withCredentials: true, // Doit être présent
```

### 4. Erreur 401 sur /auth/me

**Cause:** Token invalide ou expiré

**Solution:** Se déconnecter et se reconnecter

## Logs utiles

### Backend

```bash
cd backend
npm run dev

# Vous devriez voir:
# POST /api/v1/auth/login → 200
# GET /api/v1/auth/me → 200
# POST /api/v1/auth/logout → 200
```

### Frontend

Dans la console DevTools, vous pouvez ajouter des logs:

```js
// Dans authStore.js, dans initAuth()
console.log('🔄 Initializing auth...')
// Après succès
console.log('✅ Auth initialized:', user)
// Après échec
console.log('❌ Auth failed:', error)
```

## Validation finale

Avant de considérer le test réussi, vérifier:

- [ ] Login fonctionne
- [ ] Cookies httpOnly définis
- [ ] Refresh conserve l'authentification
- [ ] Logout efface les cookies
- [ ] Pas d'erreurs dans la console
- [ ] Pas d'erreurs 401 ou CORS

## Support

Si le problème persiste:

1. Vérifier les logs backend
2. Vérifier la console frontend
3. Vérifier les cookies dans DevTools
4. Lire `/AUTHENTICATION_FIX.md` pour la documentation complète
5. Lire `/SOLUTION_SUMMARY.md` pour le détail de la solution

---

**Documentation:** `/AUTHENTICATION_FIX.md` | `/SOLUTION_SUMMARY.md`
**Script de test:** `/test-auth-persistence.sh`
