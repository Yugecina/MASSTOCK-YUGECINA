# Nano Banana Workflow - Corrections Appliquées

## 🔍 Problème Initial

Le workflow Nano Banana échouait systématiquement avec l'erreur :
```
Gemini image generation failed: "No image data found in response"
```

## 🕵️ Analyse des Causes

### 1. **Problème de structure de réponse API**
- L'API Gemini retourne `inlineData` (camelCase) et non `inline_data` (snake_case)
- Le code ne supportait que le format snake_case
- **Fichier affecté**: `backend/src/services/geminiImageService.js:251-295`

### 2. **Manque de logging détaillé**
- Pas de logs pour debugger la structure réelle de la réponse API
- Impossible de voir les erreurs HTTP détaillées
- Pas de visibilité sur le déchiffrement de la clé API

### 3. **Validation insuffisante**
- Pas de vérification de la présence de la clé API chiffrée
- Pas de validation du déchiffrement
- Messages d'erreur peu informatifs

## ✅ Corrections Appliquées

### 1. Support des deux formats de réponse API (backend/src/services/geminiImageService.js:251-295)

**Avant** :
```javascript
const imagePart = parts.find(part => part.inline_data);
if (!imagePart || !imagePart.inline_data) {
  throw new Error('No image data found in response');
}
return {
  data: imagePart.inline_data.data,
  mimeType: imagePart.inline_data.mime_type
};
```

**Après** :
```javascript
// Support both inline_data and inlineData formats
const imagePart = parts.find(part => part.inline_data || part.inlineData);
if (!imagePart) {
  logger.error('No image part found', {
    partsCount: parts.length,
    partKeys: parts.map(p => Object.keys(p))
  });
  throw new Error('No image data found in response');
}

const inlineData = imagePart.inline_data || imagePart.inlineData;
return {
  data: inlineData.data,
  mimeType: inlineData.mime_type || inlineData.mimeType || 'image/png'
};
```

### 2. Ajout de logging détaillé (backend/src/services/geminiImageService.js:177-244)

**Logging des requêtes** :
```javascript
logger.debug('Making Gemini API request', {
  url,
  attempt,
  payloadSize: JSON.stringify(payload).length,
  hasApiKey: !!this.apiKey,
  apiKeyLength: this.apiKey?.length
});
```

**Logging des réponses** :
```javascript
logger.debug('Gemini API response received', {
  status: response.status,
  hasData: !!response.data,
  dataKeys: response.data ? Object.keys(response.data) : []
});
```

**Logging des erreurs détaillées** :
```javascript
logger.error('Gemini API request error', {
  error: error.message,
  statusCode: error.response?.status,
  statusText: error.response?.statusText,
  responseData: error.response?.data,
  hasResponse: !!error.response,
  code: error.code
});
```

**Logging de la structure de réponse** :
```javascript
logger.debug('Gemini API response structure', {
  hasCandidates: !!responseData.candidates,
  candidatesCount: responseData.candidates?.length,
  firstCandidateKeys: responseData.candidates?.[0] ? Object.keys(responseData.candidates[0]) : [],
  fullResponse: JSON.stringify(responseData, null, 2).substring(0, 500)
});
```

### 3. Validation de la clé API dans le worker (backend/src/workers/workflow-worker.js:12-31)

**Ajout de validations** :
```javascript
logger.debug('Processing Nano Banana workflow', {
  executionId,
  hasEncryptedKey: !!config.api_key_encrypted,
  encryptedKeyLength: config.api_key_encrypted?.length,
  configKeys: Object.keys(config)
});

if (!config.api_key_encrypted) {
  throw new Error('Missing API key in workflow config. Please provide api_key when executing the workflow.');
}

const decryptedApiKey = decryptApiKey(config.api_key_encrypted);

logger.debug('API key decrypted', {
  hasDecryptedKey: !!decryptedApiKey,
  decryptedKeyLength: decryptedApiKey?.length
});
```

### 4. Scripts de test créés

#### `backend/scripts/test-gemini-api.js`
Test direct de l'API Gemini pour valider la connexion et la génération d'images.

