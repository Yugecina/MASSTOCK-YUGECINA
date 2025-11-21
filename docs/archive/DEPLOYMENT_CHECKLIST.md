# MasStock Backend - Deployment Checklist

## PROBLÈME RÉSOLU: "User not found" au login

### Diagnostic
L'utilisateur rapportait l'erreur "User not found" lors de la tentative de connexion, même après avoir créé un utilisateur dans le Supabase Dashboard.

### Cause racine
Les utilisateurs créés via le Supabase Dashboard sont ajoutés uniquement à `auth.users` (table système de Supabase Auth). Le trigger PostgreSQL (`on_auth_user_created`) était censé synchroniser automatiquement vers `public.users`, mais:

1. Le trigger n'a peut-être pas été exécuté dans Supabase
2. Le trigger nécessite des permissions SUPERUSER qui ne sont pas disponibles
3. Le trigger peut échouer silencieusement

### Solution implémentée
Création de 2 nouveaux endpoints admin qui insèrent **MANUELLEMENT** dans les deux tables (`auth.users` + `public.users`), éliminant toute dépendance au trigger PostgreSQL.

---

## NOUVEAUX ENDPOINTS CRÉÉS

### 1. POST /api/v1/admin/create-admin
- **Objectif:** Bootstrap - créer le premier admin
- **Protection:** Aucune auth requise, mais bloqué si un admin existe
- **Fichier:** `/src/controllers/adminController.js` - fonction `createAdminUser()`
- **Route:** `/src/routes/adminRoutes.js`

### 2. POST /api/v1/admin/users
- **Objectif:** Créer des utilisateurs (user ou admin) via l'interface admin
- **Protection:** Auth requise + role admin
- **Fichier:** `/src/controllers/adminController.js` - fonction `createUser()`
- **Route:** `/src/routes/adminRoutes.js`

### 3. Helper Function: syncAuthToDatabase()
- **Objectif:** Synchroniser manuellement auth.users → public.users
- **Fichier:** `/src/controllers/adminController.js`
- **Utilisation:** Appelée par les 2 endpoints ci-dessus

---

## FICHIERS MODIFIÉS

### /src/controllers/adminController.js
- Ajout de `syncAuthToDatabase()` helper
- Ajout de `createAdminUser()` controller
- Ajout de `createUser()` controller
- Export des nouvelles fonctions dans module.exports

### /src/routes/adminRoutes.js
- Ajout route `POST /create-admin` (sans auth)
- Ajout route `POST /users` (avec auth + requireAdmin)
- Validation des inputs avec express-validator

---

## FICHIERS CRÉÉS

### Documentation
1. **ADMIN_USER_CREATION_GUIDE.md** - Guide complet d'utilisation
2. **API_EXAMPLES.md** - Exemples cURL et Postman
3. **DEPLOYMENT_CHECKLIST.md** - Ce fichier

### Scripts
4. **test-admin-endpoints.sh** - Script de test automatisé

### SQL
5. **database/migrations/005_fix_existing_users.sql** - Migration pour réparer les users existants

---

## CHECKLIST DE DÉPLOIEMENT

### 1. Pré-déploiement (Local)

- [ ] Vérifier que le serveur démarre sans erreur
  ```bash
  cd /Users/dorian/Documents/MASSTOCK/product/backend
  npm run dev
  ```

- [ ] Vérifier que le health check fonctionne
  ```bash
  curl http://localhost:3000/health
  # Attendu: {"success":true,"status":"healthy",...}
  ```

- [ ] Exécuter le script de test
  ```bash
  chmod +x test-admin-endpoints.sh
  ./test-admin-endpoints.sh
  ```

- [ ] Vérifier que tous les tests passent (voir output du script)

### 2. Vérification Base de Données (Supabase)

- [ ] Exécuter migration 004 (trigger) si pas déjà fait
  ```sql
  -- Copier le contenu de database/migrations/004_auth_sync_trigger.sql
  -- Exécuter dans Supabase SQL Editor
  ```

- [ ] Vérifier que le trigger existe
  ```sql
  SELECT trigger_name FROM information_schema.triggers
  WHERE trigger_schema = 'auth' AND event_object_table = 'users';
  ```

