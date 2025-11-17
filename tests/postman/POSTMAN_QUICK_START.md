# 🚀 Postman Quick Start - MasStock API

## 📥 Import dans Postman (2 minutes)

### Étape 1: Télécharge les fichiers
Deux fichiers à importer:
- `MasStock-API-Collection.postman_collection.json` (Les requêtes)
- `MasStock-Postman-Environment.postman_environment.json` (Les variables)

### Étape 2: Importe la Collection
1. Ouvre Postman
2. Clique sur **"Import"** (en haut à gauche)
3. Sélectionne **"MasStock-API-Collection.postman_collection.json"**
4. Clique **"Import"**

### Étape 3: Importe l'Environnement
1. Clique sur l'icône **"⚙️ Paramètres"** (en haut à droite)
2. Clique **"Environments"**
3. Clique **"Import"**
4. Sélectionne **"MasStock-Postman-Environment.postman_environment.json"**
5. Clique **"Import"**

### Étape 4: Sélectionne l'Environnement
1. En haut à droite, dans le dropdown
2. Sélectionne **"MasStock Development"**

✅ C'est prêt!

---

## 🧪 Première Requête de Test

### 1. Test de Santé du Backend
1. Dans la collection, ouvre le dossier **"🔐 Authentication"**
2. Clique sur **"Login - User (Estee)"**
3. Clique **"Send"** 🚀

**Tu devrais voir une réponse comme:**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJ...",
    "user": {
      "email": "estee@masstock.com",
      "role": "user"
    }
  }
}
```

### 2. Sauvegarder le Token Automatiquement
Après le login, le token est automatiquement sauvé dans `{{accessToken}}`

Pour vérifier:
1. Clique sur l'onglet **"Environment"** (en haut à droite)
2. Tu devrais voir `accessToken` rempli

---

## 📋 Plan de Test Recommandé

### Jour 1: Authentification ✅
```
1. ✅ Login - User (Estee)
2. ✅ Get Current User (Me)
3. ✅ Login - Admin
4. ✅ Admin Dashboard
5. ✅ Logout
```

### Jour 2: Workflows 🔄
```
1. List All Workflows
2. Get Single Workflow (remplace {{workflowId}} par un ID)
3. Execute Workflow
4. Get Execution Status
5. List Executions
```

### Jour 3: Requests & Tickets 🎯
```
1. Create Workflow Request
2. List Workflow Requests
3. Create Support Ticket
4. List Support Tickets
```

### Jour 4: Admin Features 👨‍💼
```
1. Admin Dashboard
2. List All Clients
3. List All Workflows (admin)
4. View Error Logs
5. View Financial Reports
```

### Jour 5: Error Cases ❌
```
1. Login - Wrong Email (401)
2. Login - Wrong Password (401)
3. Access Without Token (401)
4. Admin Endpoint Without Being Admin (403)
```

---

## 🔑 Variables à Remplir

Après chaque requête réussie, remplace les variables:

| Variable | Source | Comment |
|----------|--------|---------|
| `accessToken` | Réponse Login | Copié automatiquement |
| `refreshToken` | Réponse Login | Copie depuis réponse |
| `workflowId` | Réponse "List Workflows" | Copie un ID |
| `executionId` | Réponse "Execute Workflow" | Copie depuis `execution_id` |
| `userId` | Réponse "Get Me" | Copie depuis `id` |

**Copier une valeur:**
```javascript
// Dans l'onglet "Tests" d'une requête:
pm.environment.set("accessToken", pm.response.json().data.access_token);
```

---

## 🆘 Troubleshooting

### "Network Error" ou "Cannot GET"
```
✅ Le backend est-il en cours d'exécution?
cd /Users/dorian/Documents/MASSTOCK/product/backend
npm run dev
```

### "Unauthorized" (401)
```
✅ Vérifiez que accessToken est bien rempli
✅ Vérifiez que vous utilisez "Bearer {{accessToken}}"
```

### "Forbidden" (403)
```
✅ Vous utilisez un endpoint admin avec un token user?
✅ Utilisez le token admin pour les endpoints /admin/...
```

### Token non sauvegardé
```javascript
// Ajoute un script de test à la requête Login:
if (pm.response.code === 200) {
    var accessToken = pm.response.json().data.access_token;
    pm.environment.set("accessToken", accessToken);
    console.log("✅ Token saved: " + accessToken.substring(0, 20) + "...");
}
```

---

## 📊 Requêtes à Tester en Priorité

### High Priority 🔴
1. **POST /auth/login** ← Commence ici!
2. **GET /auth/me** ← Vérifie le token
3. **GET /workflows** ← Récupère les données
4. **POST /workflows/:id/execute** ← Lance une tâche

### Medium Priority 🟡
5. **GET /admin/dashboard** (si admin token)
6. **GET /admin/clients**
7. **POST /workflow-requests**
8. **POST /support-tickets**

### Low Priority 🟢
9. Error cases (401, 403, 404)
10. Pagination tests
11. Rate limiting tests

---

## 💡 Tips Pro

### Pre-request Script
Ajoute avant chaque requête:
```javascript
// Log les variables
console.log("Using token: " + pm.environment.get("accessToken").substring(0, 30) + "...");
console.log("Base URL: " + pm.environment.get("baseUrl"));
```

### Tests Automatisés
```javascript
// Pour chaque requête, ajoute:
pm.test("Status code is 2xx", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201, 202]);
});

pm.test("Response has success flag", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.equal(true);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.exist;
});
```

### Postman Runner (Tests en batch)
1. Clique sur **"Run"** (en haut)
2. Sélectionne la collection
3. Clique **"Run MasStock API"**
4. Regarde les tests s'exécuter! ✅

---

## 📚 Documentation Complète

Pour plus de détails sur chaque endpoint:
→ Voir `POSTMAN_TEST_GUIDE.md`

---

**Status:** ✅ Prêt pour testing!
**Dernière mise à jour:** 2025-11-16
