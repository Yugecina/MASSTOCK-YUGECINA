# Architecture Technique MasStock

## Vue d'ensemble

MasStock est une application SaaS moderne suivant une architecture client-serveur découplée avec :

- **Frontend** : Application React SPA (Single Page Application)
- **Backend** : API RESTful Node.js/Express
- **Database** : Supabase (PostgreSQL) avec Row Level Security
- **Job Queue** : Bull + Redis pour les tâches asynchrones
- **Tests** : Approche TDD avec couverture ≥ 70%

```
┌─────────────┐         ┌──────────────┐        ┌───────────┐
│   Frontend  │  HTTP   │   Backend    │  SQL   │ Supabase  │
│ React + Vite│────────>│  Express API │───────>│PostgreSQL │
│  (Port 5173)│  API    │  (Port 3000) │        │    DB     │
└─────────────┘         └──────────────┘        └───────────┘
                               │                        ▲
                               │                        │
                               ▼                        │
                        ┌──────────────┐               │
                        │    Redis     │               │
                        │  Bull Queue  │───────────────┘
                        │   Workers    │    DB Queries
                        └──────────────┘
```

## Backend Architecture

### Structure en Couches

```
┌────────────────────────────────────────┐
│            HTTP Requests               │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│          Middleware Layer              │
│  • CORS, Helmet (Security)             │
│  • Rate Limiting                       │
│  • Authentication (JWT)                │
│  • Request Validation                  │
│  • Error Handling                      │
│  • Logging (Winston)                   │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│           Routes Layer                 │
│  /api/auth/*                           │
│  /api/admin/*                          │
│  /api/workflows/*                      │
│  /api/clients/*                        │
│  /api/support/*                        │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│         Controllers Layer              │
│  • authController                      │
│  • adminController                     │
│  • workflowsController                 │
│  • workflowRequestsController          │
│  • supportTicketsController            │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│          Data Access Layer             │
│  • Supabase Admin Client               │
│  • Database Queries                    │
│  • RLS Policies                        │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│      Async Processing Layer            │
│  • Bull Job Queues                     │
│  • Background Workers                  │
│  • Email, Notifications, etc.          │
└────────────────────────────────────────┘
```

### Composants Principaux

#### 1. Middleware (`src/middleware/`)

- **authMiddleware.js** : Authentification JWT et vérification des rôles
- **errorHandler.js** : Gestion centralisée des erreurs
- **rateLimiter.js** : Limitation du taux de requêtes
- **requestLogger.js** : Logging des requêtes HTTP

#### 2. Controllers (`src/controllers/`)

- **authController.js** : Login, logout, refresh token
- **adminController.js** : Gestion des utilisateurs et clients
- **workflowsController.js** : CRUD des workflows
- **workflowRequestsController.js** : Gestion des demandes de workflow
- **supportTicketsController.js** : Système de support

#### 3. Routes (`src/routes/`)

Définissent les endpoints API avec leurs middlewares :

```javascript
// Exemple
router.post('/login', authController.login);
router.get('/profile', requireAuth, authController.getProfile);
router.get('/admin/users', requireAuth, requireRole('admin'), adminController.getUsers);
```

#### 4. Configuration (`src/config/`)

- **database.js** : Client Supabase avec service role
- **redis.js** : Configuration Redis pour Bull
- **logger.js** : Configuration Winston pour les logs

#### 5. Workers (`src/workers/`)

- **workflow-worker.js** : Traite les workflows en arrière-plan

### Flux d'une Requête API

```
1. Client HTTP Request
   │
2. │── Security Middleware (CORS, Helmet)
   │── Rate Limiter
   │── Request Logger
   │
3. │── Route Matching
   │
4. │── Authentication Middleware (if required)
   │── Role Check Middleware (if required)
   │
5. │── Controller Handler
   │   ├─> Validation
   │   ├─> Business Logic
   │   └─> Database Query (Supabase)
   │
6. │── Response or Error
   │── Error Handler Middleware (if error)
   │── Response Logger
   │
7. HTTP Response
```

## Frontend Architecture

### Structure en Composants