- [ ] (Optionnel) Réparer les users existants
  ```sql
  -- Copier le contenu de database/migrations/005_fix_existing_users.sql
  -- Exécuter dans Supabase SQL Editor
  ```

### 3. Test des Endpoints (Production)

- [ ] Test 1: Créer l'admin initial
  ```bash
  curl -X POST https://your-domain.com/api/v1/admin/create-admin \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@masstock.com",
      "password": "YOUR_SECURE_PASSWORD",
      "name": "Admin MasStock"
    }'
  ```

- [ ] Test 2: Login admin
  ```bash
  curl -X POST https://your-domain.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@masstock.com",
      "password": "YOUR_SECURE_PASSWORD"
    }'
  ```

- [ ] Test 3: Créer un user client (avec le token admin)
  ```bash
  curl -X POST https://your-domain.com/api/v1/admin/users \
    -H "Authorization: Bearer <ADMIN_TOKEN>" \
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

- [ ] Test 4: Login user (CRITIQUE - vérifie que l'auth sync fonctionne!)
  ```bash
  curl -X POST https://your-domain.com/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "estee@masstock.com",
      "password": "EsteePassword123!"
    }'
  ```

  **ATTENDU:** Login réussi (pas d'erreur "User not found")

### 4. Vérification Base de Données

- [ ] Vérifier la synchronisation dans Supabase SQL Editor
  ```sql
  -- Vérifier qu'admin existe dans les 2 tables
  SELECT 'auth.users' as source, id, email FROM auth.users WHERE email = 'admin@masstock.com'
  UNION ALL
  SELECT 'public.users' as source, id, email FROM public.users WHERE email = 'admin@masstock.com';

  -- Les 2 lignes doivent avoir le même UUID!
  ```

- [ ] Vérifier que le client a été créé
  ```sql
  SELECT c.id, c.name, c.email, c.plan, u.email as user_email
  FROM clients c
  JOIN users u ON u.id = c.user_id
  WHERE u.email = 'estee@masstock.com';
  ```

### 5. Sécurité

- [ ] Changer le mot de passe admin par défaut
- [ ] Vérifier que le endpoint /create-admin est bloqué après création du premier admin
- [ ] Vérifier que le endpoint /users requiert bien l'auth admin
- [ ] Vérifier que le rate limiting est actif
- [ ] Vérifier que les audit logs sont créés

### 6. Monitoring

- [ ] Configurer les alertes pour erreurs 500
- [ ] Monitorer les logs pour "User not found" (ne devrait plus apparaître!)
- [ ] Monitorer les créations de users dans audit_logs
- [ ] Créer un dashboard pour visualiser les métriques d'auth

---

## ROLLBACK PLAN

Si le déploiement échoue:

### 1. Rollback Code
```bash
git revert HEAD
git push
```

### 2. Rollback Base de Données
```sql
-- Supprimer les users créés par les nouveaux endpoints
DELETE FROM public.clients WHERE user_id IN (
  SELECT id FROM public.users WHERE email IN ('admin@masstock.com', 'estee@masstock.com')
);

DELETE FROM public.users WHERE email IN ('admin@masstock.com', 'estee@masstock.com');

-- NE PAS supprimer de auth.users (Supabase Auth gère ça)
```

### 3. Restaurer l'ancien comportement
Utiliser l'ancien endpoint `POST /api/v1/auth/register` si disponible.

---

## VARIABLES D'ENVIRONNEMENT REQUISES

Vérifier que ces variables sont configurées:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server
PORT=3000
NODE_ENV=production
API_VERSION=v1

# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Redis (optionnel, pour rate limiting)
REDIS_URL=redis://localhost:6379
```

---

## MÉTRIQUES DE SUCCÈS

Le déploiement est réussi si:

- [ ] L'admin peut être créé via POST /admin/create-admin
- [ ] L'admin peut se connecter sans erreur "User not found"
- [ ] L'admin peut créer un user via POST /admin/users
- [ ] Le user créé peut se connecter sans erreur "User not found"
- [ ] Le user a un client associé dans la DB
- [ ] Les 2 tables (auth.users et public.users) sont synchronisées
- [ ] Les audit logs sont créés pour chaque action
- [ ] Aucune erreur 500 dans les logs

