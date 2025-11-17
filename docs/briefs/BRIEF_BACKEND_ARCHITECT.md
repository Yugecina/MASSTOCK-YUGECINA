# 📘 BRIEF #1 : BACKEND-ARCHITECT

```
═══════════════════════════════════════════════════════════════════
PROJECT: MasStock - SaaS Automation Workflows for Agencies
PHASE: Backend Architecture & API Development
AGENT: Backend-Architect
TIMELINE: 3-4 jours
═══════════════════════════════════════════════════════════════════

## 🎯 CONTEXTE DU PROJET

MasStock est un SaaS qui permet aux agences de génération de contenu IA
d'automatiser leurs workflows.

**Client MVP:** Estee (agence de génération d'images IA)
- Besoin: 10 automatisations custom
- Budget: €2.500/mois + usage-based
- Fréquence: Sporadic (projet par projet)

**Stack technique choisi:**
- Base de données: Supabase (PostgreSQL + Auth)
- Framework: À toi de recommander (Node.js, Python, Go?)
- Hosting: À toi de recommander (Vercel, AWS Lambda, etc.)

---

## 📊 DATA MODELS (À IMPLÉMENTER)

### 1. TABLE: users
```sql
id (uuid, primary key)
email (string, unique)
password_hash (string) -- via Supabase Auth
created_at (timestamp)
updated_at (timestamp)
last_login (timestamp)
status (enum: 'active', 'suspended', 'deleted')
role (enum: 'admin', 'user') -- pour future scalabilité
```

### 2. TABLE: clients (Multi-tenant)
```sql
id (uuid, primary key)
user_id (uuid, foreign key → users.id)
name (string) -- ex: "Estee"
email (string)
company_name (string)
plan (enum: 'premium_custom') -- future: 'starter', 'pro'
status (enum: 'active', 'pending', 'suspended')
subscription_amount (decimal) -- € par mois
subscription_start_date (date)
subscription_end_date (date)
api_keys (array of strings) -- pour authentification
created_at (timestamp)
updated_at (timestamp)
metadata (jsonb) -- notes, budget, custom fields
```

### 3. TABLE: workflows
```sql
id (uuid, primary key)
client_id (uuid, foreign key → clients.id)
name (string) -- ex: "Batch Image Generator"
description (text)
status (enum: 'draft', 'deployed', 'archived')
config (jsonb) -- paramètres du workflow
    {
        "model": "midjourney",
        "style": "photorealistic",
        "max_images": 100,
        "timeout_seconds": 1800,
        "retry_count": 3
    }
cost_per_execution (decimal) -- en euros
revenue_per_execution (decimal) -- en euros
created_at (timestamp)
deployed_at (timestamp)
updated_at (timestamp)
created_by_user_id (uuid) -- qui l'a créé (toi pour le MVP)
```

### 4. TABLE: workflow_executions
```sql
id (uuid, primary key)
workflow_id (uuid, foreign key → workflows.id)
client_id (uuid, foreign key → clients.id)
status (enum: 'pending', 'processing', 'completed', 'failed')
input_data (jsonb) -- les prompts, paramètres envoyés
output_data (jsonb) -- les images, résultats générés
error_message (text, nullable)
error_stack_trace (text, nullable) -- pour debugging
started_at (timestamp)
completed_at (timestamp)
duration_seconds (integer)
retry_count (integer, default: 0)
created_at (timestamp)
```

### 5. TABLE: workflow_requests
```sql
id (uuid, primary key)
client_id (uuid, foreign key → clients.id)
title (string) -- ex: "Moodboard Creator"
description (text)
use_case (text)
frequency (enum: 'daily', 'weekly', 'monthly', 'sporadic')
budget (decimal, nullable)
status (enum: 'draft', 'submitted', 'reviewing', 'negotiation',
        'contract_signed', 'development', 'deployed', 'rejected')
timeline (jsonb) -- tracking des étapes
    {
        "submitted_at": "2024-11-14T10:15:00Z",
        "estimate_sent_at": "2024-11-14T11:30:00Z",
        "negotiation_started_at": "2024-11-14T14:00:00Z",
        "contract_signed_at": null,
        "dev_started_at": null,
        "deployed_at": null
    }
