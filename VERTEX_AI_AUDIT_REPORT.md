# Rapport d'Audit - Connexion Vertex AI des Workflows MasStock

**Date:** 2026-01-12
**Configuration actuelle:** `USE_VERTEX_AI=true`
**Projet GCP:** `masstock-484113`
**Credentials:** `/Users/dorian/Documents/MASSTOCK/backend/credentials/vertex-ai-key.json`

---

## 📊 Résumé Exécutif

**Statut Global:** ⚠️ **PARTIELLEMENT CONFIGURÉ**

- ✅ **1 workflow sur 3** utilise correctement Vertex AI
- ❌ **2 workflows sur 3** utilisent encore Google AI Studio (quotas limités)

---

## 🔍 Analyse Détaillée par Workflow

### 1️⃣ Nano Banana Workflow ❌ **NON CONNECTÉ**

**Fichier:** `backend/src/workers/workflow-worker.ts`
**Ligne problématique:** 167

#### Problème Identifié
```typescript
// ❌ INCORRECT - Crée toujours une nouvelle instance GeminiImageService
geminiService = createGeminiImageService(decryptedApiKey);
```

**Impact:**
- ✗ Ignore complètement `USE_VERTEX_AI=true`
- ✗ Utilise **Google AI Studio** (20 RPM max pour Pro models)
- ✗ Limite la scalabilité à ~2-4 utilisateurs simultanés
- ✗ Consomme inutilement les quotas AI Studio alors que Vertex AI est configuré

#### Solution Recommandée
```typescript
// ✅ CORRECT - Utilise le singleton qui respecte USE_VERTEX_AI
import geminiService from '../services/geminiImageService';

// Plus besoin de créer une nouvelle instance
// geminiService est déjà configuré selon USE_VERTEX_AI

// Si un modèle spécifique est nécessaire:
const model = config.model || 'gemini-2.5-flash-image';
geminiService.setModel(model);
```

**Note:** Le service `geminiImageService` (singleton) gère automatiquement le switch Gemini/Vertex selon `USE_VERTEX_AI`.

---

### 2️⃣ Smart Resizer Workflow ✅ **CORRECTEMENT CONNECTÉ**

**Fichier:** `backend/src/services/smartResizerService.ts`
**Ligne:** 14, 596

#### Configuration Actuelle
```typescript
// ✅ CORRECT - Utilise le singleton
import geminiService from './geminiImageService';

// Ligne 596
const result = await geminiService.generateImageWithReference({
  prompt,
  referenceImage,
  aspectRatio,
});
```

**Statut:** 🟢 **FONCTIONNE AVEC VERTEX AI**

**Capacité actuelle:**
- ✓ Utilise Vertex AI si `USE_VERTEX_AI=true`
- ✓ Quotas élevés: 1000 RPM Flash, 500 RPM Pro
- ✓ Supporte ~100+ utilisateurs simultanés

---

### 3️⃣ Room Redesigner Workflow ❌ **NON CONNECTÉ**

**Fichier:** `backend/src/services/roomRedesignerService.ts`
**Lignes problématiques:** 56, 282, 312

#### Problème Identifié
```typescript
// ❌ INCORRECT - Appels directs à l'API Gemini
// Ligne 56
this.apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models';

// Ligne 282
const endpoint = `${this.apiUrl}/${this.model}:generateContent`;

// Ligne 312
const response = await axios.post(
  endpoint,
  requestBody,
  {
    headers: {
      'x-goog-api-key': input.api_key,  // ❌ Utilise une clé API
      'Content-Type': 'application/json',
    },
    timeout: 300000,
  }
);
```

**Impact:**
- ✗ Ignore complètement `USE_VERTEX_AI=true`
- ✗ Fait des appels directs à **Google AI Studio**
- ✗ Utilise une clé API au lieu de Service Account credentials
- ✗ Quotas limités (20 RPM pour Pro)
- ✗ Architecture non maintenable (code dupliqué)

#### Solution Recommandée
```typescript
// ✅ CORRECT - Refactorer pour utiliser geminiService
import geminiService from './geminiImageService';

async redesignRoom(input: RoomRedesignerInput): Promise<RoomRedesignerResult> {
  const prompt = this.buildPrompt({
    design_style: input.design_style,
    season: input.season,
    budget_level: input.budget_level,
  });

  // Utiliser le service unifié
  const result = await geminiService.generateImage(prompt, {
    referenceImages: [{
      data: input.image_base64,
      mimeType: input.image_mime
    }],
    aspectRatio: '1:1'
  });

  if (!result.success) {
    throw new Error(result.error?.message || 'Room redesign failed');
  }

  return {
    success: true,
    image_base64: result.imageData,
    processing_time: result.processingTimeMs,
    prompt_used: prompt
  };
}
```

**Avantages:**
- ✓ Respecte automatiquement `USE_VERTEX_AI`
- ✓ Réutilise le code existant (DRY principle)
- ✓ Retry logic intégré
- ✓ Rate limiting automatique
- ✓ Logging unifié

---

## 🔧 Architecture Actuelle

### Service Layer
```
geminiImageService.ts (singleton)
├─ MODE: test     → MockService
├─ MODE: USE_VERTEX_AI=true  → vertexAIImageService ✅
└─ MODE: default  → GeminiImageService (AI Studio)

vertexAIImageService.ts
├─ SDK: @google-cloud/vertexai
├─ Auth: GOOGLE_APPLICATION_CREDENTIALS
└─ Quotas: 1000 RPM Flash, 500 RPM Pro
```