```
┌────────────────────────────────────────┐
│          Router (React Router)         │
│  /login, /dashboard, /workflows, etc.  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│           Pages Layer                  │
│  • Login.jsx                           │
│  • Dashboard.jsx                       │
│  • WorkflowsList.jsx                   │
│  • Admin pages                         │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│        Components Layer                │
│  • Layout (Sidebar, Header)            │
│  • UI Components (Button, Card, etc.)  │
│  • Domain Components (Workflow, etc.)  │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│          State Management              │
│  • Zustand Stores                      │
│  • Local Component State (useState)    │
│  • Form State (React Hook Form)        │
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│          Services Layer                │
│  • API Calls (Axios)                   │
│  • Authentication Service              │
│  • Data Fetching Hooks                 │
└────────────────────────────────────────┘
```

### Composants Principaux

#### 1. Pages (`src/pages/`)

Composants de niveau route :
- Gèrent la logique de la page
- Orchestrent les composants
- Gèrent les effets de chargement et d'erreur

#### 2. Components (`src/components/`)

##### UI Components (`src/components/ui/`)
Composants réutilisables sans logique métier :
- Button, Card, Input, Modal, etc.
- Stylisés avec TailwindCSS
- Testés unitairement

##### Domain Components (`src/components/`)
Composants avec logique métier :
- WorkflowCard, ClientList, etc.
- Utilisent les stores Zustand
- Testés avec mocks

#### 3. Stores (`src/store/`)

Gestion d'état global avec Zustand :

```javascript
// Exemple : authStore.js
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

#### 4. Services (`src/services/`)

Communication avec l'API :

```javascript
// Exemple : api.js
export const api = {
  async getWorkflows() {
    const { data } = await axios.get('/api/workflows');
    return data;
  },
};
```

#### 5. Hooks (`src/hooks/`)

Logique réutilisable :
- useAuth() : Gestion de l'authentification
- useWorkflows() : Fetch et cache des workflows
- useForm() : Gestion des formulaires

### Flux de Données

```
User Interaction
   │
   ▼
Component Event Handler
   │
   ├─> Update Local State (useState)
   │
   ├─> Call Service (API)
   │   └─> Axios Request
   │       └─> Backend API
   │           └─> Response
   │
   ├─> Update Global State (Zustand)
   │
   └─> Re-render Components
```

## Base de Données

### Schéma Principal

```sql
users (gérés par Supabase Auth)
  ├── id (uuid, primary key)
  ├── email (unique)
  ├── role (enum: 'admin', 'user')
  └── created_at

clients
  ├── id (uuid, primary key)
  ├── name (text)
  ├── status (enum: 'active', 'inactive', 'pending')
  ├── user_id (uuid, FK -> users.id)
  └── created_at

workflows
  ├── id (uuid, primary key)
  ├── name (text)
  ├── description (text)
  ├── status (enum: 'active', 'inactive')
  ├── created_by (uuid, FK -> users.id)
  └── created_at

workflow_requests
  ├── id (uuid, primary key)
  ├── workflow_id (uuid, FK -> workflows.id)
  ├── client_id (uuid, FK -> clients.id)
  ├── status (enum: 'pending', 'processing', 'completed', 'failed')
  ├── input_data (jsonb)
  ├── output_data (jsonb)
  └── created_at

support_tickets
  ├── id (uuid, primary key)
  ├── client_id (uuid, FK -> clients.id)
  ├── subject (text)
  ├── status (enum: 'open', 'in_progress', 'resolved', 'closed')
  └── created_at
```

### Row Level Security (RLS)

Toutes les tables utilisent RLS pour la sécurité :

```sql
-- Exemple : Les utilisateurs ne voient que leurs propres clients
CREATE POLICY "Users see own clients" ON clients
  FOR SELECT
  USING (user_id = auth.uid());

-- Les admins voient tout
CREATE POLICY "Admins see all" ON clients
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');
```

## Authentification & Sécurité

### Flux d'Authentification

```
1. User submits email + password
   │
2. │── Backend validates credentials (Supabase Auth)
   │
3. │── Generate JWT token
   │   ├─> access_token (expire: 1h)
   │   └─> refresh_token (expire: 30d)
   │
4. │── Return tokens + user info to frontend
   │
5. Frontend stores tokens
   │   ├─> localStorage (tokens)
   │   └─> Zustand store (user info)
   │
6. Subsequent requests include token in header
   │   Authorization: Bearer <access_token>
   │
7. Backend verifies token on each request
   │   ├─> Valid → Process request
   │   └─> Invalid/Expired → Return 401