---

## TESTS DE NON-RÉGRESSION

Vérifier que les anciennes fonctionnalités marchent toujours:

- [ ] GET /api/v1/admin/clients (liste des clients)
- [ ] GET /api/v1/admin/dashboard (dashboard admin)
- [ ] GET /api/v1/auth/me (profile user)
- [ ] POST /api/v1/auth/refresh (refresh token)
- [ ] POST /api/v1/auth/logout (logout)

---

## PROCHAINES ÉTAPES (Post-déploiement)

1. **Documentation frontend:**
   - Mettre à jour le frontend pour utiliser les nouveaux endpoints
   - Créer une interface admin pour créer des users
   - Afficher les credentials générés après création

2. **Amélioration de sécurité:**
   - Ajouter un système de reset password
   - Implémenter MFA (Multi-Factor Auth)
   - Ajouter rate limiting plus strict sur create-admin

3. **Fonctionnalités:**
   - Endpoint pour resend password reset email
   - Endpoint pour désactiver/réactiver un user
   - Endpoint pour changer le plan d'un client

4. **Monitoring:**
   - Dashboard pour visualiser les users créés
   - Alertes en cas de tentative de création d'admin multiple
   - Logs structurés pour faciliter le debug

---

## CONTACTS ET SUPPORT

**Développeur Backend:** MasStock Team
**Documentation:** Voir ADMIN_USER_CREATION_GUIDE.md et API_EXAMPLES.md
**Logs:** Vérifier dans les logs du serveur ou table audit_logs

---

## CHANGELOG

### Version 1.1.0 - 2025-11-14
**BREAKING CHANGES:** Aucun (backward compatible)

**Nouveautés:**
- Ajout endpoint POST /api/v1/admin/create-admin
- Ajout endpoint POST /api/v1/admin/users
- Ajout helper function syncAuthToDatabase()
- Ajout migration 005_fix_existing_users.sql

**Corrections:**
- FIX: Erreur "User not found" au login
- FIX: Synchronisation auth.users → public.users maintenant garantie

**Documentation:**
- Ajout ADMIN_USER_CREATION_GUIDE.md
- Ajout API_EXAMPLES.md
- Ajout test-admin-endpoints.sh
- Ajout DEPLOYMENT_CHECKLIST.md

---

## NOTES IMPORTANTES

1. **Ne jamais créer d'users via le Supabase Dashboard**
   Toujours utiliser les endpoints API pour garantir la sync.

2. **Le endpoint /create-admin est sécurisé**
   Il ne fonctionne que si aucun admin n'existe. Impossible de créer plusieurs admins par cette route.

3. **Les credentials sont retournés une seule fois**
   Lors de la création d'un user, les credentials (email + password) sont retournés dans la réponse. Il faut les sauvegarder car ils ne seront plus accessibles.

4. **Les triggers restent actifs**
   Même si nous utilisons une sync manuelle, les triggers PostgreSQL restent en place comme backup. Si un user est créé directement dans auth.users, le trigger devrait le synchroniser.

5. **Le rollback automatique est actif**
   Si la création du client échoue, l'user est automatiquement supprimé (rollback transactionnel).

---

## VALIDATION FINALE

Avant de marquer le déploiement comme réussi, exécuter cette checklist finale:

```bash
# 1. Health check
curl https://your-domain.com/health

# 2. Créer admin
curl -X POST https://your-domain.com/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@masstock.com","password":"SecurePass123!","name":"Admin"}'

# 3. Login admin
ADMIN_RESP=$(curl -s -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@masstock.com","password":"SecurePass123!"}')

ADMIN_TOKEN=$(echo "$ADMIN_RESP" | jq -r '.data.access_token')

# 4. Créer user
curl -X POST https://your-domain.com/api/v1/admin/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!","name":"Test","role":"user"}'

# 5. Login user (CRITICAL TEST)
curl -X POST https://your-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"TestPass123!"}'

# Si aucune erreur "User not found" → SUCCÈS! ✓
```

---

**STATUS:** Prêt pour déploiement
**DATE:** 2025-11-14
**VERSION:** 1.1.0
