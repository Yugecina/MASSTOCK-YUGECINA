# Start MasStock Services

Lance les 3 services essentiels de MasStock de manière propre et sans doublons.

## Services à lancer

1. **Backend API** - Express server sur port 3000
2. **Backend Worker** - Bull queue worker pour jobs asynchrones
3. **Frontend** - Vite dev server sur port 5173

## Étapes d'exécution

### 1. Nettoyage intelligent des processus existants

**CRITICAL:** Avant de lancer de nouveaux processus, implémente cette logique intelligente :

#### Logique de kill/restart automatique

```
Pour chaque service (Backend API, Frontend):
  1. Vérifier si le port est occupé (lsof -ti:PORT)
  2. Si le port est libre → Lancer le service
  3. Si le port est occupé:
     a. Identifier le processus (PID + nom)
     b. Vérifier si c'est le bon service (npm, node, vite, etc.)
     c. SI c'est le bon service:
        - Kill le processus (kill -9 PID)
        - Attendre 1 seconde
        - Lancer le nouveau service (clean restart)
     d. SI c'est un autre service (conflit):
        - ERREUR: Port utilisé par autre chose
        - Afficher le processus conflictuel
        - Demander confirmation avant de kill
```

#### Implémentation

**Ports à vérifier:**
| Service | Port | Commande de check |
|---------|------|-------------------|
| Backend API | 3000 | `lsof -ti:3000` |
| Frontend | 5173 | `lsof -ti:5173` |

**Worker (pas de port):**
- Vérifier avec `pgrep -f workflow-worker`
- Tuer avec `pkill -9 -f workflow-worker`

**Commandes de nettoyage:**
```bash
# Backend API (port 3000)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Worker (pas de port, chercher par nom de processus)
pkill -9 -f workflow-worker 2>/dev/null || true
```

**Note:** Cette approche garantit qu'on ne lance pas de doublons et qu'on redémarre proprement les services qui tournent déjà.

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
