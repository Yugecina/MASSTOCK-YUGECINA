# Guide: Admin User Creation & Auth Sync Fix

## DIAGNOSTIC: Problème "User not found" au login

### Cause du problème
Lorsqu'un utilisateur est créé directement dans Supabase Dashboard, il est créé uniquement dans `auth.users` (table système de Supabase Auth).

Le trigger PostgreSQL (`on_auth_user_created`) était censé synchroniser automatiquement vers `public.users`, mais:
- Soit le trigger n'a pas été exécuté dans Supabase
- Soit il n'a pas les permissions nécessaires
- Soit il y a eu une erreur silencieuse

### Solution implémentée
Nous avons créé 2 nouveaux endpoints qui insèrent **MANUELLEMENT** dans les deux tables (`auth.users` + `public.users`), éliminant la dépendance au trigger.

---

## NOUVEAUX ENDPOINTS

### 1. POST /api/v1/admin/create-admin
**Objectif:** Créer le premier admin du système (bootstrap)

**Protection:**
- Aucune authentification requise
- Ne fonctionne que si aucun admin n'existe déjà (sécurité)

**URL:** `http://localhost:3000/api/v1/admin/create-admin`

**Body (JSON):**
```json
{
  "email": "admin@masstock.com",
  "password": "AdminPassword123!",
  "name": "Admin MasStock"
}
```

**Exemple cURL:**
```bash
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }'
```

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "id": "uuid-here",
    "email": "admin@masstock.com",
    "role": "admin",
    "status": "active",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

**Erreurs possibles:**
- `403 ADMIN_EXISTS`: Un admin existe déjà
- `400 USER_EXISTS`: Email déjà utilisé
- `400 WEAK_PASSWORD`: Mot de passe < 8 caractères

---

### 2. POST /api/v1/admin/users
**Objectif:** Créer un nouvel utilisateur (user ou admin) via l'interface admin

**Protection:**
- Authentification requise (admin token)
- Rôle admin requis

**URL:** `http://localhost:3000/api/v1/admin/users`

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Body (JSON) - Exemple 1: Créer un user client:**
```json
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!",
  "company_name": "Estee Agency",
  "name": "Estee Manager",
  "plan": "premium_custom",
  "subscription_amount": 2500,
  "role": "user"
}
```

**Body (JSON) - Exemple 2: Créer un autre admin:**
```json
{
  "email": "secondadmin@masstock.com",
  "password": "SecondAdmin123!",
  "name": "Second Admin",
  "role": "admin"
}
```

**Exemple cURL:**
```bash
# D'abord, login en tant qu'admin pour obtenir le token
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!"
  }')

# Extraire le token (avec jq)
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')

# Créer un nouvel user
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!",
    "company_name": "Estee Agency",
    "name": "Estee Manager",
    "plan": "premium_custom",
    "subscription_amount": 2500,
    "role": "user"
  }'
```

**Réponse Success (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "estee@masstock.com",
      "role": "user",
      "status": "active"
    },
    "client": {
      "id": "uuid-here",
      "name": "Estee Agency",
      "company_name": "Estee Agency",
      "plan": "premium_custom",
      "status": "active",
      "subscription_amount": 2500
    },
    "credentials": {
      "email": "estee@masstock.com",
      "password": "EsteePassword123!",
      "note": "Share these credentials with the user. They can change the password after first login."
    }
  }
}
```

**Erreurs possibles:**
- `401 UNAUTHORIZED`: Token manquant ou invalide
- `403 FORBIDDEN`: Pas de rôle admin
- `400 USER_EXISTS`: Email déjà utilisé
- `400 WEAK_PASSWORD`: Mot de passe < 8 caractères
- `400 INVALID_ROLE`: Role doit être "user" ou "admin"

---

## WORKFLOW COMPLET: Bootstrap Initial

### Étape 1: Créer le premier admin
```bash
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!",
    "name": "Admin MasStock"
  }'
```

Copier le `access_token` retourné.

### Étape 2: Vérifier que l'admin peut se connecter
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@masstock.com",
    "password": "AdminPassword123!"
  }'
```

**RESULTAT ATTENDU:** Login réussi (pas d'erreur "User not found")

### Étape 3: Créer l'utilisateur Estee
```bash
# Login admin
ACCESS_TOKEN="<token_from_step_1_or_2>"

# Créer Estee
curl -X POST http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!",
    "company_name": "Estee Agency",
    "name": "Estee Manager",
    "plan": "premium_custom",
    "subscription_amount": 2500,
    "role": "user"
  }'
```

### Étape 4: Vérifier qu'Estee peut se connecter
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estee@masstock.com",
    "password": "EsteePassword123!"
  }'
```

**RESULTAT ATTENDU:** Login réussi avec les infos client

---

## POSTMAN COLLECTION

### Collection: MasStock Admin

**1. Create Admin (Bootstrap)**
```
POST http://localhost:3000/api/v1/admin/create-admin
Body (raw JSON):
{
  "email": "admin@masstock.com",
  "password": "AdminPassword123!",
  "name": "Admin MasStock"
}
```

**2. Admin Login**
```
POST http://localhost:3000/api/v1/auth/login
Body (raw JSON):
{
  "email": "admin@masstock.com",
  "password": "AdminPassword123!"
}