estimated_cost (decimal)
estimated_dev_days (integer)
notes (text)
created_at (timestamp)
updated_at (timestamp)
```

### 6. TABLE: support_tickets
```sql
id (uuid, primary key)
client_id (uuid, foreign key → clients.id)
workflow_execution_id (uuid, nullable, foreign key)
title (string)
description (text)
priority (enum: 'urgent', 'high', 'medium', 'low')
status (enum: 'open', 'in_progress', 'resolved', 'closed')
assigned_to_admin_id (uuid, nullable)
created_at (timestamp)
updated_at (timestamp)
resolved_at (timestamp, nullable)
```

### 7. TABLE: audit_logs
```sql
id (uuid, primary key)
client_id (uuid, foreign key → clients.id)
user_id (uuid, foreign key → users.id)
action (string) -- "workflow_executed", "request_submitted", etc.
resource_type (string) -- "workflow", "request", "client"
resource_id (uuid)
changes (jsonb) -- avant/après des changements
ip_address (inet)
user_agent (text)
created_at (timestamp)
```

### 8. TABLE: api_logs (Pour debugging)
```sql
id (uuid, primary key)
client_id (uuid, foreign key → clients.id)
endpoint (string) -- "/api/workflows/:id/execute"
method (string) -- "POST", "GET"
status_code (integer)
response_time_ms (integer)
error_message (text, nullable)
request_body (jsonb, nullable)
response_body (jsonb, nullable)
ip_address (inet)
created_at (timestamp)
```

---

## 🔗 API ENDPOINTS (À IMPLÉMENTER)

### A. AUTHENTICATION
```
POST /api/auth/login
  Input: { email, password }
  Output: { access_token, refresh_token, user }

POST /api/auth/logout
  Auth: Required (Bearer token)
  Output: { success: true }

POST /api/auth/refresh
  Input: { refresh_token }
  Output: { access_token }

GET /api/auth/me
  Auth: Required
  Output: { user, client }
```

### B. CLIENT MANAGEMENT (Admin-only)
```
GET /api/admin/clients
  Auth: Required (Admin)
  Query: { limit, offset, status, sort }
  Output: { clients: [], total, page }

GET /api/admin/clients/:client_id
  Auth: Required (Admin)
  Output: { client, workflows, requests, tickets, stats }

POST /api/admin/clients
  Auth: Required (Admin)
  Input: { name, email, plan, subscription_amount }
  Output: { client }

PUT /api/admin/clients/:client_id
  Auth: Required (Admin)
  Input: { status, subscription_amount, metadata }
  Output: { client }

DELETE /api/admin/clients/:client_id
  Auth: Required (Admin)
  Output: { success: true }

POST /api/admin/clients/:client_id/force-logout
  Auth: Required (Admin)
  Output: { success: true }
```

### C. WORKFLOWS (Client view)
```
GET /api/workflows
  Auth: Required
  Output: { workflows: [] }

GET /api/workflows/:workflow_id
  Auth: Required
  Output: { workflow, stats, recent_executions }

POST /api/workflows/:workflow_id/execute
  Auth: Required
  Input: { input_data } -- les prompts, paramètres
  Output: { execution_id, status: 'pending' }

  → Cet endpoint déclenche un job asynchrone
  → Retourne immédiatement avec execution_id
  → Client poll sur GET /api/executions/:execution_id

GET /api/executions/:execution_id
  Auth: Required
  Output: { status, progress, output_data (si complété), error }

GET /api/workflows/:workflow_id/executions
  Auth: Required
  Query: { limit, offset, status }
  Output: { executions: [], total }

GET /api/workflows/:workflow_id/stats
  Auth: Required
  Output: {
    total_executions, success_count, failed_count,
    success_rate, avg_duration, revenue_this_month
  }
```

### D. WORKFLOW REQUESTS (Demandes)
```
POST /api/workflow-requests
  Auth: Required
  Input: {
    title, description, use_case, frequency, budget
  }
  Output: { request_id, status: 'submitted' }

GET /api/workflow-requests
  Auth: Required
  Output: { requests: [], total }

GET /api/workflow-requests/:request_id
  Auth: Required
  Output: { request with timeline and notes }

PUT /api/workflow-requests/:request_id
  Auth: Required (Admin only for status changes)
  Input: { status, notes, timeline_update }
  Output: { request }
```

### E. SUPPORT TICKETS
```
POST /api/support-tickets
  Auth: Required
  Input: { title, description, priority, workflow_execution_id? }
  Output: { ticket }

GET /api/support-tickets
  Auth: Required (Client sees own, Admin sees all)
  Output: { tickets: [] }

GET /api/support-tickets/:ticket_id
  Auth: Required
  Output: { ticket with comments }

PUT /api/support-tickets/:ticket_id
  Auth: Required (Admin)
  Input: { status, assigned_to, response }
  Output: { ticket }
```

### F. ADMIN ANALYTICS & MONITORING
```
GET /api/admin/dashboard
  Auth: Required (Admin)
  Output: {
    uptime_percent,
    errors_24h,
    total_executions_24h,
    total_revenue_month,
    active_clients,
    recent_activity: []
  }

GET /api/admin/workflows/stats
  Auth: Required (Admin)
  Output: { workflows with performance metrics }

GET /api/admin/errors
  Auth: Required (Admin)
  Query: { severity, limit, offset }
  Output: { errors: [], total }