### Switch Mechanism
```typescript
// backend/src/services/geminiImageService.ts:714-734
const USE_VERTEX_AI = process.env.USE_VERTEX_AI === 'true';

if (process.env.NODE_ENV === 'test') {
  geminiService = mockService.default;
} else if (USE_VERTEX_AI) {
  // ✅ Utilise Vertex AI (quotas élevés)
  const { default: vertexAIService } = require('./vertexAIImageService');
  geminiService = vertexAIService;
  logger.info('🚀 Using Vertex AI for image generation (higher quotas)');
} else {
  // ❌ Utilise Google AI Studio (quotas limités)
  geminiService = new GeminiImageService(GEMINI_API_KEY);
  logger.info('📡 Using Google AI Studio for image generation');
}
```

---

## 📈 Impact sur la Scalabilité

### Configuration Actuelle (Mixte)

| Workflow | API Utilisée | RPM Max (Pro) | Utilisateurs Simultanés |
|----------|--------------|---------------|-------------------------|
| Nano Banana | ❌ AI Studio | 20 | ~2-4 |
| Smart Resizer | ✅ Vertex AI | 500 | ~100+ |
| Room Redesigner | ❌ AI Studio | 20 | ~2-4 |

### Après Corrections (Full Vertex AI)

| Workflow | API Utilisée | RPM Max (Pro) | Utilisateurs Simultanés |
|----------|--------------|---------------|-------------------------|
| Nano Banana | ✅ Vertex AI | 500 | ~100+ |
| Smart Resizer | ✅ Vertex AI | 500 | ~100+ |
| Room Redesigner | ✅ Vertex AI | 500 | ~100+ |

**Gain estimé:** 25x en capacité utilisateurs simultanés

---

## ✅ Plan d'Action Recommandé

### Priorité 1: Corriger Nano Banana (Critical)
**Fichier:** `backend/src/workers/workflow-worker.ts`

```typescript
// AVANT (ligne 167)
geminiService = createGeminiImageService(decryptedApiKey);

// APRÈS
import geminiService from '../services/geminiImageService';
// Supprimer la création d'instance, utiliser directement geminiService
```

**Note:** Le worker Nano Banana n'a plus besoin de la clé API décryptée car Vertex AI utilise Service Account credentials.

### Priorité 2: Corriger Room Redesigner (High)
**Fichier:** `backend/src/services/roomRedesignerService.ts`

1. Supprimer les appels directs à axios
2. Importer et utiliser `geminiService`
3. Adapter la logique pour utiliser `generateImage()`

### Priorité 3: Tests de Non-Régression
```bash
# Tester chaque workflow
npm run test:integration

# Tester spécifiquement les workflows
npm test -- workflow-worker.test.ts
npm test -- roomRedesignerService.test.ts
```

---

## 🎯 Vérification Post-Déploiement

### Commandes de Vérification
```bash
# Vérifier la configuration
grep "USE_VERTEX_AI" backend/.env
grep "GOOGLE_CLOUD_PROJECT" backend/.env

# Tester Vertex AI
npm run test:vertex-ai

# Vérifier les logs au démarrage du worker
grep "Using Vertex AI" backend/logs/combined.log
```

### Logs à Surveiller
```
✅ Bon: "🚀 Using Vertex AI for image generation (higher quotas)"
❌ Mauvais: "📡 Using Google AI Studio for image generation"
```

---

## 🔐 Sécurité

### Clés API vs Service Account

| Aspect | Google AI Studio | Vertex AI |
|--------|------------------|-----------|
| Auth Method | API Key (statique) | Service Account (rotatable) |
| Stockage | Encrypté en DB | Credentials JSON (server-only) |
| Rotation | Manuelle | Automatique via IAM |
| Permissions | Tous Gemini APIs | Granulaire par service |
| Sécurité | ⚠️ Moyenne | ✅ Haute |

**Recommandation:** Migrer complètement vers Vertex AI améliore la posture de sécurité.

---

## 📚 Références

### Documentation Officielle
- [Vertex AI Generative AI](https://cloud.google.com/vertex-ai/generative-ai/docs)
- [Gemini API Quotas](https://ai.google.dev/gemini-api/docs/quota)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts-create)

### Fichiers Clés du Projet
- `backend/src/services/geminiImageService.ts` - Service principal
- `backend/src/services/vertexAIImageService.ts` - Implémentation Vertex AI
- `backend/src/workers/workflow-worker.ts` - Worker Nano Banana
- `backend/src/services/roomRedesignerService.ts` - Service Room Redesigner
- `backend/.env.example` - Template de configuration

---

## 🎬 Conclusion

**État actuel:** Le système est configuré pour Vertex AI mais seulement 1/3 des workflows l'utilisent effectivement.

**Actions requises:**
1. ✅ Smart Resizer: Déjà correct, aucune action
2. ❌ Nano Banana: Refactorer pour utiliser `geminiService` singleton
3. ❌ Room Redesigner: Refactorer pour utiliser `geminiService` singleton

**Bénéfices attendus après correction:**
- 📈 Capacité x25 (de ~4 à ~100 utilisateurs simultanés)
- 💰 Coûts optimisés (quotas inclus dans GCP)
- 🔒 Sécurité améliorée (Service Accounts vs API Keys)
- 🛠️ Code unifié et maintenable

---

**Généré le:** 2026-01-12
**Auteur:** Claude Code Audit System
**Projet:** MasStock - Workflow Automation Platform