Tests script (pour sauvegarder le token):
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.environment.set("admin_token", jsonData.data.access_token);
});
```

**3. Create User (as Admin)**
```
POST http://localhost:3000/api/v1/admin/users
Headers:
  Authorization: Bearer {{admin_token}}
  Content-Type: application/json
Body (raw JSON):
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!",
  "company_name": "Estee Agency",
  "name": "Estee Manager",
  "plan": "premium_custom",
  "subscription_amount": 2500,
  "role": "user"
}
```

**4. User Login**
```
POST http://localhost:3000/api/v1/auth/login
Body (raw JSON):
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!"
}
```

---

## VÉRIFICATION EN BASE DE DONNÉES

### Vérifier que le trigger existe (optionnel)
Dans Supabase SQL Editor:
```sql
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND trigger_name LIKE 'on_auth%'
ORDER BY trigger_name;
```

### Vérifier la synchronisation manuelle
```sql
-- Vérifier qu'un user existe dans auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'admin@masstock.com';

-- Vérifier qu'il existe aussi dans public.users
SELECT id, email, role, status, created_at
FROM public.users
WHERE email = 'admin@masstock.com';

-- Les deux IDs doivent être identiques!
```

### Vérifier la création du client
```sql
SELECT c.id, c.name, c.company_name, c.plan, c.status, u.email
FROM clients c
JOIN users u ON u.id = c.user_id
WHERE u.email = 'estee@masstock.com';
```

---

## ARCHITECTURE: Comment ça fonctionne

### Avant (avec trigger - ne marchait pas)
```
1. Créer user dans Supabase Dashboard
   ↓
2. User créé dans auth.users
   ↓
3. Trigger PostgreSQL (on_auth_user_created) DEVRAIT s'exécuter
   ↓
4. PROBLÈME: Trigger ne s'exécute pas ou échoue
   ↓
5. public.users reste VIDE
   ↓
6. Login échoue avec "User not found"
```

### Maintenant (avec endpoints admin)
```
1. POST /api/v1/admin/create-admin ou /api/v1/admin/users
   ↓
2. Backend crée user dans auth.users (via Supabase Admin API)
   ↓
3. Backend insère MANUELLEMENT dans public.users (fonction syncAuthToDatabase)
   ↓
4. Backend crée client (si role = 'user')
   ↓
5. Tout est synchronisé immédiatement
   ↓
6. Login fonctionne parfaitement!
```

### Fonction helper: syncAuthToDatabase()
```javascript
async function syncAuthToDatabase(authUserId, email, role = 'user') {
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .upsert({
      id: authUserId,
      email: email,
      role: role,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (userError) {
    throw new ApiError(500, `Failed to sync user to database: ${userError.message}`, 'USER_SYNC_FAILED');
  }

  return userData;
}
```

Cette fonction GARANTIT que l'utilisateur existe dans `public.users` avec le même UUID que `auth.users`.

---

## SÉCURITÉ

### Endpoint create-admin
- **Pas d'auth requise** pour créer le PREMIER admin
- **Bloqué** si un admin existe déjà (protection)
- Idéal pour bootstrap initial

### Endpoint users
- **Auth requise** (Bearer token)
- **Role admin requis** (middleware requireAdmin)
- **Rate limiting** appliqué
- **Audit log** créé pour chaque création

### Rollback automatique
Si la création du client échoue, l'utilisateur est automatiquement supprimé:
```javascript
if (clientError) {
  // Rollback: delete the user we just created
  await supabaseAdmin.from('users').delete().eq('id', user.id);
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  throw new ApiError(500, 'Failed to create client', 'CLIENT_CREATION_FAILED');
}
```

---

## TROUBLESHOOTING

### Erreur: "Admin user already exists"
**Solution:** Un admin a déjà été créé. Utilisez l'endpoint `/api/v1/auth/login` pour vous connecter.

### Erreur: "User not found" au login
**Cause:** L'utilisateur existe dans `auth.users` mais pas dans `public.users`

**Solution:** Utiliser les nouveaux endpoints pour créer les users (pas le dashboard Supabase)

**Fix pour users existants:**
```sql
-- Synchroniser manuellement un user existant
INSERT INTO public.users (id, email, role, status, created_at, updated_at)
SELECT
  id,
  email,
  'user' as role,
  'active' as status,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'user@example.com'
ON CONFLICT (id) DO NOTHING;
```

### Erreur: "Invalid or expired token"
**Solution:** Le token admin a expiré. Re-login avec `/api/v1/auth/login`

---

## FILES MODIFIÉS

### /src/controllers/adminController.js
- Ajout de `syncAuthToDatabase()` helper function
- Ajout de `createAdminUser()` controller
- Ajout de `createUser()` controller
- Export des nouvelles fonctions

### /src/routes/adminRoutes.js
- Ajout de `POST /create-admin` (sans auth)
- Ajout de `POST /users` (avec auth admin)
- Validation des inputs avec express-validator

---

## NEXT STEPS

1. **Tester les endpoints** avec cURL ou Postman
2. **Créer l'admin initial** avec `/api/v1/admin/create-admin`
3. **Créer les users** via `/api/v1/admin/users`
4. **Vérifier que le login fonctionne** pour tous les users
5. **Documenter les credentials** des users créés (ils sont retournés dans la réponse)

---

## SUPPORT

Pour toute question ou problème:
1. Vérifier les logs du serveur backend
2. Vérifier la table `audit_logs` pour tracer les actions
3. Vérifier que les users existent dans les 2 tables (`auth.users` + `public.users`)
