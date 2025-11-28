# MasStock - Database Schema

**Last Updated:** 2025-11-28 ⚡ (Shared Workflows Architecture)
**Database:** PostgreSQL (Supabase)
**RLS Enabled:** ✅ All tables

## 📋 Table of Contents

1. [Users vs Clients - Core Concepts](#users-vs-clients---core-concepts)
2. [Overview](#overview)
3. [Entity Relationship Diagram](#entity-relationship-diagram)
4. [Tables](#tables)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Indexes](#indexes)
7. [Storage Buckets](#storage-buckets)
8. [Common Queries](#common-queries)

---

## Users vs Clients - Core Concepts

### ⚠️ IMPORTANT: Ne pas confondre Users et Clients

| Concept | Description | Exemple |
|---------|-------------|---------|
| **User** | Compte utilisateur individuel (une personne) | Jean Dupont, Marie Martin |
| **Client** | Entreprise/organisation cliente (une entité) | Estee Agency, Acme Corp |

### Architecture Relationnelle

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│                    (Entreprises)                             │
│                                                              │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐ │
│   │ Estee Agency│      │  Acme Corp  │      │  Beta Inc   │ │
│   └──────┬──────┘      └──────┬──────┘      └──────┬──────┘ │
└──────────┼─────────────────────┼─────────────────────┼──────┘
           │                     │                     │
           │  client_members     │  client_members     │
           │  (junction N:N)     │  (junction N:N)     │
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│                    (Personnes)                               │
│                                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐│
│   │  Jean   │  │  Marie  │  │  Pierre │  │ Admin MasStock  ││
│   │ (user)  │  │ (user)  │  │ (user)  │  │    (admin)      ││
│   │ owner   │  │ collab  │  │ owner   │  │  PAS de client  ││
│   └─────────┘  └─────────┘  └─────────┘  └─────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Règles de Création

| Action | Règle |
|--------|-------|
| **Créer un Admin** | PAS de client associé (role='admin' dans `users`) |
| **Créer un User** | Client OBLIGATOIRE - doit être assigné à un client existant via `client_members` |
| **Créer un Client** | Création indépendante - on peut ajouter des membres après |

### Rôles dans client_members

| Rôle | Accès |
|------|-------|
| **owner** | Accès complet : workflows, exécutions, facturation, gestion des membres |
| **collaborator** | Accès limité : workflows et résultats d'exécution uniquement |

### Exemples Concrets

**Scénario 1 : Agence avec équipe**
```
Client: "Estee Agency"
└── Members:
    ├── estee@agency.com (owner) - Peut tout faire
    ├── designer@agency.com (collaborator) - Lance les workflows
    └── assistant@agency.com (collaborator) - Voit les résultats
```

**Scénario 2 : Freelance seul**
```
Client: "John Freelance"
└── Members:
    └── john@freelance.com (owner) - Seul membre
```

**Scénario 3 : Admin MasStock**
```
User: admin@masstock.com (role='admin')
└── PAS de client associé
└── A accès à TOUT via les politiques RLS admin
```

### Flux de Création (Admin Panel)

```
1. CRÉER UN CLIENT (AdminClients)
   └── Créer l'entreprise (nom, plan, abonnement)
   └── Pas d'utilisateur créé automatiquement

2. CRÉER UN USER (AdminUsers)
   ├── Si role='admin' → Pas de client nécessaire
   └── Si role='user' → Client OBLIGATOIRE
       └── Sélectionner le client existant
       └── Choisir le rôle (owner/collaborator)
       └── Entrée créée dans client_members
```

### Requêtes Utiles

**Trouver tous les membres d'un client :**
```sql
SELECT u.email, u.name, cm.role
FROM client_members cm
JOIN users u ON u.id = cm.user_id
WHERE cm.client_id = 'client-uuid-here'
AND cm.status = 'active';
```

**Trouver tous les clients d'un user :**
```sql
SELECT c.name, cm.role
FROM client_members cm
JOIN clients c ON c.id = cm.client_id
WHERE cm.user_id = 'user-uuid-here'
AND cm.status = 'active';
```

---

## Overview

MasStock uses **Supabase** (PostgreSQL) with the following features:
- **Row Level Security (RLS)** enabled on all tables
- **Foreign key constraints** for referential integrity
- **Indexes** on frequently queried columns
- **Triggers** for updated_at timestamps
- **Storage buckets** for file uploads

### Key Design Principles

1. **Multi-tenancy**: Users can belong to multiple clients via `client_members` junction table
2. **Client Roles**: Users have roles within clients (owner, collaborator)
3. **Shared Workflows ⚡ NEW**: Workflows can be shared across multiple clients via `client_workflows` junction table
4. **Per-Client Executions**: Even for shared workflows, executions remain isolated per client
5. **Soft deletes**: Status field instead of DELETE (users, clients)
6. **Audit trails**: created_at, updated_at, last_login timestamps
7. **Encryption**: Sensitive data (API keys) encrypted in database
8. **Normalization**: Separate tables for entities (users, clients, workflows)
9. **Templates**: Workflow templates system for easy workflow assignment

---

## Entity Relationship Diagram ⚡ UPDATED (2025-11-28)

```
┌─────────────────┐          ┌─────────────────┐
│     USERS       │          │ CLIENT_MEMBERS  │
│─────────────────│          │─────────────────│
│ id (PK)         │◄────────►│ user_id (FK)    │
│ email           │    N:N   │ client_id (FK)  │
│ name            │          │ role            │  (owner/collaborator)
│ role            │          │ created_at      │
│ status          │          │ updated_at      │
│ created_at      │          └────────┬────────┘
│ updated_at      │                   │
│ last_login      │                   │
└─────────────────┘                   │
                                      │
                                      ▼
                             ┌─────────────────┐
                             │    CLIENTS      │
                             │─────────────────│
                             │ id (PK)         │
                             │ name            │
                             │ company_name    │
                             │ email           │
                             │ status          │
                             │ created_at      │
                             │ updated_at      │
                             └────────┬────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
     ┌──────────────────┐   ┌─────────────────┐   ┌─────────────────┐
     │CLIENT_WORKFLOWS⭐│   │ WORKFLOW_       │   │ SUPPORT_TICKETS │
     │──────────────────│   │  REQUESTS       │   │─────────────────│
     │id (PK)           │   │─────────────────│   │ id (PK)         │
     │client_id (FK)    │   │ id (PK)         │   │ client_id (FK)  │
     │workflow_id (FK)  │   │ client_id (FK)  │   │ user_id (FK)    │
     │is_active         │   │ workflow_id (FK)│   │ subject         │
     │assigned_at       │   │ status          │   │ description     │
     │assigned_by (FK)  │   │ notes           │   │ status          │
     └────────┬─────────┘   └─────────────────┘   └─────────────────┘
              │  N:N
              │
              ▼
     ┌─────────────────┐
     │   WORKFLOWS⚡   │  (SHARED across clients)
     │─────────────────│
     │ id (PK)         │
     │ name            │
     │ description     │
     │ status          │
     │ config          │
     │ client_id       │  ⚠️ NULLABLE (NULL = shared)
     │ is_shared       │  ⭐ NEW
     │ template_id (FK)│
     │ created_at      │
     │ updated_at      │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │  WORKFLOW_      │
     │  EXECUTIONS     │  (Per client, even for shared workflows)
     │─────────────────│
     │ id (PK)         │
     │ workflow_id (FK)│
     │ client_id (FK)  │
     │ user_id (FK)    │
     │ status          │
     │ input_data      │
     │ output_data     │
     │ started_at      │
     │ completed_at    │
     │ duration_seconds│
     │ error_message   │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────┐
     │  WORKFLOW_BATCH_│
     │     RESULTS     │
     │─────────────────│
     │ id (PK)         │
     │ execution_id(FK)│
     │ batch_index     │
     │ prompt_text     │
     │ status          │
     │ result_url      │
     │ error_message   │
     │ processing_time │
     │ created_at      │
     │ completed_at    │
     └─────────────────┘


┌─────────────────────┐
│ WORKFLOW_TEMPLATES  │  (Admin creates, assigns to clients → workflows)
│─────────────────────│
│ id (PK)             │
│ name                │
│ description         │
│ icon                │
│ workflow_type       │
│ config              │
│ cost_per_execution  │
│ revenue_per_exec    │
│ is_active           │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

### Relationship Summary ⚡ UPDATED

| Relationship | Type | Description |
|-------------|------|-------------|
| Users ↔ Clients | **N:N** | Via `client_members` junction table |
| Users → client_members | 1:N | One user can be member of many clients |
| Clients → client_members | 1:N | One client can have many members |
| client_members.role | - | `owner` (full access) or `collaborator` (workflows only) |
| **Clients ↔ Workflows** | **N:N** | **Via `client_workflows` junction table (NEW)** |
| Clients → client_workflows | 1:N | One client can access many workflows |
| Workflows → client_workflows | 1:N | One workflow can be shared with many clients |
| client_workflows.is_active | - | Controls whether access is active or revoked |
| Workflows → template_id | N:1 | Workflow can reference source template |
| Templates → Workflows | 1:N | One template can create many workflows |
| Workflows.client_id (LEGACY) | N:1 | **Deprecated for shared workflows. Use client_workflows instead.** |
| Workflow_Executions → Workflows | N:1 | Each execution belongs to one workflow (can be shared) |
| Workflow_Executions → Clients | N:1 | Each execution is performed by one client |

---

## Tables

### 1. `users`

User accounts (admin, platform users)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | User ID (Supabase Auth user ID) |
| `email` | text | UNIQUE, NOT NULL | Email address |
| `name` | text | NOT NULL | Full name |
| `role` | text | NOT NULL, CHECK (role IN ('admin', 'user')) | Platform role (admin = MasStock team) |
| `status` | text | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'suspended', 'deleted')) | Account status |
| `created_at` | timestamptz | DEFAULT now() | Account creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |
| `last_login` | timestamptz | NULL | Last login timestamp |

**Note:** Users' association with clients is managed via the `client_members` junction table (N:N relationship).

**Indexes:**
- `idx_users_email` ON email
- `idx_users_role` ON role
- `idx_users_status` ON status

**RLS Policies:**
- Users can view their own profile
- Users can view other members of their clients
- Admins can view all users
- Only admins can create/update/delete users

**Example Row:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "john@client.com",
  "name": "John Doe",
  "role": "user",
  "status": "active",
  "created_at": "2025-01-15T10:00:00Z",
  "updated_at": "2025-01-20T14:30:00Z",
  "last_login": "2025-11-23T09:15:00Z"
}
```

---

### 2. `clients`

Client organizations

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Client ID |
| `name` | text | NOT NULL | Display name |
| `company_name` | text | NULL | Company legal name |
| `email` | text | NOT NULL | Contact email |
| `status` | text | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'suspended', 'deleted')) | Client status |
| `created_at` | timestamptz | DEFAULT now() | Client creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Note:** Client members are managed via the `client_members` junction table (N:N with users).

**Indexes:**
- `idx_clients_status` ON status
- `idx_clients_email` ON email

**RLS Policies:**
- Users can view clients they are members of
- Admins can view all clients
- Only admins can create/update/delete clients

**Example Row:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174001",
  "name": "Acme Corp",
  "company_name": "Acme Corporation Inc.",
  "email": "contact@acme.com",
  "status": "active",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

---

### 3. `client_members` ⭐ NEW

Junction table for multi-user per client (N:N relationship)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Membership ID |
| `client_id` | uuid | FK → clients(id) ON DELETE CASCADE, NOT NULL | Client |
| `user_id` | uuid | FK → users(id) ON DELETE CASCADE, NOT NULL | User |
| `role` | text | NOT NULL, DEFAULT 'collaborator', CHECK (role IN ('owner', 'collaborator')) | Role within client |
| `created_at` | timestamptz | DEFAULT now() | Membership creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Client Roles:**

| Role | Access Level |
|------|-------------|
| `owner` | Full access: workflows, executions, billing, member management |
| `collaborator` | Limited access: workflows, executions, results only |

**Indexes:**
- `idx_client_members_client_id` ON client_id
- `idx_client_members_user_id` ON user_id
- `idx_client_members_unique` ON (client_id, user_id) UNIQUE

**RLS Policies:**
- Admins can manage all memberships
- Users can view memberships for their clients
- Only admins can add/remove members

**Example Row:**
```json
{
  "id": "mem12345-e89b-12d3-a456-426614174007",
  "client_id": "456e7890-e89b-12d3-a456-426614174001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "role": "owner",
  "created_at": "2025-01-10T12:00:00Z",
  "updated_at": "2025-01-10T12:00:00Z"
}
```

---

### 4. `workflow_templates` ⭐ NEW

Pre-defined workflow templates for assignment to clients

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Template ID |
| `name` | text | NOT NULL | Template name |
| `description` | text | NULL | Template description |
| `icon` | text | DEFAULT 'zap' | Icon identifier (zap, sparkles, etc.) |
| `workflow_type` | text | NOT NULL | Workflow type (nano_banana, pro_banana, etc.) |
| `config` | jsonb | NOT NULL, DEFAULT '{}'::jsonb | Default configuration |
| `cost_per_execution` | decimal(10,2) | DEFAULT 0.00 | Cost per execution (for admin tracking) |
| `revenue_per_execution` | decimal(10,2) | DEFAULT 0.00 | Revenue per execution |
| `is_active` | boolean | DEFAULT true | Whether template is available for assignment |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Seed Data:**

| Name | Type | Cost | Revenue |
|------|------|------|---------|
| Flash Image Gen | nano_banana | $0.039 | $0.10 |
| Pro Image Gen | pro_banana | $0.10 | $0.25 |

**Indexes:**
- `idx_workflow_templates_is_active` ON is_active
- `idx_workflow_templates_workflow_type` ON workflow_type

**RLS Policies:**
- Only admins can view/manage templates

**Example Row:**
```json
{
  "id": "tpl12345-e89b-12d3-a456-426614174008",
  "name": "Flash Image Generation",
  "description": "Fast AI image generation using Gemini 2.5 Flash",
  "icon": "zap",
  "workflow_type": "nano_banana",
  "config": {
    "model": "gemini-2.5-flash-image",
    "max_prompts": 100,
    "requires_api_key": true
  },
  "cost_per_execution": 0.039,
  "revenue_per_execution": 0.10,
  "is_active": true,
  "created_at": "2025-01-05T08:00:00Z",
  "updated_at": "2025-01-05T08:00:00Z"
}
```

---

### 5. `workflows` ⚡ UPDATED (Shared Workflows Architecture)

Workflow instances - **NOW SHARED across multiple clients**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Workflow ID |
| `name` | text | NOT NULL | Workflow name |
| `description` | text | NULL | Workflow description |
| `status` | text | NOT NULL, DEFAULT 'active', CHECK (status IN ('active', 'inactive', 'deployed', 'archived')) | Workflow status |
| `config` | jsonb | NOT NULL, DEFAULT '{}'::jsonb | Workflow configuration |
| `client_id` | uuid | FK → clients(id), **NULLABLE** | **DEPRECATED for shared workflows. NULL = shared workflow. Use client_workflows junction for access control.** |
| `is_shared` | boolean | DEFAULT false | **NEW: True if workflow is shared across multiple clients** |
| `template_id` | uuid | FK → workflow_templates(id), NULL | Source template (if assigned from template) |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**⚠️ ARCHITECTURE CHANGE (2025-11-28):**
- `client_id` is now **NULLABLE** (was NOT NULL)
- **Shared workflows** have `client_id = NULL` and `is_shared = true`
- Client access is managed via **`client_workflows` junction table** (see below)
- Legacy single-client workflows still have `client_id` set

**Config Schema** (jsonb):
```json
{
  "workflow_type": "nano_banana",
  "model": "gemini-2.5-flash-image",
  "requires_api_key": true,
  "max_prompts": 100,
  "supports_reference_images": true
}
```

**Indexes:**
- `idx_workflows_status` ON status
- `idx_workflows_client_id` ON client_id
- `idx_workflows_template_id` ON template_id
- `idx_workflows_is_shared` ON is_shared (NEW)

**RLS Policies:**
- Users can view workflows via `client_workflows` junction table OR legacy `client_id`
- Admins can view all workflows
- Only admins can create/update/delete workflows

**Example Row (Shared Workflow):**
```json
{
  "id": "f8b20b59-7d06-4599-8413-64da74225b0c",
  "name": "Image Factory",
  "description": "Generate AI images using Gemini 2.5 Flash",
  "status": "deployed",
  "config": {
    "workflow_type": "nano_banana",
    "model": "gemini-2.5-flash-image",
    "requires_api_key": true
  },
  "client_id": null,
  "is_shared": true,
  "template_id": "60a1ad1a-6bfe-4852-994f-9deb1a9a78df",
  "created_at": "2025-11-18T21:18:18.946+00",
  "updated_at": "2025-11-25T22:24:14.773377+00"
}
```

---

### 5.1. `client_workflows` ⭐ NEW (Junction Table)

Links clients to shared workflows (N:N relationship)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Access record ID |
| `client_id` | uuid | FK → clients(id) ON DELETE CASCADE, NOT NULL | Client with access |
| `workflow_id` | uuid | FK → workflows(id) ON DELETE CASCADE, NOT NULL | Workflow accessible |
| `assigned_at` | timestamptz | DEFAULT now() | When access was granted |
| `assigned_by` | uuid | FK → users(id) ON DELETE SET NULL | Admin who granted access |
| `is_active` | boolean | DEFAULT true | Whether access is currently active |
| `created_at` | timestamptz | DEFAULT now() | Record creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Purpose:** Manages which clients have access to which shared workflows.

**Key Points:**
- One workflow can be accessed by multiple clients
- One client can access multiple workflows
- `is_active = false` revokes access without deleting history
- UNIQUE constraint on (client_id, workflow_id)

**Indexes:**
- `idx_client_workflows_client_id` ON client_id
- `idx_client_workflows_workflow_id` ON workflow_id
- `idx_client_workflows_is_active` ON is_active
- UNIQUE constraint on (client_id, workflow_id)

**RLS Policies:**
- Admins can manage all access records
- Users can view access records for their clients
- Only admins can grant/revoke access

**Example Rows:**
```json
[
  {
    "id": "15189b77-bfa6-4152-b7bf-0efe6a594977",
    "client_id": "a76e631c-4dc4-4abc-b759-9f7c225c142b",
    "workflow_id": "f8b20b59-7d06-4599-8413-64da74225b0c",
    "assigned_at": "2025-11-28T10:05:13.652+00",
    "assigned_by": "41a89d39-3db3-43a8-a8b0-8ada8bb4bdcf",
    "is_active": true,
    "created_at": "2025-11-28T10:05:13.652+00",
    "updated_at": "2025-11-28T10:05:13.652+00"
  },
  {
    "id": "a763bcf0-027d-46d1-972e-b7ff68b818c1",
    "client_id": "f14a2f20-f81f-4d8b-93ec-96d6e59cff06",
    "workflow_id": "f8b20b59-7d06-4599-8413-64da74225b0c",
    "assigned_at": "2025-11-28T10:05:13.652+00",
    "assigned_by": "41a89d39-3db3-43a8-a8b0-8ada8bb4bdcf",
    "is_active": true,
    "created_at": "2025-11-28T10:05:13.652+00",
    "updated_at": "2025-11-28T10:05:13.652+00"
  }
]
```

**Common Queries:**

```sql
-- Get all workflows accessible by a client
SELECT w.*
FROM workflows w
JOIN client_workflows cw ON cw.workflow_id = w.id
WHERE cw.client_id = $1 AND cw.is_active = true;

-- Get all clients with access to a workflow
SELECT c.*
FROM clients c
JOIN client_workflows cw ON cw.client_id = c.id
WHERE cw.workflow_id = $1 AND cw.is_active = true;

-- Grant workflow access to client
INSERT INTO client_workflows (client_id, workflow_id, assigned_by, is_active)
VALUES ($1, $2, $3, true)
ON CONFLICT (client_id, workflow_id)
DO UPDATE SET is_active = true, updated_at = NOW();

-- Revoke workflow access
UPDATE client_workflows
SET is_active = false, updated_at = NOW()
WHERE client_id = $1 AND workflow_id = $2;
```

---

### 6. `workflow_requests`

Client requests for workflow execution

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Request ID |
| `client_id` | uuid | FK → clients(id), NOT NULL | Requesting client |
| `workflow_id` | uuid | FK → workflows(id), NOT NULL | Requested workflow |
| `status` | text | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'approved', 'rejected')) | Request status |
| `notes` | text | NULL | Additional notes |
| `created_at` | timestamptz | DEFAULT now() | Request timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_workflow_requests_client_id` ON client_id
- `idx_workflow_requests_workflow_id` ON workflow_id
- `idx_workflow_requests_status` ON status

**RLS Policies:**
- Clients can view their own requests
- Admins can view all requests
- Clients can create requests
- Only admins can update request status

**Example Row:**
```json
{
  "id": "abc12345-e89b-12d3-a456-426614174003",
  "client_id": "456e7890-e89b-12d3-a456-426614174001",
  "workflow_id": "789e1234-e89b-12d3-a456-426614174002",
  "status": "approved",
  "notes": "Need 50 product images for Q2 campaign",
  "created_at": "2025-11-20T10:00:00Z",
  "updated_at": "2025-11-21T14:30:00Z"
}
```

---

### 7. `workflow_executions`

Workflow execution records

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Execution ID |
| `workflow_id` | uuid | FK → workflows(id), NOT NULL | Executed workflow |
| `client_id` | uuid | FK → clients(id), NOT NULL | Client who executed |
| `triggered_by_user_id` | uuid | FK → users(id), NULL | User (collaborator) who triggered this execution |
| `status` | text | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'processing', 'completed', 'failed')) | Execution status |
| `input_data` | jsonb | NOT NULL | Execution input data |
| `output_data` | jsonb | NULL | Execution output data |
| `started_at` | timestamptz | NULL | Execution start time |
| `completed_at` | timestamptz | NULL | Execution completion time |
| `duration_seconds` | integer | NULL | Execution duration |
| `error_message` | text | NULL | Error message if failed |
| `created_at` | timestamptz | DEFAULT now() | Record creation timestamp |

**Input Data Schema** (jsonb) - Nano Banana:
```json
{
  "prompts": [
    "a cat wearing sunglasses",
    "a dog in a spaceship"
  ],
  "reference_images": ["base64..."],
  "api_key": "encrypted_api_key_here"
}
```

**Output Data Schema** (jsonb):
```json
{
  "successful": 45,
  "failed": 5,
  "total": 50
}
```

**Indexes:**
- `idx_workflow_executions_workflow_id` ON workflow_id
- `idx_workflow_executions_client_id` ON client_id
- `idx_workflow_executions_triggered_by` ON triggered_by_user_id
- `idx_workflow_executions_status` ON status
- `idx_workflow_executions_created_at` ON created_at DESC

**RLS Policies:**
- Users can view executions for their client
- Admins can view all executions
- Users can create executions for their client

**Example Row:**
```json
{
  "id": "def45678-e89b-12d3-a456-426614174004",
  "workflow_id": "789e1234-e89b-12d3-a456-426614174002",
  "client_id": "456e7890-e89b-12d3-a456-426614174001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "completed",
  "input_data": {
    "prompts": ["cat with hat", "dog in car"],
    "api_key": "encrypted..."
  },
  "output_data": {
    "successful": 2,
    "failed": 0,
    "total": 2
  },
  "started_at": "2025-11-23T10:00:00Z",
  "completed_at": "2025-11-23T10:05:30Z",
  "duration_seconds": 330,
  "error_message": null,
  "created_at": "2025-11-23T10:00:00Z"
}
```

---

### 8. `workflow_batch_results`

Individual batch processing results (one per prompt)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Result ID |
| `execution_id` | uuid | FK → workflow_executions(id), NOT NULL | Parent execution |
| `batch_index` | integer | NOT NULL | Index in batch (0-based) |
| `prompt_text` | text | NOT NULL | Original prompt |
| `status` | text | NOT NULL, DEFAULT 'processing', CHECK (status IN ('processing', 'completed', 'failed')) | Result status |
| `result_url` | text | NULL | Public URL of generated image |
| `result_storage_path` | text | NULL | Storage path (internal) |
| `error_message` | text | NULL | Error message if failed |
| `processing_time_ms` | integer | NULL | Processing time in milliseconds |
| `created_at` | timestamptz | DEFAULT now() | Record creation timestamp |
| `completed_at` | timestamptz | NULL | Completion timestamp |

**Indexes:**
- `idx_workflow_batch_results_execution_id` ON execution_id
- `idx_workflow_batch_results_status` ON status
- `idx_workflow_batch_results_execution_batch` ON (execution_id, batch_index) UNIQUE

**RLS Policies:**
- Users can view results for their client's executions
- Admins can view all results

**Example Row:**
```json
{
  "id": "ghi78901-e89b-12d3-a456-426614174005",
  "execution_id": "def45678-e89b-12d3-a456-426614174004",
  "batch_index": 0,
  "prompt_text": "a cat wearing sunglasses",
  "status": "completed",
  "result_url": "https://example.supabase.co/storage/v1/object/public/workflow-results/def45678.../0_1234567890.png",
  "result_storage_path": "def45678.../0_1234567890.png",
  "error_message": null,
  "processing_time_ms": 3500,
  "created_at": "2025-11-23T10:00:00Z",
  "completed_at": "2025-11-23T10:00:03Z"
}
```

---

### 9. `support_tickets`

Support ticket system

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT uuid_generate_v4() | Ticket ID |
| `client_id` | uuid | FK → clients(id), NOT NULL | Client who created ticket |
| `user_id` | uuid | FK → users(id), NOT NULL | User who created ticket |
| `subject` | text | NOT NULL | Ticket subject |
| `description` | text | NOT NULL | Ticket description |
| `status` | text | NOT NULL, DEFAULT 'open', CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) | Ticket status |
| `priority` | text | NOT NULL, DEFAULT 'medium', CHECK (priority IN ('low', 'medium', 'high', 'urgent')) | Ticket priority |
| `created_at` | timestamptz | DEFAULT now() | Ticket creation timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last update timestamp |

**Indexes:**
- `idx_support_tickets_client_id` ON client_id
- `idx_support_tickets_user_id` ON user_id
- `idx_support_tickets_status` ON status
- `idx_support_tickets_priority` ON priority

**RLS Policies:**
- Users can view tickets for their client
- Admins can view all tickets
- Users can create tickets for their client
- Admins can update ticket status

**Example Row:**
```json
{
  "id": "jkl23456-e89b-12d3-a456-426614174006",
  "client_id": "456e7890-e89b-12d3-a456-426614174001",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "subject": "Unable to upload reference images",
  "description": "When I try to upload images > 5MB, I get an error...",
  "status": "in_progress",
  "priority": "high",
  "created_at": "2025-11-22T15:00:00Z",
  "updated_at": "2025-11-23T09:00:00Z"
}
```

---

## Row Level Security (RLS)

All tables have RLS enabled to ensure data isolation.

### Common RLS Patterns

**1. Admin Access (Full Access)**
```sql
CREATE POLICY "Admins can access all records"
  ON table_name FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

**2. Client Member Access (via client_members junction)**
```sql
-- NEW PATTERN: Access via client_members table
CREATE POLICY "Members can view their client data"
  ON table_name FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM client_members
      WHERE user_id = auth.uid()
    )
  );
```

**3. User Access (Own Profile Only)**
```sql
CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());
```

**4. Client Owner Only Access (billing, member management)**
```sql
-- For sensitive operations (owner role required)
CREATE POLICY "Owners can manage client settings"
  ON table_name FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM client_members
      WHERE user_id = auth.uid()
      AND role = 'owner'
    )
  );
```

### RLS by Table

| Table | Admin | Owner | Collaborator | User (self) |
|-------|-------|-------|--------------|-------------|
| `users` | ALL | SELECT (same client members) | SELECT (same client members) | SELECT (own) |
| `clients` | ALL | ALL (via membership) | SELECT (via membership) | - |
| `client_members` | ALL | SELECT (own client) | SELECT (own client) | - |
| `workflow_templates` | ALL | - | - | - |
| `workflows` | ALL | ALL (client's) | SELECT (client's) | - |
| `workflow_requests` | ALL | ALL (client's) | SELECT (client's) | - |
| `workflow_executions` | ALL | ALL (client's) | ALL (client's) | - |
| `workflow_batch_results` | ALL | SELECT (client's) | SELECT (client's) | - |
| `support_tickets` | ALL | ALL (client's) | ALL (client's) | - |

---

## Indexes

### Performance Indexes

**Foreign Keys:**
- All foreign key columns have indexes for JOIN performance

**Status Fields:**
- All status columns indexed for filtering

**Timestamps:**
- `created_at DESC` for recent-first ordering
- `updated_at DESC` for change tracking

**Composite Indexes:**
- `(execution_id, batch_index)` on workflow_batch_results (UNIQUE)

### Example Index Creation

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_role ON users(role);

-- Workflow Executions
CREATE INDEX idx_workflow_executions_created_at ON workflow_executions(created_at DESC);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
```

---

## Storage Buckets

### `workflow-results`

Stores generated images and files from workflow executions.

**Configuration:**
- **Public:** Yes (public URLs)
- **File Size Limit:** 10 MB
- **Allowed MIME Types:** image/png, image/jpeg, image/webp
- **RLS:** Enabled

**Path Structure:**
```
workflow-results/
  {execution_id}/
    {batch_index}_{timestamp}.png
```

**Example Path:**
```
workflow-results/def45678-e89b-12d3-a456-426614174004/0_1700000000.png
```

**RLS Policies:**
```sql
-- Admins can access all files
CREATE POLICY "Admins can access all files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'workflow-results' AND EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Clients can access their own execution results
CREATE POLICY "Clients can access their results"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'workflow-results' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM workflow_executions
      WHERE client_id IN (SELECT client_id FROM users WHERE id = auth.uid())
    )
  );
