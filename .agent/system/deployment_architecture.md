# MasStock - Deployment Architecture

**Last Updated:** 2025-12-18
**Status:** Production Active
**Version:** 1.0

---

## Table of Contents

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture des containers](#architecture-des-containers)
3. [Flux des requêtes](#flux-des-requêtes)
4. [Attribution des ports](#attribution-des-ports)
5. [Health checks](#health-checks)
6. [Politique de redémarrage](#politique-de-redémarrage)
7. [Sécurité](#sécurité)
8. [CORS (Defense in Depth)](#cors-defense-in-depth)
9. [Troubleshooting](#troubleshooting)
10. [Commandes utiles](#commandes-utiles)

---

## Vue d'ensemble

MasStock est déployé sur un VPS avec Docker Compose. L'architecture sépare clairement:
- **Reverse proxy**: Nginx VPS (SSL termination, routing des domaines)
- **Application tier**: Containers Docker (frontend, backend, worker)
- **Data tier**: Redis + Supabase (PostgreSQL)

### Domaines et services

| Domaine | Service | Container | Port |
|---------|---------|-----------|------|
| `masstock.fr` | Landing page | `masstock_vitrine` | 8081 |
| `app.masstock.fr` | Application React | `masstock_app` | 8080 |
| `api.masstock.fr` | Backend Express | `masstock_api` | 3000 |
| `n8n.masstock.fr` | n8n automation | `masstock_n8n` | 5678 |

---

## Architecture des containers

### Schéma global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                    │
│                         (Users + External APIs)                          │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
                 ┌─────────────────┴──────────────────┐
                 │         VPS NGINX                  │
                 │  - SSL Termination (Let's Encrypt)│
                 │  - Domain routing                  │
                 │  - Security headers                │
                 │  - Rate limiting (optional)        │
                 │  - CORS preflight handling         │
                 └─────────────────┬──────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         │     localhost:8081      │ localhost:8080     localhost:3000
         │     (vitrine)           │ (app)               (api)
         │                         │                         │
    ┌────▼────────────────────────▼─────────────────────────▼───────────┐
    │                                                                    │
    │                    DOCKER NETWORK                                 │
    │                  (masstock_network)                               │
    │                                                                    │
    │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐│
    │  │  masstock_vitrine│  │   masstock_app   │  │   masstock_api   ││
    │  │                  │  │                  │  │                  ││
    │  │  Nginx + React   │  │  Nginx + React   │  │  Node.js Express ││
    │  │  (landing page)  │  │  (SPA)           │  │  + Auth          ││
    │  │                  │  │                  │  │  + Workflows     ││
    │  │  Port: 80        │  │  Port: 80        │  │  Port: 3000      ││
    │  └──────────────────┘  └──────────────────┘  └────────┬─────────┘│
    │                                                        │          │
    │                                                        │          │
    │  ┌──────────────────┐  ┌──────────────────┐          │          │
    │  │  masstock_worker │  │  masstock_redis  │◄─────────┘          │
    │  │                  │  │                  │                      │
    │  │  Bull Jobs       │  │  Redis 7 Alpine  │                      │
    │  │  + Gemini API    │  │  + AOF Persist   │                      │
    │  │                  │  │                  │                      │
    │  │  No port         │  │  Port: 6379      │                      │
    │  └────────┬─────────┘  └──────────────────┘                      │
    │           │                                                       │
    │           └──────────────────┐                                    │
    │                              │                                    │
    └──────────────────────────────┼────────────────────────────────────┘
                                   │
                                   ▼
                          Supabase PostgreSQL
                          (External managed service)
```

### Containers détaillés

| Container | Image | Restart Policy | Depends On | Volumes |
|-----------|-------|----------------|------------|---------|
| `masstock_redis` | `redis:7-alpine` | `unless-stopped` | - | `redis_data:/data` |
| `masstock_api` | Custom (backend/Dockerfile) | `unless-stopped` | redis (healthy) | `logs:/app/logs`<br>`uploads:/app/uploads` |
| `masstock_worker` | Custom (backend/Dockerfile) | `unless-stopped` | redis (healthy)<br>api (healthy) | `logs:/app/logs` |
| `masstock_app` | Custom (nginx/Dockerfile) | `unless-stopped` | api | `nginx.conf:/etc/nginx/nginx.conf`<br>`conf.d:/etc/nginx/conf.d`<br>`dist:/usr/share/nginx/html` |
| `masstock_vitrine` | Custom (frontend-vitrine/Dockerfile) | `unless-stopped` | - | (static build inside image) |

---

## Flux des requêtes

### 1. Requête HTTP/HTTPS classique

```
┌─────────────────────────────────────────────────────────────┐
│  USER navigates to https://app.masstock.fr                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DNS Resolution: app.masstock.fr → VPS IP               │
│  2. VPS Nginx (port 443)                                    │
│     ├─ SSL Termination (certbot certificate)               │
│     ├─ Security headers (HSTS, CSP, etc.)                  │
│     └─ Proxy to localhost:8080                             │
│  3. Container masstock_app (nginx)                          │
│     ├─ Serves React SPA from /usr/share/nginx/html         │
│     ├─ SPA routing (try_files $uri /index.html)            │
│     └─ Returns HTML + static assets                        │
│  4. Browser loads React app                                 │
│  5. React makes API calls to https://api.masstock.fr       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Requête API avec authentification

```
┌─────────────────────────────────────────────────────────────┐
│  USER clicks "Login" in React app                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PREFLIGHT OPTIONS (CORS check)                          │
│     ┌────────────────────────────────────────────────┐     │
│     │  Browser → api.masstock.fr/api/v1/auth/login   │     │
│     │  Method: OPTIONS                                │     │
│     │  Headers:                                       │     │
│     │    Origin: https://app.masstock.fr             │     │
│     │    Access-Control-Request-Method: POST         │     │
│     └────────────────┬───────────────────────────────┘     │
│                      │                                      │
│                      ▼                                      │
│     ┌────────────────────────────────────────────────┐     │
│     │  VPS Nginx (api.masstock.fr)                   │     │
│     │  ├─ if ($request_method = 'OPTIONS')           │     │
│     │  │    return 204 with CORS headers             │     │
│     │  │    (instant response, no backend hit)       │     │
│     └────────────────┬───────────────────────────────┘     │
│                      │                                      │
│                      ▼                                      │
│     ┌────────────────────────────────────────────────┐     │
│     │  Browser receives:                             │     │
│     │    Access-Control-Allow-Origin: app.masstock.fr│     │
│     │    Access-Control-Allow-Methods: POST          │     │
│     │    Access-Control-Allow-Credentials: true      │     │
│     │  ✅ CORS check passed                          │     │
│     └────────────────────────────────────────────────┘     │
│                                                             │
│  2. ACTUAL POST REQUEST                                     │
│     ┌────────────────────────────────────────────────┐     │
│     │  Browser → api.masstock.fr/api/v1/auth/login   │     │
│     │  Method: POST                                   │     │
│     │  Headers: Origin, Content-Type: application/json│    │
│     │  Body: {"email": "...", "password": "..."}     │     │
│     └────────────────┬───────────────────────────────┘     │
│                      │                                      │
│                      ▼                                      │
│     ┌────────────────────────────────────────────────┐     │
│     │  VPS Nginx                                     │     │
│     │  ├─ proxy_pass http://localhost:3000           │     │
│     │  ├─ proxy_set_header Host, X-Real-IP, etc.    │     │
│     │  └─ proxy_pass_header Access-Control-*        │     │
│     └────────────────┬───────────────────────────────┘     │
│                      │                                      │
│                      ▼                                      │
│     ┌────────────────────────────────────────────────┐     │
│     │  masstock_api (Express)                        │     │
│     │  ├─ CORS middleware validates origin           │     │
│     │  ├─ Zod validates body                         │     │
│     │  ├─ Supabase auth.signInWithPassword()         │     │
│     │  ├─ Sets httpOnly cookies (access + refresh)   │     │
│     │  └─ Returns {user, session}                    │     │
│     └────────────────┬───────────────────────────────┘     │
│                      │                                      │
│                      ▼                                      │
│     ┌────────────────────────────────────────────────┐     │
│     │  Browser receives:                             │     │
│     │    Set-Cookie: access_token=... (httpOnly)     │     │
│     │    Set-Cookie: refresh_token=... (httpOnly)    │     │
│     │    Access-Control-Allow-Credentials: true      │     │
│     │  ✅ User logged in                             │     │
│     └────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Workflow asynchrone (Bull worker)

```
┌─────────────────────────────────────────────────────────────┐
│  USER triggers workflow execution                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. API receives POST /api/v1/executions                    │
│     ├─ Validates input (Zod)                                │
│     ├─ Creates execution in Supabase (status: pending)      │
│     └─ Pushes job to Redis queue                           │
│                                                             │
│  2. Redis stores job                                        │
│     ├─ Queue: bull:workflow-queue:wait                      │
│     ├─ Job data: {executionId, prompts, config}            │
│     └─ Priority: normal (or high for premium users)        │
│                                                             │
│  3. Worker picks up job (concurrency: 3)                    │
│     ├─ masstock_worker polls Redis queue                    │
│     ├─ Locks job (prevents duplicate processing)           │
│     ├─ Updates execution status → "processing"             │
│     └─ Begins processing                                   │
│                                                             │
│  4. Worker processes workflow                               │
│     ├─ For each prompt:                                    │
│     │   ├─ Rate limiter check (Gemini API limits)          │
│     │   ├─ Call Gemini API (generate image)                │
│     │   ├─ Store result in Supabase                        │
│     │   └─ Update job progress                             │
│     └─ All prompts processed                               │
│                                                             │
│  5. Worker finalizes job                                    │
│     ├─ Updates execution status → "completed"              │
│     ├─ Logs success/failures                               │
│     ├─ Removes job from Redis (removeOnComplete: true)     │
│     └─ Job done ✅                                          │
│                                                             │
│  6. User polls API for status                               │
│     ├─ GET /api/v1/executions/:id (every 2s from frontend) │
│     └─ Displays results when status = "completed"          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Attribution des ports

### Environnement de développement (local)

| Service | Port | Commande | Check |
|---------|------|----------|-------|
| Backend API | 3000 | `npm run dev` (backend/) | `curl localhost:3000/health` |
| Backend Worker | - | `npm run worker` (backend/) | `pgrep -f workflow-worker` |
| Frontend App | 5173 | `npm run dev` (frontend/) | `curl localhost:5173` |
| Landing Page | 5174 | `npm run dev` (frontend-vitrine/) | `curl localhost:5174` |
| Redis | 6379 | `redis-server` | `redis-cli ping` |

### Environnement de production (VPS)

| Service | Container Port | Host Port | VPS Nginx Route |
|---------|----------------|-----------|-----------------|
| Vitrine | 80 | 8081 | masstock.fr → :8081 |
| App | 80 | 8080 | app.masstock.fr → :8080 |
| API | 3000 | 3000 | api.masstock.fr → :3000 |
| Worker | - | - | (internal only) |
| Redis | 6379 | - | (internal only) |
| n8n | 5678 | 5678 | n8n.masstock.fr → :5678 |

### Vérification des ports

```bash
# Développement local
lsof -i:3000   # Backend API
lsof -i:5173   # Frontend
lsof -i:6379   # Redis

# Production (VPS)
sudo lsof -i:80    # Nginx HTTP
sudo lsof -i:443   # Nginx HTTPS
sudo lsof -i:3000  # API container
sudo lsof -i:8080  # App container
sudo lsof -i:8081  # Vitrine container

# Docker containers
docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

---

## Health checks

### Configuration Docker Compose

| Container | Command | Interval | Timeout | Retries | Start Period |
|-----------|---------|----------|---------|---------|--------------|
| redis | `redis-cli ping` | 10s | 3s | 5 | - |
| api | `wget --spider localhost:3000/health` | 30s | 10s | 3 | 40s |
| worker | ioredis ping via Node.js | 30s | 10s | 3 | 40s |
| app | `wget --spider localhost:80/health` | 30s | 10s | 3 | - |
| vitrine | `wget --spider localhost:80/` | 30s | 10s | 3 | - |

### Health endpoints

**Backend API** (`/health`):
```json
{
  "status": "ok",
  "timestamp": "2025-12-18T19:31:46.923Z"
}
```

**Frontend App** (`/health`):
```
healthy
```

### Commandes de vérification manuelle

```bash
# Local
curl http://localhost:3000/health
curl http://localhost:5173/health

# Production (from inside VPS)
curl http://localhost:3000/health
curl http://localhost:8080/health
curl http://localhost:8081/

# Production (from internet)
curl https://api.masstock.fr/health
curl https://app.masstock.fr/health
curl https://masstock.fr/
```

---

## Politique de redémarrage

### Restart policy: `unless-stopped`

Tous les containers utilisent `restart: unless-stopped`, ce qui signifie:

✅ **Redémarre automatiquement si:**
- Le container crash (code exit non-zero)
- Le démon Docker redémarre (reboot VPS)
- Une erreur interne survient

❌ **NE redémarre PAS si:**
- L'utilisateur stoppe le container (`docker stop masstock_api`)
- Le container est arrêté proprement via docker-compose down

### Ordre de démarrage (depends_on)

```yaml
┌──────────────┐
│ masstock_    │  (aucune dépendance)
│ redis        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ masstock_    │  depends_on: redis (healthy)
│ api          │
└──────┬───────┘
       │
       ├───────────────────┐
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ masstock_    │    │ masstock_    │
│ worker       │    │ app          │
└──────────────┘    └──────────────┘

depends_on:          depends_on:
- redis (healthy)    - api
- api (healthy)
```

### Comportement en cas de crash

#### Scénario 1: API crash

```
1. masstock_api s'arrête (exit code 1)
2. Docker détecte l'arrêt immédiatement
3. Docker redémarre masstock_api (restart: unless-stopped)
4. Health check démarre après 40s (start_period)
5. Health check réussit après ~2-3 secondes (app.listen)
6. masstock_worker reprend les jobs en queue
7. Services opérationnels ✅
```

#### Scénario 2: Redis crash

```
1. masstock_redis s'arrête (exit code 1)
2. Docker redémarre masstock_redis
3. masstock_api perd la connexion Redis temporairement
   ├─ Queue jobs échouent pendant ~10-20s
   └─ Bull retry automatique après reconnexion
4. masstock_worker perd la connexion Redis
   ├─ Attend la reconnexion (Bull reconnect automatique)
   └─ Reprend le processing des jobs
5. Redis AOF restore les données persistées
6. Services opérationnels ✅
```

#### Scénario 3: Worker crash

```
1. masstock_worker s'arrête (exit code 1)
2. Docker redémarre masstock_worker
3. Jobs en cours sont remis en queue par Redis (job timeout)
4. Worker reprend les jobs en attente
5. Pas d'impact sur l'API ou le frontend ✅
```

### Commandes de gestion

```bash
# Vérifier le statut de tous les containers
docker ps -a

# Vérifier les restart counts
docker inspect masstock_api | grep RestartCount

# Restart manuel d'un service
docker-compose -f docker-compose.production.yml restart api

# Restart de tous les services
docker-compose -f docker-compose.production.yml restart

# Logs d'un container (dernières 100 lignes)
docker logs --tail 100 masstock_api

# Logs en temps réel (follow)
docker logs -f masstock_api
```

---

## Sécurité

### SSL/TLS

**Termination:** VPS Nginx (Let's Encrypt certbot)
**Renouvellement:** Automatique via cron (`certbot renew`)

```bash
# Vérifier les certificats
sudo certbot certificates

# Renouveler manuellement
sudo certbot renew --dry-run

# Forcer le renouvellement
sudo certbot renew --force-renewal
```

**Configuration SSL (nginx):**
```nginx
# Ajouté par certbot dans /etc/nginx/sites-available/masstock.conf
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/masstock.fr/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/masstock.fr/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
```

### Headers de sécurité (VPS Nginx)

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### Cookies sécurisés

```typescript
// backend/src/controllers/authController.ts
const cookieOptions = {
  httpOnly: true,                           // Protège contre XSS
  secure: process.env.NODE_ENV === 'production', // HTTPS only en prod
  sameSite: 'lax' as const,                 // Protège contre CSRF
  maxAge: 15 * 60 * 1000                    // 15 minutes (access_token)
};
```

### Rate limiting

**Backend Express (middleware):**
```typescript
// backend/src/middleware/rateLimit.ts
general: 100 requests / 60s per IP
auth: 5 requests / 60s per IP
```

**Nginx (optionnel):**
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

### Variables d'environnement sensibles

**JAMAIS commiter:**
- `.env`
- `.env.production`
- `backend/.env.production`

**Protection Git:**
```gitignore
.env
.env.local
.env.production
*.env
```

**Génération sécurisée:**
```bash
# JWT secret (64 bytes)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Redis password (32 bytes base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Encryption key (32 bytes hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## CORS (Defense in Depth)

### Stratégie à deux niveaux

MasStock implémente une stratégie **Defense in Depth** pour CORS:

1. **Niveau 1: VPS Nginx** - Gère les preflight OPTIONS
2. **Niveau 2: Backend Express** - Valide toutes les requêtes

### Niveau 1: VPS Nginx

**Configuration:** `deploy/setup-nginx-vps.sh`

```nginx
location / {
    # Handle preflight OPTIONS at nginx level
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' 'https://app.masstock.fr' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, PATCH, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, X-Requested-With' always;
        add_header 'Access-Control-Max-Age' 86400 always;
        add_header 'Content-Length' 0;
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        return 204;
    }

    # Pass through CORS headers from backend
    proxy_pass_header Access-Control-Allow-Origin;
    proxy_pass_header Access-Control-Allow-Credentials;
    proxy_pass_header Access-Control-Allow-Methods;
    proxy_pass_header Access-Control-Allow-Headers;
}
```

**Avantages:**
- ✅ Preflight OPTIONS ne hit pas le backend (performance)
- ✅ Cache 24h (`max-age: 86400`)
- ✅ Nginx répond immédiatement avec 204 No Content

### Niveau 2: Backend Express

**Configuration:** `backend/src/server.ts`

```typescript
const corsOptions = {
  origin: [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3002'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Explicit OPTIONS handling
```

**Avantages:**
- ✅ Double validation (Nginx peut échouer à bloquer)
- ✅ Gère les requêtes directes au backend (bypass Nginx)
- ✅ Facile à tester en local

### Test CORS

```bash
# Test preflight OPTIONS
curl -X OPTIONS https://api.masstock.fr/api/v1/auth/login \
  -H "Origin: https://app.masstock.fr" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control"

# Résultat attendu:
# < HTTP/1.1 204 No Content
# < Access-Control-Allow-Origin: https://app.masstock.fr
# < Access-Control-Allow-Credentials: true
# < Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# < Access-Control-Max-Age: 86400

# Test requête POST
curl -X POST https://api.masstock.fr/api/v1/auth/login \
  -H "Origin: https://app.masstock.fr" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' \
  -v 2>&1 | grep -i "access-control"

# Résultat attendu:
# < Access-Control-Allow-Origin: https://app.masstock.fr
# < Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### 1. Service ne démarre pas

**Symptômes:**
- Container en état "Restarting" ou "Exited"
- Health check échoue

**Diagnostic:**
```bash
# Vérifier les logs
docker logs masstock_api --tail 100

# Vérifier le statut
docker ps -a | grep masstock

# Vérifier les dépendances
docker inspect masstock_api | grep -A 10 "DependsOn"

# Vérifier le health check
docker inspect masstock_api | grep -A 20 "Health"
```

**Solutions courantes:**
- Redis non démarré → `docker-compose up -d redis`
- Port déjà utilisé → `lsof -ti:3000 | xargs kill -9`
- Variables d'environnement manquantes → Vérifier `.env.production`
- Image non buildée → `docker-compose build api`

### 2. CORS errors

**Symptômes:**
- Erreur dans la console navigateur: "blocked by CORS policy"
- Preflight OPTIONS retourne 404 ou 500

**Diagnostic:**
```bash
# Tester preflight
curl -X OPTIONS https://api.masstock.fr/api/v1/auth/login \
  -H "Origin: https://app.masstock.fr" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Vérifier logs Nginx
sudo tail -f /var/log/nginx/masstock-api-error.log

# Vérifier logs backend
docker logs masstock_api | grep -i cors
```

**Solutions:**
- Vérifier `CORS_ORIGIN` dans `.env.production` (doit être `https://app.masstock.fr`)
- Nginx config manquante → Relancer `setup-nginx-vps.sh`
- Backend CORS mal configuré → Vérifier `backend/src/server.ts`

### 3. Worker ne traite pas les jobs

**Symptômes:**
- Executions restent en statut "pending"
- Pas de logs worker

**Diagnostic:**
```bash
# Vérifier worker running
docker ps | grep worker

# Vérifier logs worker
docker logs masstock_worker --tail 50

# Vérifier Redis connexion
docker exec -it masstock_worker redis-cli -h redis -a $REDIS_PASSWORD ping

# Vérifier jobs en queue
docker exec -it masstock_redis redis-cli
> AUTH your_redis_password
> LLEN bull:workflow-queue:wait
> LRANGE bull:workflow-queue:wait 0 10
```

**Solutions:**
- Worker crashé → `docker-compose restart worker`
- Redis password incorrect → Vérifier `.env` et `.env.production`
- Gemini API key invalide → Vérifier `GEMINI_API_KEY`
- Rate limit atteint → Attendre ou augmenter la limite

### 4. SSL certificate expiré

**Symptômes:**
- Navigateur affiche "Your connection is not private"
- `curl` retourne "SSL certificate problem"

**Diagnostic:**
```bash
# Vérifier expiration
sudo certbot certificates

# Tester renouvellement
sudo certbot renew --dry-run
```

**Solutions:**
```bash
# Forcer renouvellement
sudo certbot renew --force-renewal

# Restart nginx
sudo systemctl reload nginx

# Si échec: re-run setup-ssl.sh
cd /opt/masstock
sudo ./deploy/setup-ssl.sh
```

### 5. Disk space full

**Symptômes:**
- Docker échoue à build
- Logs ne s'écrivent plus
- Services crashent aléatoirement

**Diagnostic:**
```bash
# Vérifier espace disque
df -h

# Vérifier espace Docker
docker system df

# Trouver gros fichiers
du -h /var/log | sort -h | tail -20
```

**Solutions:**
```bash
# Nettoyer Docker
docker system prune -a --volumes

# Nettoyer logs
sudo truncate -s 0 /var/log/nginx/*.log
sudo journalctl --vacuum-time=7d

# Nettoyer anciens logs MasStock
rm -f /opt/masstock/backend/logs/*.log.old
```

---

## Commandes utiles

### Docker Compose

```bash
# Démarrer tous les services
docker-compose -f docker-compose.production.yml up -d

# Rebuild et redémarrer un service
docker-compose -f docker-compose.production.yml up -d --build api

# Arrêter tous les services
docker-compose -f docker-compose.production.yml down

# Voir les logs
docker-compose -f docker-compose.production.yml logs -f

# Voir le statut
docker-compose -f docker-compose.production.yml ps
```

### Nginx

```bash
# Tester la config
sudo nginx -t

# Reload config (sans downtime)
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# Voir logs
sudo tail -f /var/log/nginx/masstock-api-error.log
sudo tail -f /var/log/nginx/error.log
```

### Redis

```bash
# Se connecter à Redis (dans container)
docker exec -it masstock_redis redis-cli -a $REDIS_PASSWORD

# Vérifier connexion
docker exec -it masstock_redis redis-cli -a $REDIS_PASSWORD ping

# Voir les jobs en queue
docker exec -it masstock_redis redis-cli -a $REDIS_PASSWORD LLEN bull:workflow-queue:wait

# Flusher Redis (⚠️ supprime tous les jobs!)
docker exec -it masstock_redis redis-cli -a $REDIS_PASSWORD FLUSHALL
```

### Monitoring

```bash
# Lancer health check complet
./deploy/health-check.sh

# Voir ressources utilisées
docker stats

# Voir logs en temps réel (tous les services)
docker-compose -f docker-compose.production.yml logs -f

# Voir logs d'un service spécifique
docker logs -f masstock_api
```

---

## Références

- [Project Architecture](./project_architecture.md)
- [Database Schema](./database_schema.md)
- [Async Workers](./async_workers.md)
- [Security Audit](../.agent/SOP/security_audit_2025_11.md)
- [Deployment Scripts](../../deploy/)

---

**End of Documentation**
