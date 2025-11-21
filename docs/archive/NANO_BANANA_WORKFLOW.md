# Batch Nano Banana Workflow - Documentation

## Vue d'ensemble

Workflow de génération d'images en batch utilisant l'API **Google Gemini 2.5 Flash Image** (alias "Nano Banana").

### Fonctionnalités
- ✅ Génération batch de 1 à 100 images
- ✅ Support d'images de référence (jusqu'à 3)
- ✅ Chiffrement des clés API Google
- ✅ Suivi de progression en temps réel
- ✅ Stockage sécurisé sur Supabase Storage
- ✅ Statistiques détaillées (succès/échecs/coûts)

## Architecture

### Backend
```
backend/src/
├── config/
│   ├── database.js          # Supabase client
│   ├── redis.js             # Redis config
│   └── logger.js            # Winston logger
├── services/
│   └── geminiImageService.js # API Gemini
├── utils/
│   ├── encryption.js        # Chiffrement AES-256-GCM
│   └── promptParser.js      # Parse prompts multiline
├── middleware/
│   └── upload.js            # Multer (3 images max, 10MB)
├── controllers/
│   └── nanoBananaController.js
├── routes/
│   └── nanoBananaRoutes.js
├── queues/
│   └── workflowQueue.js     # Bull queue
├── workers/
│   └── workflow-worker.js   # Process batch
└── server.js
```

### Frontend
```
frontend/src/pages/
├── NanoBananaExecute.jsx        # 4-step wizard
└── NanoBananaBatchResults.jsx   # Grid de résultats
```

### Database
```sql
workflows                 # Workflow "Batch Nano Banana"
workflow_executions       # Exécutions
workflow_batch_results    # Résultats par prompt
```

## Configuration

### 1. Backend (.env)

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Server
PORT=3000
NODE_ENV=development

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Security
ENCRYPTION_KEY=a8b50c7d2194d6df46b1867f8df87d64ad0981948fc7544a1b1ab64a051e5f10

# CORS
CORS_ORIGIN=http://localhost:5173
```

### 2. Frontend (.env)

```bash
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Lancement

### 1. Backend

```bash
cd backend

# Installer dépendances
npm install

# Lancer le serveur
npm run dev

# Lancer le worker (dans un autre terminal)
npm run worker
```

### 2. Frontend

```bash
cd frontend

# Installer dépendances
npm install

# Lancer Vite
npm run dev
```

### 3. Redis (requis)

```bash
# MacOS avec Homebrew
brew install redis
brew services start redis

# Ou Docker
docker run -d -p 6379:6379 redis:alpine
```

## Utilisation

### 1. Accéder au workflow
- URL: `http://localhost:5173/nano-banana`

### 2. Step 1: Configure
- **Google Gemini API Key**: Obtenir sur [Google AI Studio](https://aistudio.google.com/apikey)
- **Prompts**: Un prompt par paragraphe (séparer par `\n\n`)
- **Images de référence** (optionnel): Max 3 images, 10MB chacune

### 3. Step 2: Review
- Vérifier le nombre de prompts
- Voir le coût estimé ($0.039 × nombre de prompts)

### 4. Step 3: Processing
- Barre de progression en temps réel
- Stats live: Completed / Failed / Remaining

### 5. Step 4: Results
- Voir les statistiques finales
- Bouton "View All Results" → page de résultats

### 6. Page de résultats
- Grid de toutes les images générées
- Filtres: All / Success / Failed
- Téléchargement individuel

## Format des prompts

```
a beautiful sunset over mountains

a futuristic city at night

a portrait of a cat wearing sunglasses
```

**Important**: Séparer chaque prompt par **double saut de ligne** (`\n\n`)

## API Endpoints

### POST `/api/nano-banana/execute`
Crée et lance un batch

**Request:**
```bash
curl -X POST http://localhost:3000/api/nano-banana/execute \
  -F "api_key=YOUR_GEMINI_API_KEY" \
  -F "prompts_text=prompt1\n\nprompt2" \
  -F "reference_images=@image1.jpg" \
  -F "reference_images=@image2.png"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "uuid",
    "workflow_id": "uuid",
    "status": "pending",
    "total_prompts": 2,
    "estimated_cost": {
      "totalCost": 0.08,
      "costPerImage": 0.039,
      "imageCount": 2
    }
  }
}
```

### GET `/api/executions/:executionId`
Récupère le statut d'une exécution

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "processing",
    "stats": {
      "total_prompts": 10,
      "successful": 7,
      "failed": 1,
      "pending": 2,
      "completion_percentage": 80,
      "total_cost": 0.27
    }
  }
}
```

### GET `/api/executions/:executionId/results`
Récupère tous les résultats individuels

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "batch_index": 0,
      "prompt_text": "a beautiful sunset",
      "status": "completed",
      "result_url": "https://...",
      "processing_time_ms": 3245,
      "api_cost": 0.039
    }
  ]
}
```