**Usage** :
```bash
export GEMINI_API_KEY="your-api-key"
cd backend
node scripts/test-gemini-api.js
```

#### `backend/scripts/test-nano-workflow.js`
Test end-to-end complet du workflow Nano Banana via l'API REST.

**Usage** :
```bash
export GEMINI_API_KEY="your-api-key"
cd backend
node scripts/test-nano-workflow.js
```

## 🧪 Tests Recommandés

### 1. Test direct de l'API Gemini
```bash
cd backend
export GEMINI_API_KEY="votre-clé-api"
node scripts/test-gemini-api.js
```

**Résultat attendu** :
- ✅ Image générée avec succès
- Image sauvegardée dans `/tmp/gemini-test-image.png`
- Logs détaillés de la requête/réponse

### 2. Test du workflow complet
```bash
cd backend
export GEMINI_API_KEY="votre-clé-api"
node scripts/test-nano-workflow.js
```

**Résultat attendu** :
- ✅ Login réussi
- ✅ Workflow trouvé
- ✅ Exécution lancée
- ✅ Statut : completed
- ✅ Images générées disponibles

### 3. Test via l'interface (si frontend disponible)
1. Se connecter avec un compte client
2. Aller sur "Workflows" → "Batch Nano Banana"
3. Saisir des prompts (un par ligne)
4. Fournir la clé API Gemini
5. Lancer l'exécution
6. Vérifier les résultats dans l'onglet "Executions"

## 📋 Checklist de Vérification

- [x] Support des formats camelCase et snake_case pour les réponses API
- [x] Logging détaillé des requêtes/réponses Gemini
- [x] Validation de la clé API dans le worker
- [x] Messages d'erreur informatifs
- [x] Scripts de test créés
- [ ] **À FAIRE** : Tester avec une vraie clé API Gemini
- [ ] **À FAIRE** : Vérifier les logs en production
- [ ] **À FAIRE** : Ajouter des tests unitaires pour geminiImageService

## 🔑 Configuration Requise

### Variables d'environnement (backend/.env)

**Pour les tests directs** :
```env
GEMINI_API_KEY=votre-clé-api-google
```

**Pour le workflow** :
La clé API est fournie par le client lors de l'exécution via le formulaire (elle est chiffrée et stockée temporairement).

## 📊 Monitoring

### Logs à surveiller

**Succès** :
```
[info]: Gemini image generated successfully
[info]: Workflow execution completed
```

**Échecs possibles** :
```
[error]: Gemini API request error - Clé API invalide
[error]: No image data found in response - Format de réponse inattendu
[error]: Missing API key in workflow config - Clé non fournie
```

## 🚀 Prochaines Étapes

1. **Tester avec une clé API Gemini valide**
   ```bash
   export GEMINI_API_KEY="votre-clé-réelle"
   node scripts/test-gemini-api.js
   ```

2. **Vérifier les logs en temps réel**
   ```bash
   # Terminal 1 - Worker
   cd backend
   node src/workers/workflow-worker.js

   # Terminal 2 - Exécution du test
   node scripts/test-nano-workflow.js
   ```

3. **Analyser les résultats**
   - Vérifier les images générées dans Supabase Storage
   - Consulter la table `workflow_batch_results`
   - Vérifier les statistiques dans `workflow_executions`

## 📝 Notes Importantes

- **Coût**: $0.039 par image (1290 tokens de sortie)
- **Timeout**: 60 secondes par requête (configurable)
- **Retries**: 3 tentatives max avec délai exponentiel
- **Ratio d'aspect supporté**: 1:1, 16:9, 9:16, 4:3, 3:4
- **Images de référence**: Maximum 3 par génération
- **Format de sortie**: PNG par défaut (base64)

## 🔗 Ressources

- [Documentation Gemini Image API](https://ai.google.dev/gemini-api/docs/image-generation)
- [Code source geminiImageService.js](backend/src/services/geminiImageService.js)
- [Code source workflow-worker.js](backend/src/workers/workflow-worker.js)
- [Migration Nano Banana](backend/database/migrations/009_nano_banana_workflow.sql)
