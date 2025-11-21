# 🚀 Quick Start - Batch Nano Banana Workflow

## ✅ Ce qui est fait

Tout le code est prêt! Voici ce qui a été implémenté:

### Backend ✅
- [x] Migration database (table `workflow_batch_results`)
- [x] Services (Gemini API integration)
- [x] Utilities (encryption AES-256-GCM, prompt parser)
- [x] Middleware (file upload - multer)
- [x] Controller & Routes (nano-banana endpoints)
- [x] Queue & Worker (Bull + Redis)
- [x] Server Express configuré

### Frontend ✅
- [x] Page `NanoBananaExecute.jsx` (wizard 4 steps)
- [x] Page `NanoBananaBatchResults.jsx` (grid de résultats)
- [x] Routes ajoutées dans `App.jsx`

### Database ✅
- [x] Migration appliquée
- [x] Bucket Supabase Storage `workflow-results` créé
- [x] RLS policies configurées

### Configuration ✅
- [x] ENCRYPTION_KEY générée

---

## 🔧 Configuration requise

### 1. Ajouter l'ENCRYPTION_KEY au .env

**Backend** (`backend/.env`):
```bash
# Ajouter cette ligne:
ENCRYPTION_KEY=a8b50c7d2194d6df46b1867f8df87d64ad0981948fc7544a051e5f10
```

### 2. Installer Redis

#### MacOS (Homebrew)
```bash
brew install redis
brew services start redis

# Vérifier
redis-cli ping
# Devrait afficher: PONG
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

#### Windows / Alternative: Docker
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### 3. Obtenir une clé API Google Gemini

1. Aller sur [Google AI Studio](https://aistudio.google.com/apikey)
2. Cliquer "Get API Key"
3. Copier la clé (format: `AIza...`)

---

## 🚀 Lancer l'application

### Terminal 1: Backend Server
```bash
cd backend
npm run dev
```

**Output attendu:**
```
🚀 Server running on port 3000
📡 Health check: http://localhost:3000/health
✅ Redis connected
```

### Terminal 2: Worker
```bash
cd backend
npm run worker
```

**Output attendu:**
```
🚀 Workflow worker starting...
✅ Workflow worker ready
```

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

**Output attendu:**
```
  VITE v7.2.2  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🎯 Tester le workflow

### 1. Accéder à l'interface
Ouvrir: `http://localhost:5173/nano-banana`

### 2. Step 1: Configure
- **Google Gemini API Key**: Coller ta clé API
- **Prompts**: Exemple de test:
  ```
  a beautiful sunset over mountains

  a futuristic city at night

  a portrait of a cat wearing sunglasses
  ```
- **Images de référence** (optionnel): Uploader 1-3 images

### 3. Step 2: Review
- Vérifier: 3 prompts détectés
- Coût estimé: $0.12 (3 × $0.039)
- Cliquer "Start Batch Generation"

### 4. Step 3: Processing
- Barre de progression en temps réel
- Polling toutes les 2 secondes
- Stats: Successful / Failed / Remaining

### 5. Step 4: Results
- Voir le résumé final
- Cliquer "View All Results"

### 6. Page de résultats
- Grid de 3 images générées
- Filtres: All / Success / Failed
- Download individuel de chaque image

---

## 🧪 Test avec cURL

### Créer un batch (sans images de référence)
```bash
curl -X POST http://localhost:3000/api/nano-banana/execute \
  -F "api_key=YOUR_GEMINI_API_KEY" \
  -F "prompts_text=a beautiful sunset\n\na futuristic city" \
  -H "Content-Type: multipart/form-data"
```

### Vérifier le statut
```bash
curl http://localhost:3000/api/executions/EXECUTION_ID
```

### Récupérer les résultats
```bash
curl http://localhost:3000/api/executions/EXECUTION_ID/results
```

---

## ⚠️ Troubleshooting

### Worker ne démarre pas
```bash
# Vérifier Redis
redis-cli ping

# Si pas de réponse:
brew services restart redis  # MacOS
sudo systemctl restart redis # Linux
docker restart redis         # Docker
```

### Erreur "ENCRYPTION_KEY must be 64 hex characters"
```bash
# Régénérer la clé
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copier dans backend/.env
```

### Images ne s'affichent pas
```bash
# Vérifier le bucket Supabase
# Aller dans Supabase Dashboard > Storage
# Bucket "workflow-results" doit exister et être public
```

### Frontend ne trouve pas les pages
```bash
# Vérifier que les imports sont corrects dans App.jsx
cd frontend
grep "NanoBanana" src/App.jsx

# Devrait afficher:
# import { NanoBananaExecute } from './pages/NanoBananaExecute'
# import { NanoBananaBatchResults } from './pages/NanoBananaBatchResults'
```

---

## 📊 Monitoring

### Logs en temps réel

#### Backend
```bash
tail -f backend/logs/app.log
```

#### Worker
```bash
# Dans le terminal du worker
# Les logs s'affichent automatiquement
```

#### Redis
```bash
redis-cli
> KEYS workflow-execution:*
> HGETALL bull:workflow-execution:active
```

---

## 💰 Coûts

### Google Gemini API
- **$0.039 par image**
- Gratuit jusqu'à 1500 requêtes/jour (Free tier)
- [Pricing officiel](https://ai.google.dev/pricing)

### Supabase
- Free tier: 500MB storage
- Bandwidth: 2GB/month gratuit

---

## 📝 Prochaines étapes

1. **Tester avec 3 prompts** (gratuit)
2. **Vérifier les résultats** dans Supabase Storage
3. **Tester avec images de référence**
4. **Augmenter à 10-20 prompts** pour voir le scaling

---

## 🛠 Commandes utiles

### Nettoyer Redis
```bash
redis-cli FLUSHDB
```

### Voir les jobs Bull
```bash
redis-cli KEYS bull:workflow-execution:*
```

### Reset database
```bash
cd backend
psql $SUPABASE_URL -c "TRUNCATE workflow_executions CASCADE;"
```

### Rebuild frontend
```bash
cd frontend
npm run build
npm run preview  # Tester la version prod
```

---

## 📚 Documentation complète

Voir `backend/NANO_BANANA_WORKFLOW.md` pour:
- Architecture détaillée
- API endpoints complets
- Sécurité et chiffrement
- Performance et scaling
- Roadmap

---

**Prêt à lancer? 🚀**

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd backend && npm run worker

# Terminal 3
cd frontend && npm run dev
```

Puis ouvrir: **http://localhost:5173/nano-banana**

Bon test! 🎉
