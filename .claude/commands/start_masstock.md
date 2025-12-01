# Start MasStock Services

Lance les 3 services essentiels de MasStock de manière propre et sans doublons.

## Services à lancer

1. **Backend API** - Express server sur port 3000
2. **Backend Worker** - Bull queue worker pour jobs asynchrones
3. **Frontend** - Vite dev server sur port 5173

## Étapes d'exécution

### 1. Nettoyage des processus existants

**CRITICAL:** Avant de lancer de nouveaux processus, tu DOIS :

1. **Utiliser BashOutput** pour vérifier le statut de TOUS les shells background actuels
2. **Tuer TOUS les shells** qui exécutent ces commandes (même s'ils sont crashed/killed) :
   - `npm run dev` (backend ou frontend)
   - `npm run worker`
   - `vite`
   - `nodemon`
3. **Vérifier les ports** avec `lsof` et tuer les processus zombies si nécessaire :
   ```bash
   lsof -ti:3000 | xargs kill -9 2>/dev/null || true
   lsof -ti:5173 | xargs kill -9 2>/dev/null || true
   ```

### 2. Lancer les services en background

Lance les 3 services EN PARALLÈLE avec `run_in_background: true` :

```bash
# Backend API
cd /Users/dorian/Documents/MASSTOCK/backend && npm run dev

# Backend Worker
cd /Users/dorian/Documents/MASSTOCK/backend && npm run worker

# Frontend
cd /Users/dorian/Documents/MASSTOCK/frontend && npm run dev
```

**IMPORTANT:**
- Utilise le paramètre `run_in_background: true` pour CHAQUE commande Bash
- Lance les 3 commandes dans UN SEUL message (parallel tool calls)
- Garde les shell IDs pour référence future

### 3. Vérification du démarrage

Après avoir lancé les services, **ATTENDS 5 secondes** puis vérifie avec BashOutput :

1. **Backend API** : Cherche "Server running on port 3000" ou erreur EADDRINUSE
2. **Backend Worker** : Cherche "Worker concurrency set to" ou erreur Redis
3. **Frontend** : Cherche "Local:   http://localhost:5173/" ou erreur de port

### 4. Health check

Vérifie que les services répondent :

```bash
# Backend API health
curl -f http://localhost:3000/health 2>/dev/null && echo "✅ Backend API OK" || echo "❌ Backend API KO"

# Frontend
curl -f http://localhost:5173 2>/dev/null && echo "✅ Frontend OK" || echo "❌ Frontend KO"

# Redis (pour le worker)
redis-cli ping 2>/dev/null && echo "✅ Redis OK" || echo "❌ Redis KO"
```

### 5. Rapport final

Affiche un résumé clair pour l'utilisateur :

```
🚀 MasStock Services Started

✅ Backend API (Shell: xxx)
   Port: 3000
   URL: http://localhost:3000

✅ Backend Worker (Shell: xxx)
   Concurrency: 3 jobs

✅ Frontend (Shell: xxx)
   Port: 5173
   URL: http://localhost:5173

📊 Monitoring
- Use BashOutput with shell IDs to monitor logs
- All services running in background
- No duplicates detected
```

## Gestion des erreurs

Si un service ne démarre pas :

1. **Port occupé (EADDRINUSE)** :
   - Affiche le processus qui occupe le port
   - Propose de le tuer et relancer

2. **Redis non disponible** :
   - Propose de lancer Redis : `redis-server --daemonize yes`

3. **Dépendances manquantes** :
   - Propose d'exécuter `npm install` dans le bon dossier

## Règles critiques

- ❌ JAMAIS lancer de service si un doublon existe déjà
- ✅ TOUJOURS vérifier le statut avec BashOutput avant de déclarer succès
- ✅ TOUJOURS garder les shell IDs pour monitoring futur
- ✅ TOUJOURS lancer les 3 services en parallèle (1 seul message)
- ✅ TOUJOURS afficher les URLs accessibles à l'utilisateur

## Surveillance continue

Après le lancement, tu PEUX (si l'utilisateur le demande) :

- Monitorer les logs avec `BashOutput` périodiquement
- Détecter les crashes et proposer un redémarrage
- Alerter si un service devient non-responsive
