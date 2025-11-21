# MasStock - Guide de Déploiement Production

Guide complet pour déployer MasStock sur votre VPS IONOS avec Docker, SSL, CI/CD et monitoring.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration DNS](#configuration-dns)
3. [Installation Initiale](#installation-initiale)
4. [Configuration des Secrets](#configuration-des-secrets)
5. [Configuration SSL](#configuration-ssl)
6. [Déploiement des Services](#déploiement-des-services)
7. [Configuration CI/CD](#configuration-cicd)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Prérequis

### Serveur VPS
- **OS:** Ubuntu 20.04+ ou Debian 11+
- **RAM:** Minimum 2GB (recommandé 4GB)
- **Disk:** Minimum 20GB
- **CPU:** 2 cores minimum
- **Accès:** SSH avec clés publiques configurées

### Domaines
- `dorian-gonzalez.fr` → Frontend
- `api.dorian-gonzalez.fr` → Backend API

### Services Externes
- **Supabase:** Compte créé, projet configuré
- **GitHub:** Repository créé
- **DNS:** Accès pour créer A records

---

## 🌐 Configuration DNS

Configurez les A records dans votre panel IONOS ou DNS provider:

```
Type    Name    Value               TTL
A       @       YOUR_VPS_IP         3600
A       api     YOUR_VPS_IP         3600
```

Vérification:
```bash
dig dorian-gonzalez.fr
dig api.dorian-gonzalez.fr
```

---

## 🚀 Installation Initiale

### 1. Connexion au VPS

```bash
ssh root@YOUR_VPS_IP
```

### 2. Mise à Jour du Système

```bash
apt update && apt upgrade -y
```

### 3. Installation de Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 4. Installation des Outils Nécessaires

```bash
apt install -y git curl wget certbot
```

### 5. Configuration du Firewall

```bash
# Install UFW
apt install -y ufw

# Configure ports
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Enable firewall
ufw enable
ufw status
```

### 6. Création de la Structure

```bash
# Create deployment directory
mkdir -p /opt/masstock
chown $USER:$USER /opt/masstock

# Create logs and backups directories
mkdir -p /var/log /opt/masstock/backups
```

### 7. Cloner le Repository

```bash
cd /opt/masstock
git clone https://github.com/YOUR_USERNAME/masstock.git .
```

---

## 🔐 Configuration des Secrets

### 1. Générer les Secrets Production

```bash
node scripts/generate-secrets.js
```

Copier les valeurs générées.

### 2. Configurer Backend .env.production

```bash
cd /opt/masstock
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

Remplir avec vos vraies valeurs:

```env
# Supabase (from https://app.supabase.com/project/_/settings/api)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# JWT & Encryption (from generate-secrets.js)
JWT_SECRET=xxx...
ENCRYPTION_KEY=xxx...
REDIS_PASSWORD=xxx...

# CORS
CORS_ORIGIN=https://dorian-gonzalez.fr

# Logging
LOG_LEVEL=error
```

### 3. Configurer Frontend .env.production

```bash
cd /opt/masstock
nano frontend/.env.production
```

Contenu:
```env
VITE_API_URL=https://api.dorian-gonzalez.fr/api/v1
VITE_ENV=production
VITE_LOG_LEVEL=none
```

### 4. Sécuriser les Fichiers

```bash
chmod 600 backend/.env.production
chmod 600 frontend/.env.production
```

---

## 🔒 Configuration SSL

### 1. Éditer le Script SSL

```bash
nano scripts/setup-ssl.sh
```

Changer l'email:
```bash
EMAIL="votre-email@example.com"
```

### 2. Exécuter le Setup SSL

```bash
sudo ./scripts/setup-ssl.sh
```

Le script va:
- Installer certbot
- Générer les certificats pour les 2 domaines
- Configurer le renouvellement automatique
- Copier les certificats dans nginx/ssl/

### 3. Vérifier les Certificats

```bash
ls -la /opt/masstock/nginx/ssl/
```

Vous devriez voir:
```
nginx/ssl/dorian-gonzalez.fr/fullchain.pem
nginx/ssl/dorian-gonzalez.fr/privkey.pem
nginx/ssl/api.dorian-gonzalez.fr/fullchain.pem
nginx/ssl/api.dorian-gonzalez.fr/privkey.pem
```

---

## 🐳 Déploiement des Services

### 1. Build le Frontend

```bash
cd /opt/masstock/frontend
npm ci
npm run build
```

Le build sera dans `frontend/dist/`.

### 2. Démarrer les Services Docker

```bash
cd /opt/masstock

# Set Redis password in docker-compose env
export REDIS_PASSWORD=$(grep REDIS_PASSWORD backend/.env.production | cut -d= -f2)

# Build and start all services
docker-compose -f docker-compose.production.yml up -d --build
```

### 3. Vérifier les Services

```bash
# Check running containers
docker-compose -f docker-compose.production.yml ps

# Check logs
docker-compose -f docker-compose.production.yml logs -f --tail=50

# Check individual services
docker-compose -f docker-compose.production.yml logs api
docker-compose -f docker-compose.production.yml logs worker
docker-compose -f docker-compose.production.yml logs redis
docker-compose -f docker-compose.production.yml logs nginx
```

### 4. Health Checks

```bash
# API Health
curl https://api.dorian-gonzalez.fr/health

# Frontend
curl https://dorian-gonzalez.fr

# Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli ping
```

---

## 🔄 Configuration CI/CD

### 1. Générer SSH Key pour GitHub Actions

Sur le VPS:
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions
```

### 2. Ajouter les Secrets GitHub

Aller sur GitHub → Repository → Settings → Secrets and variables → Actions

Ajouter:

| Secret Name | Value |
|-------------|-------|
| `SSH_PRIVATE_KEY` | Contenu de `~/.ssh/github_actions` (clé privée) |
| `SSH_KNOWN_HOSTS` | Output de `ssh-keyscan YOUR_VPS_IP` |
| `VPS_HOST` | `YOUR_VPS_IP` ou `dorian-gonzalez.fr` |
| `VPS_USER` | `root` ou votre user |

### 3. Tester le Déploiement Automatique

```bash
# Push to main branch
git add .
git commit -m "chore: test auto deployment"
git push origin main
```

GitHub Actions va automatiquement:
1. Exécuter les tests
2. Builder le frontend
3. Se connecter au VPS via SSH
4. Pull le code
5. Rebuild et restart les services Docker
6. Exécuter les health checks

Suivre les logs: GitHub → Actions → Deploy to Production

---

## 📊 Monitoring & Maintenance

### 1. Configurer les Health Checks Automatiques

```bash
# Add health check cron job (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/masstock/scripts/health-check.sh") | crontab -
```

### 2. Configurer les Backups Automatiques

```bash
# Add backup cron job (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/masstock/scripts/backup.sh") | crontab -
```

### 3. Voir les Logs

```bash
# Health checks
tail -f /var/log/masstock-health.log

# Backups
tail -f /var/log/masstock-backup.log

# Application logs
docker-compose -f /opt/masstock/docker-compose.production.yml logs -f api
docker-compose -f /opt/masstock/docker-compose.production.yml logs -f worker
```

### 4. Commandes de Maintenance

```bash
# Restart all services
docker-compose -f /opt/masstock/docker-compose.production.yml restart

# Restart specific service
docker-compose -f /opt/masstock/docker-compose.production.yml restart api
docker-compose -f /opt/masstock/docker-compose.production.yml restart worker

# View resource usage
docker stats

# Clean up old images
docker system prune -a
```

---

## 🔧 Troubleshooting

### Problème: API ne répond pas

```bash
# Check API container
docker-compose -f /opt/masstock/docker-compose.production.yml ps api

# Check logs
docker-compose -f /opt/masstock/docker-compose.production.yml logs api --tail=100

# Check .env.production
cat backend/.env.production | grep -v "KEY\|SECRET\|PASSWORD"

# Restart API
docker-compose -f /opt/masstock/docker-compose.production.yml restart api
```

### Problème: Worker ne traite pas les jobs

```bash
# Check worker container
docker-compose -f /opt/masstock/docker-compose.production.yml ps worker

# Check worker logs
docker-compose -f /opt/masstock/docker-compose.production.yml logs worker --tail=100

# Check Redis connection
docker-compose -f /opt/masstock/docker-compose.production.yml exec redis redis-cli ping

# Restart worker
docker-compose -f /opt/masstock/docker-compose.production.yml restart worker
```

### Problème: Frontend affiche erreur CORS

Vérifier que `CORS_ORIGIN` dans `backend/.env.production` correspond exactement à l'URL frontend:
```bash
grep CORS_ORIGIN backend/.env.production
# Should be: CORS_ORIGIN=https://dorian-gonzalez.fr
```

### Problème: SSL Certificate Error

```bash
# Check certificates
ls -la /opt/masstock/nginx/ssl/

# Regenerate certificates
sudo ./scripts/setup-ssl.sh

# Restart nginx
docker-compose -f /opt/masstock/docker-compose.production.yml restart nginx
```

### Problème: Disk Space Full

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a -f

# Clean old backups
find /opt/masstock/backups -mtime +30 -delete

# Clean logs
truncate -s 0 /var/log/masstock-*.log
```

### Rollback vers Backup

```bash
# List backups
ls -la /opt/masstock/backups/

# Restore from backup (replace TIMESTAMP with actual backup folder)
cd /opt/masstock
cp backups/TIMESTAMP/backend.env backend/.env.production
cp backups/TIMESTAMP/docker-compose.production.yml .
docker-compose -f docker-compose.production.yml restart
```

---

## 📞 Support

- **Documentation:** `/docs`
- **Issues:** GitHub Issues
- **Logs:** `/var/log/masstock-*.log`
- **Backups:** `/opt/masstock/backups`

---

## ✅ Post-Deployment Checklist

Voir [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) pour la checklist complète.
