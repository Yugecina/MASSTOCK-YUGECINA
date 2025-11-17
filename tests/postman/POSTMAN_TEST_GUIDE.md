# 📮 Guide Postman - MasStock API

## 🚀 Configuration de Base

### Base URL
```
http://localhost:3000/api/v1
```

### Headers Globaux (toutes les requêtes)
```json
{
  "Content-Type": "application/json"
}
```

### Variables Postman Recommandées
```
baseUrl = http://localhost:3000/api/v1
accessToken = (sera rempli après login)
```

---

## 🔐 1. AUTHENTIFICATION

### 1.1 Login - User Regular
**Method:** `POST`
**URL:** `{{baseUrl}}/auth/login`

**Body (raw JSON):**
```json
{
  "email": "estee@masstock.com",
  "password": "EsteePassword123!"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "60dd743e-5bbb-494b-8094-77a9c97f1673",
      "email": "estee@masstock.com",
      "role": "user",
      "status": "active"
    },
    "client": {
      "id": "a76e631c-4dc4-4abc-b759-9f7c225c142b",
      "name": "Estee Agency",
      "plan": "premium_custom",
      "status": "active"
    }
  }
}
```

**Actions après:**
1. Copie le `access_token`
2. Crée une variable Postman: `accessToken = <ton_token>`
3. Utilise cette variable dans les requêtes protégées


### 1.2 Login - Admin
**Method:** `POST`
**URL:** `{{baseUrl}}/auth/login`

**Body (raw JSON):**
```json
{
  "email": "admin@masstock.com",
  "password": "Admin123123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600,
    "user": {
      "id": "41a89d39-...",
      "email": "admin@masstock.com",
      "role": "admin",
      "status": "active"
    },
    "client": null
  }
}
```


### 1.3 Get Current User (Me)
**Method:** `GET`
**URL:** `{{baseUrl}}/auth/me`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "60dd743e-5bbb-494b-8094-77a9c97f1673",
    "email": "estee@masstock.com",
    "role": "user",
    "status": "active",
    "client": { ... }
  }
}
```

**Test Cases:**
- ✅ Avec token valide → 200 OK
- ❌ Sans token → 401 Unauthorized
- ❌ Avec token expiré → 401 Unauthorized


### 1.4 Logout
**Method:** `POST`
**URL:** `{{baseUrl}}/auth/logout`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body:** (vide)

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```


### 1.5 Refresh Token
**Method:** `POST`
**URL:** `{{baseUrl}}/auth/refresh`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body (raw JSON):**
```json
{
  "refresh_token": "bq3qjonmq2lh"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

---

## 📋 2. WORKFLOWS

### 2.1 List All Workflows
**Method:** `GET`
**URL:** `{{baseUrl}}/workflows`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters (optionnel):**
```
?limit=10&offset=0&status=active
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Email Verification",
      "description": "Verify client email address",
      "status": "active",
      "created_at": "2025-11-14T...",
      "total_executions": 45
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 10,
    "offset": 0
  }
}
```


### 2.2 Get Single Workflow
**Method:** `GET`
**URL:** `{{baseUrl}}/workflows/{workflowId}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**URL Parameters:**
```
workflowId = (remplace par un ID réel)
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Email Verification",
    "description": "...",
    "status": "active",
    "steps": [
      {
        "id": 1,
        "name": "Send Email",
        "action": "send_email",
        "config": { ... }
      }
    ],
    "created_at": "...",
    "updated_at": "..."
  }
}
```


### 2.3 Execute Workflow
**Method:** `POST`
**URL:** `{{baseUrl}}/workflows/{workflowId}/execute`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body (raw JSON):**
```json
{
  "input": {
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

**Expected Response (202 Accepted):**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_...",
    "workflow_id": "...",
    "status": "pending",
    "started_at": "2025-11-16T11:20:00.000Z",
    "input": { ... },
    "output": null
  }
}
```

---

## ⚡ 3. EXECUTIONS

### 3.1 Get Execution Status
**Method:** `GET`
**URL:** `{{baseUrl}}/executions/{executionId}`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec_...",
    "workflow_id": "...",
    "status": "completed",
    "started_at": "2025-11-16T11:20:00.000Z",
    "completed_at": "2025-11-16T11:20:05.000Z",
    "input": { ... },
    "output": {
      "success": true,
      "message": "Email sent successfully"
    },
    "error": null
  }
}
```

**Statuts possibles:**
- `pending` - En attente
- `running` - En cours
- `completed` - Terminé avec succès
- `failed` - Erreur
- `cancelled` - Annulé


### 3.2 List Executions
**Method:** `GET`
**URL:** `{{baseUrl}}/executions`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?limit=20&offset=0&status=completed
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "execution_id": "exec_...",
      "workflow_id": "...",
      "status": "completed",
      "started_at": "...",
      "completed_at": "..."
    }
  ],
  "pagination": { ... }
}
```

---

## 🎯 4. WORKFLOW REQUESTS (Custom)

### 4.1 Create Custom Workflow Request
**Method:** `POST`
**URL:** `{{baseUrl}}/workflow-requests`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body (raw JSON):**
```json
{
  "name": "Send Weekly Report",
  "description": "Generate and send weekly analytics report",
  "requested_features": [
    "Email integration",
    "PDF export",
    "Scheduling"
  ],
  "priority": "high",
  "budget": 5000,
  "deadline": "2025-12-15"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "req_...",
    "client_id": "...",
    "name": "Send Weekly Report",
    "status": "pending",
    "created_at": "...",
    "created_by": "..."
  }
}
```