```

### Middleware de Sécurité

1. **CORS** : Configure les origines autorisées
2. **Helmet** : Sécurise les headers HTTP
3. **Rate Limiting** : Limite les requêtes par IP
4. **JWT Verification** : Vérifie les tokens
5. **Role-Based Access Control** : Vérifie les permissions

## Job Queue & Workers

### Architecture Bull + Redis

```
API Request (e.g., create workflow_request)
   │
   ├─> Save to database
   │
   └─> Add job to Bull queue
       │
       Redis Queue
       │
       ├─> workflow-worker.js (listening)
       │   ├─> Process workflow
       │   ├─> Update database
       │   └─> Send notifications
       │
       └─> Job completed/failed
```

### Cas d'Usage

- Traitement de workflows longs
- Envoi d'emails en masse
- Génération de rapports
- Synchronisation de données

## Testing Architecture

### Pyramide de Tests

```
     ╱╲
    ╱E2E╲              Quelques tests (scripts shell)
   ╱──────╲
  ╱Integ. ╲            Tests d'intégration (API complète)
 ╱──────────╲
╱  Unit Tests╲         Nombreux tests (Jest/Vitest)
──────────────
```

### Types de Tests

#### 1. Tests Unitaires (Base)
- **Backend** : Controllers, middleware, utils (Jest)
- **Frontend** : Components, hooks, utils (Vitest)
- **Couverture** : ≥ 70%

#### 2. Tests d'Intégration (Milieu)
- Tests API complète avec database
- Tests de workflows end-to-end
- Localisés dans `tests/integration/`

#### 3. Tests E2E (Sommet)
- Scripts shell testant les flux complets
- Collections Postman
- Localisés dans `tests/e2e/` et `tests/postman/`

## Déploiement

### Backend (Render/Railway)

```
┌────────────────┐
│  Git Repository│
└───────┬────────┘
        │
        │ git push
        ▼
┌────────────────┐
│  CI/CD Build   │
│  • npm install │
│  • npm test    │
└───────┬────────┘
        │
        │ deploy
        ▼
┌────────────────┐      ┌─────────────┐
│  Production    │──────│  Supabase   │
│  Node.js Server│      │  Database   │
└────────────────┘      └─────────────┘
        │
        │
        ▼
┌────────────────┐
│  Redis Cloud   │
│  (Bull Queue)  │
└────────────────┘
```

### Frontend (Vercel)

```
┌────────────────┐
│  Git Repository│
└───────┬────────┘
        │
        │ git push
        ▼
┌────────────────┐
│  Vercel Build  │
│  • npm install │
│  • npm test    │
│  • vite build  │
└───────┬────────┘
        │
        │ deploy
        ▼
┌────────────────┐
│   Vercel CDN   │
│  Static Files  │
└────────────────┘
```

## Performance & Scalabilité

### Backend
- **Rate Limiting** : 100 req/15min par IP
- **Caching** : Redis pour sessions et données fréquentes
- **Job Queue** : Bull pour traitement asynchrone
- **Database Indexes** : Sur les colonnes fréquemment requêtées

### Frontend
- **Code Splitting** : Lazy loading des routes
- **Memoization** : useMemo, useCallback pour optimisation
- **Virtual Scrolling** : Pour les longues listes
- **Image Optimization** : WebP, lazy loading

## Monitoring & Logging

### Backend (Winston)
```javascript
logger.info('User logged in', { userId, timestamp });
logger.error('Database error', { error, query });
```

### Frontend (Console + Sentry potentiel)
```javascript
console.error('API call failed', { endpoint, error });
```

## Bonnes Pratiques

1. **TDD First** : Toujours écrire les tests avant le code
2. **Single Responsibility** : Une fonction = une responsabilité
3. **DRY** : Don't Repeat Yourself
4. **Consistent Naming** : Conventions claires
5. **Error Handling** : Gestion d'erreurs robuste
6. **Documentation** : Code auto-documenté + commentaires si nécessaire
7. **Security First** : Validation, sanitization, RLS
8. **Performance** : Optimiser après mesure, pas avant

## Ressources

- [Backend README](../backend/README.md)
- [Frontend README](../frontend/README.md)
- [TDD Workflow](./testing/TDD_WORKFLOW.md)
- [Testing Guide](./testing/TESTING_GUIDE.md)