```

---

## Common Queries

### Get User with Client Memberships (via client_members)

```sql
SELECT
  u.id,
  u.email,
  u.name,
  u.role,
  u.status,
  json_agg(
    json_build_object(
      'client_id', c.id,
      'client_name', c.name,
      'client_email', c.email,
      'role', cm.role,
      'joined_at', cm.created_at
    )
  ) AS client_memberships
FROM users u
LEFT JOIN client_members cm ON u.id = cm.user_id AND cm.status = 'active'
LEFT JOIN clients c ON cm.client_id = c.id
WHERE u.id = $1
GROUP BY u.id, u.email, u.name, u.role, u.status;
```

### Get Workflows Accessible by Client ⚡ NEW

```sql
-- Get all workflows a client has access to (via junction table)
SELECT
  w.id,
  w.name,
  w.description,
  w.status,
  w.is_shared,
  cw.assigned_at,
  cw.is_active,
  wt.name AS template_name
FROM workflows w
JOIN client_workflows cw ON cw.workflow_id = w.id
LEFT JOIN workflow_templates wt ON w.template_id = wt.id
WHERE cw.client_id = $1
  AND cw.is_active = true
ORDER BY cw.assigned_at DESC;
```

### Get All Clients with Access to a Workflow ⚡ NEW

```sql
-- See which clients have access to a specific workflow
SELECT
  c.id,
  c.name,
  c.email,
  cw.assigned_at,
  cw.is_active,
  u.name AS assigned_by_name