### 4.2 List Workflow Requests
**Method:** `GET`
**URL:** `{{baseUrl}}/workflow-requests`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?status=pending&priority=high
```

---

## 🎫 5. SUPPORT TICKETS

### 5.1 Create Support Ticket
**Method:** `POST`
**URL:** `{{baseUrl}}/support-tickets`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Body (raw JSON):**
```json
{
  "subject": "Login not working",
  "description": "I can't login to my account",
  "category": "technical",
  "priority": "high",
  "attachments": []
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ticket_...",
    "subject": "Login not working",
    "status": "open",
    "priority": "high",
    "created_at": "...",
    "created_by": "..."
  }
}
```


### 5.2 List Tickets
**Method:** `GET`
**URL:** `{{baseUrl}}/support-tickets`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?status=open&priority=high
```

---

## 👨‍💼 6. ADMIN ENDPOINTS (Admin Only)

### 6.1 Admin Dashboard
**Method:** `GET`
**URL:** `{{baseUrl}}/admin/dashboard`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```
*(Note: Doit être un token admin)*

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_clients": 5,
    "total_workflows": 15,
    "total_executions": 250,
    "active_executions": 3,
    "failed_executions": 5,
    "revenue": {
      "total": 12500,
      "this_month": 2500
    }
  }
}
```


### 6.2 List All Clients
**Method:** `GET`
**URL:** `{{baseUrl}}/admin/clients`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?status=active&limit=20
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a76e631c-...",
      "name": "Estee Agency",
      "email": "estee@masstock.com",
      "plan": "premium_custom",
      "status": "active",
      "subscription_amount": 2500,
      "created_at": "..."
    }
  ],
  "pagination": { ... }
}
```


### 6.3 List All Workflows (Admin)
**Method:** `GET`
**URL:** `{{baseUrl}}/admin/workflows`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "name": "Email Verification",
      "created_by": "admin@masstock.com",
      "status": "active",
      "total_executions": 45,
      "created_at": "..."
    }
  ]
}
```


### 6.4 View Error Logs
**Method:** `GET`
**URL:** `{{baseUrl}}/admin/errors`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?days=7&limit=50
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "error": "RLS policy error",
      "timestamp": "2025-11-16T10:30:00.000Z",
      "execution_id": "exec_...",
      "stack_trace": "..."
    }
  ]
}
```


### 6.5 View Financial Reports
**Method:** `GET`
**URL:** `{{baseUrl}}/admin/finances`

**Headers:**
```
Authorization: Bearer {{accessToken}}
```

**Query Parameters:**
```
?start_date=2025-11-01&end_date=2025-11-30
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-11-01",
      "end": "2025-11-30"
    },
    "revenue": {
      "total": 7500,
      "by_plan": {
        "premium_custom": 5000,
        "enterprise": 2500
      }
    },
    "clients": {
      "total": 5,
      "active": 4,
      "cancelled": 1
    }
  }
}
```

---

## 🧪 PLAN DE TEST COMPLET

### Phase 1: Authentication ✅
- [ ] Login - User
- [ ] Login - Admin
- [ ] Get Me (current user)
- [ ] Logout
- [ ] Refresh Token

### Phase 2: Workflows
- [ ] List Workflows
- [ ] Get Single Workflow
- [ ] Execute Workflow
- [ ] Get Execution Status
- [ ] List Executions

### Phase 3: Requests & Tickets
- [ ] Create Workflow Request
- [ ] List Workflow Requests
- [ ] Create Support Ticket
- [ ] List Support Tickets

### Phase 4: Admin Features
- [ ] Admin Dashboard
- [ ] List All Clients
- [ ] List All Workflows
- [ ] View Error Logs
- [ ] View Finances

### Phase 5: Error Cases
- [ ] Login avec mauvais email
- [ ] Login avec mauvais password
- [ ] Accès sans token
- [ ] Accès avec token expiré
- [ ] Admin endpoint sans être admin

---

## 📊 CODES DE RÉPONSE ATTENDUS

| Code | Signification | Exemple |
|------|--------------|---------|
| 200 | OK | GET /auth/me |
| 201 | Created | POST /workflow-requests |
| 202 | Accepted | POST /workflows/:id/execute |
| 400 | Bad Request | Email manquant |
| 401 | Unauthorized | Token manquant/expiré |
| 403 | Forbidden | Admin endpoint sans être admin |
| 404 | Not Found | Workflow inexistant |
| 429 | Too Many Requests | Rate limit (10/15min sur auth) |
| 500 | Server Error | Erreur serveur |

---

## 💡 CONSEILS POSTMAN

### Créer une Collection
1. Clic droit → New → Collection
2. Nomme-la "MasStock API"
3. Ajoute les requêtes par catégorie

### Variables d'Environnement
```
baseUrl = http://localhost:3000/api/v1
accessToken = (remplacé après login)
workflowId = (à remplir)
executionId = (à remplir)
```

### Tests Automatisés
Ajoute dans l'onglet "Tests" de chaque requête:

```javascript
// Vérifier que la réponse réussit
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

// Vérifier que success = true
pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.equal(true);
});

// Sauvegarder le token
pm.test("Save access token", function () {
    if (pm.response.code === 200 && pm.response.json().data.access_token) {
        pm.environment.set("accessToken", pm.response.json().data.access_token);
    }
});
```

---

**Dernière mise à jour:** 2025-11-16
**Status:** ✅ Prêt pour testing
