# Migration dorian-gonzalez.fr → masstock.fr

**Date:** 2025-12-04
**Status:** EN COURS
**Objectif:** Migrer l'infrastructure vers le domaine masstock.fr avec architecture multi-sous-domaines

---

## Architecture Cible

### Domaines

| Sous-domaine | Service | Description | Port Docker | HTTPS |
|--------------|---------|-------------|-------------|-------|
| **masstock.fr** | Site vitrine | Page marketing/présentation (placeholder) | 8081 | ✅ |
| **app.masstock.fr** | Application | Frontend React actuel | 8080 | ✅ |
| **api.masstock.fr** | API Backend | Express + Workers + Redis | 3000 | ✅ |
| **n8n.masstock.fr** | n8n | Automation workflows | 5678 | ✅ |

### Architecture Nginx

```
Internet (HTTPS:443)
         ↓
    VPS nginx (reverse proxy)
         ↓
    ┌────────────────────────────────────┐
    │  masstock.fr → :8081 (vitrine)     │
    │  app.masstock.fr → :8080 (app)     │
    │  api.masstock.fr → :3000 (api)     │
    │  n8n.masstock.fr → :5678 (n8n)     │
    └────────────────────────────────────┘
         ↓
    Docker containers (internal network)
```

### Sécurité