FROM clients c
JOIN client_workflows cw ON cw.client_id = c.id
LEFT JOIN users u ON cw.assigned_by = u.id
WHERE cw.workflow_id = $1
ORDER BY cw.assigned_at DESC;
```

### Get Executions with Workflow Details

```sql
SELECT
  e.id,
  e.status,
  e.created_at,
  e.duration_seconds,
  w.name AS workflow_name,
  u.name AS user_name,
  c.name AS client_name
FROM workflow_executions e
JOIN workflows w ON e.workflow_id = w.id
JOIN users u ON e.user_id = u.id
JOIN clients c ON e.client_id = c.id
WHERE e.client_id = $1
ORDER BY e.created_at DESC
LIMIT 50;
```

### Get Batch Results for Execution

```sql
SELECT
  id,
  batch_index,
  prompt_text,
  status,
  result_url,
  processing_time_ms,
  error_message
FROM workflow_batch_results
WHERE execution_id = $1
ORDER BY batch_index ASC;
```

### Analytics: Execution Success Rate by Client

```sql
SELECT
  c.name AS client_name,
  COUNT(e.id) AS total_executions,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS successful,
  COUNT(CASE WHEN e.status = 'failed' THEN 1 END) AS failed,
  ROUND(
    COUNT(CASE WHEN e.status = 'completed' THEN 1 END)::numeric /
    NULLIF(COUNT(e.id), 0) * 100,
    2
  ) AS success_rate_percent
FROM workflow_executions e
JOIN clients c ON e.client_id = c.id
GROUP BY c.id, c.name
ORDER BY total_executions DESC;
```

### Analytics: Top Workflows by Usage

```sql
SELECT
  w.name AS workflow_name,
  COUNT(e.id) AS execution_count,
  AVG(e.duration_seconds) AS avg_duration_seconds,
  COUNT(CASE WHEN e.status = 'completed' THEN 1 END) AS successful_count
FROM workflows w
LEFT JOIN workflow_executions e ON w.id = e.workflow_id
GROUP BY w.id, w.name
ORDER BY execution_count DESC
LIMIT 10;
```

---

## Related Documentation

- **[project_architecture.md](./project_architecture.md)** - System architecture overview
- **[../sop/add_migration.md](../sop/add_migration.md)** - How to add database migrations
- **[../../CLAUDE.md](../../CLAUDE.md)** - Development guide

---

**Migration Management:**
- Migrations stored in `supabase/migrations/`
- Use `npm run migrate` to apply migrations
- Always enable RLS on new tables
- Add indexes for foreign keys and frequently queried columns