## Sécurité

### Chiffrement des clés API
- **Algorithme**: AES-256-GCM
- **Clé**: 32 bytes (64 hex chars)
- **Stockage**: JSONB `workflows.config.api_key_encrypted`

```javascript
const encrypted = encryptApiKey(apiKey);
// {
//   encrypted: "...",
//   iv: "...",
//   authTag: "...",
//   salt: "..."
// }
```

### RLS Policies
- Clients ne voient que leurs propres workflows
- Admins voient tout
- Storage public (lecture seule)

## Coûts

### Gemini 2.5 Flash Image
- **$0.039 par image** (1,290 output tokens)
- 10 prompts = $0.39
- 100 prompts = $3.90

### Stockage Supabase
- Images stockées dans bucket `workflow-results`
- ~500KB par image PNG
- Bucket public (lecture seule)

## Troubleshooting

### Worker ne démarre pas
```bash
# Vérifier Redis
redis-cli ping
# Devrait retourner "PONG"
```

### Images ne s'uploadent pas
```bash
# Vérifier le bucket Supabase
SELECT * FROM storage.buckets WHERE id = 'workflow-results';

# Vérifier les policies
SELECT * FROM storage.policies WHERE bucket_id = 'workflow-results';
```

### Erreur "Invalid API key"
- Vérifier que la clé Gemini est valide
- Tester sur [Google AI Studio](https://aistudio.google.com/)
- Vérifier `ENCRYPTION_KEY` est bien configuré

### Worker échoue avec erreur décryption
- Régénérer `ENCRYPTION_KEY`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- Mettre à jour dans `.env`
- **Important**: Ré-exécuter le workflow (anciennes clés incompatibles)

## Performance

### Optimisations
- **Chunking**: Process 10 prompts à la fois (configurable)
- **Retry logic**: 3 tentatives avec backoff exponentiel
- **Timeout**: 60s par génération
- **Concurrence**: Worker scalable (lancer plusieurs instances)

### Monitoring
```bash
# Logs du worker
tail -f logs/worker.log

# Stats Redis
redis-cli
> INFO stats

# Bull queue dashboard (optionnel)
npm install -g bull-board
```

## Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js | 18+ |
| Framework | Express.js | 4.18 |
| Database | Supabase | PostgreSQL 15 |
| Queue | Bull | 4.12 |
| Cache | Redis | 7.x |
| Storage | Supabase Storage | - |
| Frontend | React | 19.2 |
| Build | Vite | 7.2 |
| API | Google Gemini | 2.5 Flash Image |

## Roadmap

- [ ] Support de modèles alternatifs (DALL-E, Stable Diffusion)
- [ ] Download ZIP de tous les résultats
- [ ] Webhooks de notification
- [ ] Analytics et graphiques de performance
- [ ] Rate limiting par utilisateur
- [ ] Support d'aspect ratios personnalisés

---

**Créé le**: 2025-11-17  
**Version**: 1.0.0  
**Auteur**: Claude Code