- ✅ Tout en HTTPS (Let's Encrypt)
- ✅ API: Rate limiting + CORS + JWT auth
- ✅ App: Protection par auth (redirect si non authentifié)
- ✅ n8n: Basic auth + IP whitelist (optionnel)
- ✅ Site vitrine: Public

---

## PHASE 1: Préparation VPS (Scripts de déploiement)

### Étape 1.1: Configuration DNS (À FAIRE SUR OVH/PROVIDER)

**Avant de lancer les scripts, configurer DNS:**

```
Type    Nom              Valeur              TTL
─────────────────────────────────────────────────
A       masstock.fr      <VPS_IP>            3600
A       app              <VPS_IP>            3600
A       api              <VPS_IP>            3600
A       n8n              <VPS_IP>            3600
CNAME   www              masstock.fr         3600
```

**Vérification (attendre propagation DNS ~5-30 min):**

```bash
dig +short masstock.fr
dig +short app.masstock.fr
dig +short api.masstock.fr
dig +short n8n.masstock.fr
```

Tous doivent retourner `<VPS_IP>`.

---

### Étape 1.2: Pull du Repo sur VPS

**Sur le VPS:**

```bash
cd /opt/masstock
git pull origin main
```

Les nouveaux scripts seront mis à jour.

---

### Étape 1.3: Exécution des Scripts de Migration

**Sur le VPS (en tant que root ou avec sudo):**

```bash
cd /opt/masstock

# 1. Vérifier l'environnement (Docker, ports, etc.)
./deploy/check-environment.sh --verbose

# 2. Backup de la configuration actuelle
sudo cp /etc/nginx/sites-available/masstock.conf /etc/nginx/sites-available/masstock.conf.backup.dorian
sudo cp docker-compose.production.yml docker-compose.production.yml.backup

# 3. Mise à jour nginx pour masstock.fr
sudo ./deploy/setup-nginx-vps.sh --verbose

# 4. Configuration SSL pour tous les sous-domaines
sudo ./deploy/setup-ssl.sh --verbose
# Il va demander ton email pour Let's Encrypt

# 5. Build et démarrage des conteneurs
./deploy/build-and-start.sh --rebuild

# 6. Vérification santé
./deploy/health-check.sh
```

---

### Étape 1.4: Vérification Manuelle

**Tester les endpoints:**

```bash
# Site vitrine (placeholder)
curl -I https://masstock.fr

# Application
curl -I https://app.masstock.fr

# API health check
curl https://api.masstock.fr/health

# n8n
curl -I https://n8n.masstock.fr
```

**Tester dans le navigateur:**
- https://masstock.fr → Page vitrine placeholder
- https://app.masstock.fr → Application MasStock (login requis)
- https://api.masstock.fr/health → JSON health status
- https://n8n.masstock.fr → Interface n8n (auth requise)

---

### Étape 1.5: Rollback en Cas de Problème

**Si quelque chose ne fonctionne pas:**

```bash
# Restaurer l'ancienne config nginx
sudo cp /etc/nginx/sites-available/masstock.conf.backup.dorian /etc/nginx/sites-available/masstock.conf
sudo nginx -t
sudo systemctl reload nginx

# Restaurer docker-compose
cp docker-compose.production.yml.backup docker-compose.production.yml
./deploy/build-and-start.sh --rebuild
```

---

## PHASE 2: CI/CD Auto-Deploy

### Étape 2.1: Configuration GitHub Secrets

**Dans GitHub → Settings → Secrets → Actions:**

Les secrets existants restent valides (SSH_PRIVATE_KEY, SSH_KNOWN_HOSTS, VPS_HOST, VPS_USER).

Pas besoin de nouveaux secrets.

---

### Étape 2.2: Test du Workflow CI/CD

**Sur ta machine locale:**

```bash
# 1. Faire un changement trivial
echo "# Test deploy masstock.fr" >> README.md

# 2. Commit et push
git add .
git commit -m "test: verify auto-deploy to masstock.fr"
git push origin main
```

**Vérifier GitHub Actions:**
- Aller sur GitHub → Actions
- Le workflow "Deploy to Production" doit se lancer
- Vérifier les logs (build, deploy, health checks)

**Si succès:**
- ✅ Le code est déployé automatiquement
- ✅ Les conteneurs redémarrent
- ✅ Health checks passent
- ✅ Rollback automatique si échec

---

### Étape 2.3: Monitoring Post-Deploy

**Après chaque push, vérifier:**

```bash
# Sur le VPS
cd /opt/masstock

# 1. Status conteneurs
docker compose -f docker-compose.production.yml ps

# 2. Logs
docker compose -f docker-compose.production.yml logs -f

# 3. Health check complet
./deploy/health-check.sh --verbose

# 4. Logs nginx
tail -f /var/log/nginx/masstock-*-access.log
```

---

## Protection Auth sur app.masstock.fr

### Frontend (déjà implémenté)

Le frontend utilise déjà le système d'auth avec redirect:

**Fichier:** `frontend/src/App.jsx`

```jsx
// Routes protégées
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/workflows" element={<Workflows />} />
  {/* ... autres routes */}
</Route>

// Si pas de token → redirect vers /login
```

**Fichier:** `frontend/src/components/ProtectedRoute.jsx`

```jsx
// Vérifie le token dans les cookies
// Si absent → navigate('/login')
```

✅ **Déjà fonctionnel**, rien à modifier.

---

### Backend API Security (déjà implémenté)

**Fichier:** `backend/src/middleware/auth.js`

```javascript
// Tous les endpoints nécessitent un JWT valide
// Sauf: /api/v1/auth/login, /api/v1/auth/refresh, /health
```

**Rate limiting:**
```javascript
// 100 req/15min general
// 5 req/15min auth endpoints
```

✅ **Déjà fonctionnel**, rien à modifier.

---

## Configuration n8n

### Docker Compose n8n

**Fichier:** `docker-compose.production.yml`

```yaml
services:
  # ... services existants ...

  # n8n - Workflow Automation
  n8n:
    image: n8nio/n8n:latest
    container_name: masstock_n8n
    restart: unless-stopped
    environment:
      - N8N_HOST=n8n.masstock.fr
      - N8N_PROTOCOL=https
      - N8N_PORT=5678
      - WEBHOOK_URL=https://n8n.masstock.fr/
      - GENERIC_TIMEZONE=Europe/Paris
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=${SUPABASE_DB_HOST}
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=${N8N_DB_NAME}
      - DB_POSTGRESDB_USER=${SUPABASE_DB_USER}
      - DB_POSTGRESDB_PASSWORD=${SUPABASE_DB_PASSWORD}
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - masstock_network
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  n8n_data:
    driver: local
```

### Variables d'environnement n8n

**Ajouter dans:** `backend/.env.production`

```bash
# n8n Configuration
N8N_USER=admin
N8N_PASSWORD=<générer-password-fort>
N8N_ENCRYPTION_KEY=<générer-key-32-bytes>
N8N_DB_NAME=n8n_masstock

# Supabase DB credentials (pour n8n database)
SUPABASE_DB_HOST=<supabase-db-host>
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=<supabase-db-password>
```

**Génération des secrets:**

```bash
# Sur le VPS
cd /opt/masstock

# Password fort
openssl rand -base64 32

# Encryption key
openssl rand -hex 32
```

---

## Site Vitrine Placeholder

### Structure

```
frontend-vitrine/
├── index.html          # Landing page
├── styles.css          # Pure CSS
└── assets/
    └── logo.svg
```

### Docker Compose

**Ajout dans:** `docker-compose.production.yml`

```yaml
services:
  # ... services existants ...

  # Site Vitrine - Landing Page
  vitrine:
    build:
      context: ./frontend-vitrine
      dockerfile: Dockerfile
    container_name: masstock_vitrine
    restart: unless-stopped
    ports:
      - "8081:80"
    networks:
      - masstock_network
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Contenu Placeholder

**Simple landing page:**
- Logo MasStock
- Tagline: "Automatisation Workflow Powered by AI"
- Email contact
- Link vers app.masstock.fr

---

## Checklist de Migration

### Pré-Migration

- [ ] Configurer DNS pour masstock.fr (A records)
- [ ] Attendre propagation DNS (dig +short)
- [ ] Backup config actuelle nginx
- [ ] Backup docker-compose.production.yml

### Phase 1: VPS Setup

- [ ] Git pull sur VPS
- [ ] Exécuter check-environment.sh
- [ ] Exécuter setup-nginx-vps.sh
- [ ] Exécuter setup-ssl.sh (certificats Let's Encrypt)
- [ ] Ajouter variables n8n dans .env.production
- [ ] Exécuter build-and-start.sh --rebuild
- [ ] Vérifier health-check.sh
- [ ] Tester HTTPS pour tous sous-domaines

### Phase 2: CI/CD

- [ ] Vérifier GitHub Secrets (SSH, VPS)
- [ ] Push test commit
- [ ] Vérifier GitHub Actions workflow
- [ ] Vérifier auto-deploy fonctionne
- [ ] Tester rollback automatique (commit cassé volontaire)

### Post-Migration

- [ ] Monitorer logs nginx
- [ ] Monitorer logs Docker
- [ ] Vérifier certificats SSL (90j expiry)
- [ ] Documenter nouvelle architecture
- [ ] Update CLAUDE.md et README.md

---

## Troubleshooting

### DNS ne résout pas

```bash
# Vérifier propagation
dig +short masstock.fr @8.8.8.8
dig +short app.masstock.fr @8.8.8.8

# Tester depuis VPS
nslookup masstock.fr
```

**Fix:** Attendre propagation (5-30 min), vérifier config DNS provider.

---

### SSL échoue (certbot)

```bash
# Logs certbot
journalctl -u certbot -n 50

# Test manuel
sudo certbot certonly --nginx -d masstock.fr --dry-run

# Vérifier port 80 ouvert
sudo netstat -tuln | grep :80
```

**Fix:**
- Vérifier DNS pointe vers VPS
- Vérifier firewall (port 80/443 ouverts)
- Vérifier nginx actif

---

### n8n ne démarre pas

```bash
# Logs conteneur
docker logs masstock_n8n

# Vérifier variables env
docker exec masstock_n8n env | grep N8N

# Vérifier DB connection
docker exec masstock_n8n wget -O- http://localhost:5678/healthz
```

**Fix:**
- Vérifier credentials Supabase DB
- Créer database n8n dans Supabase
- Vérifier encryption key (32 bytes hex)

---

### App ne redirige pas vers login

**Vérifier:**

```javascript
// frontend/src/components/ProtectedRoute.jsx
// Token check et redirect
```

**Si problème:**
```bash
# Clear cookies
# Vérifier VITE_API_URL dans .env
# Rebuild frontend
npm run build
```

---

## Commandes Utiles

### Logs en temps réel

```bash
# Tous les services
docker compose -f docker-compose.production.yml logs -f

# Service spécifique
docker compose -f docker-compose.production.yml logs -f n8n
docker compose -f docker-compose.production.yml logs -f api

# nginx VPS
tail -f /var/log/nginx/masstock-*-access.log
tail -f /var/log/nginx/masstock-*-error.log
```

### Restart services

```bash
# Tous
docker compose -f docker-compose.production.yml restart

# Service spécifique
docker compose -f docker-compose.production.yml restart n8n

# Rebuild complet
./deploy/build-and-start.sh --rebuild
```

### Certificats SSL

```bash
# Status
sudo certbot certificates

# Renouveler
sudo certbot renew

# Test renouvellement
sudo certbot renew --dry-run
```

---

## Timeline Estimée

| Phase | Durée | Dépendances |
|-------|-------|-------------|
| DNS Configuration | 5-30 min | Propagation DNS |
| Scripts VPS Phase 1 | 15-20 min | DNS propagé |
| Vérification manuelle | 10 min | Phase 1 OK |
| CI/CD Phase 2 | 5 min | Phase 1 OK |
| Tests complets | 15 min | Tout déployé |
| **TOTAL** | **~1h** | - |

---

## Rollback Plan

### Si échec complet

```bash
# 1. Restaurer nginx
sudo cp /etc/nginx/sites-available/masstock.conf.backup.dorian /etc/nginx/sites-available/masstock.conf
sudo systemctl reload nginx

# 2. Restaurer docker-compose
cp docker-compose.production.yml.backup docker-compose.production.yml

# 3. Rebuild
./deploy/build-and-start.sh --rebuild

# 4. Pointer DNS vers ancien domaine (dorian-gonzalez.fr)
```

### Si échec partiel (un service)

```bash
# Restart service problématique
docker compose -f docker-compose.production.yml restart <service>

# Voir logs
docker compose -f docker-compose.production.yml logs -f <service>

# Fix et rebuild
./deploy/build-and-start.sh --rebuild
```

---

## Prochaines Étapes Après Migration

1. **Développer site vitrine** (masstock.fr)
   - Design landing page
   - Intégration features, pricing, contact

2. **Configurer n8n workflows**
   - Connect to API backend
   - Automation use cases

3. **Monitoring avancé**
   - Uptime monitoring (UptimeRobot, etc.)
   - Error tracking (Sentry)
   - Analytics (Plausible)

4. **Performance**
   - CDN pour assets statiques
   - Caching Redis pour API
   - Image optimization

---

**Prêt pour la migration !** 🚀