GET /api/admin/audit-logs
  Auth: Required (Admin)
  Query: { client_id?, action?, limit, offset }
  Output: { logs: [], total }
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Flow:
1. **Client login** via Supabase Auth
2. **Generate JWT token** (Supabase does this)
3. **Attach token** to all requests (Bearer token in header)
4. **Verify token** before each request
5. **Check permissions** (client sees own data, admin sees all)

### Role-based access:
```
ADMIN:
- Voir tous les clients
- Gérer tous les workflows
- Accéder au dashboard admin
- Gérer les tickets support
- Voir tous les logs

CLIENT (Estee):
- Voir ses propres workflows
- Exécuter ses workflows
- Soumettre des demandes
- Ouvrir des tickets support
- Voir ses propres stats
```

---

## ⚙️ JOB QUEUE & ASYNC PROCESSING

Les workflows sont **asynchrones** et prennent du temps (15+ minutes).

### Flow:
```
1. Client POST /api/workflows/:id/execute
2. Backend crée un "execution" avec status='pending'
3. Backend ajoute job à queue (Bull/RabbitMQ/Temporal)
4. Retourne execution_id au client
5. Client poll GET /api/executions/:id pour l'état
6. Worker traite le job en background
7. Met à jour execution avec status='completed' + output_data
```

### Recommandation:
Utilise **Bull** (Redis-based) ou **Temporal** (plus robuste).
Pour le MVP simple: Redis + Bull est suffisant.

---

## 🛡️ ERROR HANDLING & LOGGING

### Erreurs à tracker:
1. **Workflow timeout** (API externe ne répond pas)
2. **API rate limit** (quota dépassé)
3. **Invalid input** (prompts mal formés)
4. **Database errors** (Supabase down)
5. **Authentication failures**

### Logging strategy:
```
DEBUG: Token refresh, API calls
INFO: Workflow started, workflow completed
WARN: Rate limit approaching, long duration
ERROR: Workflow failed, API error
```

Structure chaque log avec:
- timestamp
- level (DEBUG, INFO, WARN, ERROR)
- context (client_id, workflow_id, execution_id)
- message
- stack_trace (si erreur)

---

## 💾 DATABASE BACKUP & DISASTER RECOVERY

Supabase gère ça nativement, mais spécify:
- Daily backups
- 30-day retention
- Point-in-time recovery

---

## 📋 LIVRABLES ATTENDUS

1. ✅ **Supabase schema SQL** (migrations)
   - Tous les CREATE TABLE ci-dessus
   - Indexes sur foreign keys et fields fréquemment querés
   - Row-level security (RLS) policies pour multi-tenant

2. ✅ **API specification (OpenAPI/Swagger)**
   - Tous les endpoints listés
   - Input/output schemas
   - Status codes
   - Error responses

3. ✅ **Environment setup guide**
   - .env.example
   - Database connection strings
   - API keys (Supabase, etc.)
   - Setup instructions

4. ✅ **Code structure**
   - Organized folder structure
   - Example middleware (auth, logging)
   - Error handling utilities

5. ✅ **Authentication implementation**
   - Integration with Supabase Auth
   - JWT token generation & verification
   - Role-based access control

6. ✅ **README with:**
   - Project overview
   - Tech stack justification
   - How to run locally
   - API usage examples
   - Database migration instructions

---

## 🎯 PRIORITÉS (MVP Focus)

### MUST-HAVE (Semaine 1):
- ✅ All data models
- ✅ Authentication (login/logout)
- ✅ Client dashboard endpoints
- ✅ Workflow execution (POST/GET)
- ✅ Workflow stats
- ✅ Error handling & logging

### SHOULD-HAVE (Semaine 2):
- ✅ Workflow request endpoints
- ✅ Support tickets
- ✅ Audit logs
- ✅ Admin dashboard endpoints

### COULD-HAVE (Phase 2):
- Analytics dashboards
- Export data (CSV)
- Webhooks for notifications

---

## 📞 CONTEXT FOR FRONTEND & DESIGN

Une fois ton travail fait, va être consommé par:
1. **UI-Designer:** Besoin de la Swagger/OpenAPI pour les données qu'il affichera
2. **Frontend-Developer:** Besoin de l'API URL + endpoints pour intégration

Fournis-leur:
- `GET /api/admin/dashboard` pour afficher les KPIs
- `GET /api/workflows` pour lister les workflows client
- `POST /api/workflows/:id/execute` pour déclencher l'exécution
- etc.

---

## 🚀 NOTES IMPORTANTES

1. **Multi-tenant:** Chaque client est isolé. Vérifie toujours client_id.
2. **Async jobs:** Les workflows prennent du temps. Pas de endpoint synchrone.
3. **Logging:** Log TOUT pour debugging. Tes logs vont permettre le monitoring admin.
4. **Rate limiting:** Implémente rate limiting par client (ex: 100 req/min).
5. **Security:** Tout input est validation. Pas de SQL injection, XSS, etc.

---

Bon courage! 🚀
```
