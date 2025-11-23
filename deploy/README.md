# MasStock Deployment Scripts

Scripts de déploiement en production pour MasStock sur VPS avec gestion d'erreur complète.

## 🚀 Déploiement Rapide

**Sur votre VPS:**

```bash
cd /opt/masstock
sudo ./deploy/master-deploy.sh
```

C'est tout! Le script va:
1. ✓ Vérifier l'environnement (Docker, ports, espace disque)
2. ✓ Générer les fichiers .env de façon sécurisée
3. ✓ Configurer nginx comme reverse proxy
4. ✓ Installer les certificats SSL (Let's Encrypt)
5. ✓ Builder le frontend et les images Docker
6. ✓ Démarrer tous les conteneurs
7. ✓ Vérifier que tout fonctionne

---

## 📋 Scripts Disponibles

### `master-deploy.sh` - Déploiement Complet

**Le script principal** qui orchestre tout le déploiement.

```bash
sudo ./deploy/master-deploy.sh              # Déploiement complet
sudo ./deploy/master-deploy.sh --verbose    # Mode verbeux
sudo ./deploy/master-deploy.sh --skip-ssl   # Sans SSL (HTTP seulement)
sudo ./deploy/master-deploy.sh --rebuild    # Force rebuild (no cache)
```

---

### `check-environment.sh` - Vérification Prérequis

Vérifie que votre VPS est prêt pour le déploiement.

```bash
./deploy/check-environment.sh
./deploy/check-environment.sh --verbose
```

**Vérifie:**
- ✓ OS compatible
- ✓ Docker installé et actif
- ✓ Ports disponibles (80, 443, 3000, 6379, 8080)
- ✓ Espace disque (minimum 10GB)
- ✓ Mémoire (minimum 2GB)
- ✓ Permissions utilisateur
- ✓ Git installé
- ✓ Connectivité réseau

---

### `generate-env.sh` - Configuration Sécurisée

Génère les fichiers `.env.production` de façon interactive et sécurisée.

```bash
./deploy/generate-env.sh
```

**Ce script va:**
1. Vous demander vos credentials Supabase
2. Générer des secrets crypto-sécurisés (JWT, encryption, Redis password)
3. Créer `backend/.env.production` avec permissions 600
4. Créer `frontend/.env.production` (optionnel)

**⚠️ Sécurité:**
- Les secrets sont entrés de façon masquée (pas de logs)
- Fichiers créés avec permissions 600 (lecture/écriture owner seulement)
- Déjà dans `.gitignore` (jamais committés)
- Backups automatiques si fichiers existants

---

### `setup-nginx-vps.sh` - Configuration nginx

Configure nginx sur le VPS comme reverse proxy.

```bash
sudo ./deploy/setup-nginx-vps.sh
```

**Ce qu'il fait:**
- Crée `/etc/nginx/sites-available/masstock.conf`
- Configure les upstreams vers les conteneurs Docker
- Route `dorian-gonzalez.fr` → nginx container (port 8080)
- Route `api.dorian-gonzalez.fr` → api container (port 3000)
- Active le site et recharge nginx
- Backup automatique en cas de config existante

---

### `setup-ssl.sh` - Certificats SSL

Obtient et configure les certificats SSL Let's Encrypt.

```bash
sudo ./deploy/setup-ssl.sh
sudo ./deploy/setup-ssl.sh --staging  # Mode test (certificats invalides)
```

**Ce qu'il fait:**
- Installe certbot si absent
- Obtient certificats pour `dorian-gonzalez.fr` et `api.dorian-gonzalez.fr`
- Met à jour nginx avec config SSL complète
- Configure le renouvellement automatique (cron)
- Active HTTPS redirect et headers de sécurité

**Certificats auto-renouvelés tous les 90 jours via systemd timer.**

---

### `build-and-start.sh` - Build & Démarrage

Builde le frontend, les images Docker et démarre tous les conteneurs.

```bash
./deploy/build-and-start.sh              # Build normal
./deploy/build-and-start.sh --rebuild    # Force rebuild (no cache)
./deploy/build-and-start.sh --no-build   # Juste redémarrer (skip build)
```

**Ce qu'il fait:**
1. Vérifie les prérequis (Docker, .env.production)
2. Build le frontend React (`npm run build`)
3. Build les images Docker (api, worker, nginx)
4. Stop les conteneurs existants
5. Démarre tous les conteneurs
6. Attend les health checks
7. Vérifie que tous les services fonctionnent

**Conteneurs démarrés:**
- `masstock_redis` - Queue de jobs (Bull)
- `masstock_api` - Serveur Express
- `masstock_worker` - Processeur de jobs en arrière-plan
- `masstock_nginx` - Reverse proxy + fichiers statiques

---

### `health-check.sh` - Monitoring Complet

Vérifie la santé de toute l'infrastructure.

```bash
./deploy/health-check.sh           # Mode interactif
./deploy/health-check.sh --json    # Output JSON (pour monitoring)
./deploy/health-check.sh --quiet   # Seulement les erreurs
```

**Checks effectués:**
- ✓ Statut des conteneurs Docker (running, healthy, restart count)
- ✓ Utilisation ressources (CPU, mémoire)
- ✓ Redis (connectivité, mémoire, clients, erreurs)
- ✓ API (health endpoint interne et externe HTTPS)
- ✓ Worker (activité, logs récents, jobs échoués)
- ✓ Frontend (fichiers déployés, accessibilité HTTPS)
- ✓ Espace disque et mémoire système
- ✓ Certificats SSL (expiration)
- ✓ Configuration nginx (validité, service actif, logs d'erreur)
- ✓ Connectivité réseau (internet, DNS, Docker network)

**Exit code:**
- `0` = Tous les checks passés
- `1` = Un ou plusieurs checks échoués

---

### `rollback.sh` - Retour Arrière

Revient à la version précédente en cas de problème.

```bash
./deploy/rollback.sh                        # Rollback au commit précédent
./deploy/rollback.sh --to-commit abc123     # Rollback à un commit spécifique
./deploy/rollback.sh --dry-run              # Preview sans exécuter
```

**Ce qu'il fait:**
1. Crée un backup de l'état actuel
2. Stop les conteneurs
3. Revert le code vers le commit précédent (git)
4. Restore les .env si nécessaire
5. Rebuild les images Docker
6. Redémarre les conteneurs
7. Vérifie la santé du système

**Backups stockés dans:** `/var/backups/masstock/rollback-YYYYMMDD-HHMMSS/`

---

## 🛠️ Workflow Complet

### Premier Déploiement

```bash
# 1. Clone le repo sur le VPS
ssh user@dorian-gonzalez.fr
git clone <repo> /opt/masstock
cd /opt/masstock

# 2. Lance le déploiement complet
sudo ./deploy/master-deploy.sh

# 3. Vérifie que tout fonctionne
./deploy/health-check.sh
```

### Déploiements Suivants

**Option A: Automatique (via GitHub Actions)**

```bash
# Sur votre machine locale
git add .
git commit -m "feat: ma nouvelle feature"
git push origin main

# GitHub Actions va automatiquement:
# - Builder le frontend
# - SSH sur le VPS
# - Pull le code
# - Rebuild les conteneurs
# - Redémarrer
# - Vérifier la santé
# - Rollback si échec
```

**Option B: Manuel (sur le VPS)**

```bash
cd /opt/masstock
git pull origin main
./deploy/build-and-start.sh --rebuild
./deploy/health-check.sh
```

### En Cas de Problème

```bash
# 1. Vérifier les logs
docker compose -f docker-compose.production.yml logs -f

# 2. Vérifier la santé
./deploy/health-check.sh

# 3. Si problème, rollback
./deploy/rollback.sh

# 4. Copier les erreurs et les envoyer à Claude pour debugging
cat /var/log/masstock/deployment-*.log
```

---

## 🔍 Gestion d'Erreur

**Tous les scripts ont une gestion d'erreur complète:**

### Codes d'Erreur Numérotés

Chaque erreur a un code unique (ERR001, ERR002, etc.) pour faciliter le debugging.

```bash
# Exemple de sortie d'erreur:
[2025-01-23 14:30:45] [ERROR] ❌ [ERR063] Backend .env.production not found
[2025-01-23 14:30:45] [ERROR] Context: Run: ./deploy/generate-env.sh
[2025-01-23 14:30:45] [ERROR] Check logs: /var/log/masstock/deployment-20250123-143045.log
```

### Logs Détaillés

Tous les logs sont sauvegardés dans `/var/log/masstock/`:

```bash
# Voir le dernier log de déploiement
ls -lt /var/log/masstock/
tail -f /var/log/masstock/deployment-YYYYMMDD-HHMMSS.log
```

### Messages d'Erreur Complets

Chaque erreur inclut:
- 🔍 Code d'erreur unique
- ❌ Message d'erreur clair
- 📋 Contexte (commande, état du système)
- 💡 Suggestion de résolution
- 📁 Chemin vers les logs complets

### Mode Verbose

Pour debugging approfondi:

```bash
./deploy/master-deploy.sh --verbose
```

Affiche:
- Toutes les commandes exécutées
- Output complet des commandes
- Checks intermédiaires
- Variables d'environnement (masquées si sensibles)

### Mode Dry-Run

Pour tester sans exécuter:

```bash
./deploy/master-deploy.sh --dry-run
```

Affiche ce qui serait fait sans modifier le système.

---

## 📊 Monitoring Production

### Logs en Temps Réel

```bash
# Tous les conteneurs
docker compose -f docker-compose.production.yml logs -f

# Conteneur spécifique
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f worker

# Dernières 100 lignes
docker compose -f docker-compose.production.yml logs --tail=100

# Depuis un timestamp
docker compose -f docker-compose.production.yml logs --since="2025-01-23T10:00:00"
```

### Logs nginx

```bash
# Access logs
tail -f /var/log/nginx/masstock-frontend-access.log
tail -f /var/log/nginx/masstock-api-access.log

# Error logs
tail -f /var/log/nginx/masstock-frontend-error.log
tail -f /var/log/nginx/masstock-api-error.log
```

### Logs Système

```bash
# Journal nginx
journalctl -u nginx -f

# Journal Docker
journalctl -u docker -f
```

### Métriques Conteneurs

```bash
# Stats en temps réel
docker stats masstock_api masstock_worker masstock_redis masstock_nginx

# Infos Redis
docker exec masstock_redis redis-cli INFO
docker exec masstock_redis redis-cli INFO memory

# Espace disque
df -h
docker system df

# Mémoire
free -h
```

---

## 🔧 Commandes Utiles

### Gestion Conteneurs

```bash
# Status
docker compose -f docker-compose.production.yml ps

# Démarrer
docker compose -f docker-compose.production.yml up -d

# Arrêter
docker compose -f docker-compose.production.yml down

# Redémarrer un service
docker compose -f docker-compose.production.yml restart api

# Rebuild et redémarrer
docker compose -f docker-compose.production.yml up -d --build
```

### Gestion nginx

```bash
# Tester la config
sudo nginx -t

# Recharger
sudo systemctl reload nginx

# Redémarrer
sudo systemctl restart nginx

# Status
sudo systemctl status nginx
```

### Gestion SSL

```bash
# Vérifier expiration
sudo certbot certificates

# Renouveler (dry-run)
sudo certbot renew --dry-run

# Forcer le renouvellement
sudo certbot renew --force-renewal

# Status du timer de renouvellement auto
sudo systemctl status certbot.timer
```

### Cleanup Docker

```bash
# Supprimer images inutilisées (libère de l'espace)
docker system prune -a

# Supprimer volumes (⚠️ attention!)
docker volume prune

# Voir l'utilisation
docker system df
```

---

## 📁 Fichiers Importants

```
/opt/masstock/
├── deploy/                              # Scripts de déploiement
│   ├── master-deploy.sh                 # ⭐ Script principal
│   ├── check-environment.sh
│   ├── generate-env.sh
│   ├── setup-nginx-vps.sh
│   ├── setup-ssl.sh
│   ├── build-and-start.sh
│   ├── health-check.sh
│   ├── rollback.sh
│   └── common.sh                        # Fonctions partagées
├── backend/.env.production              # ⚠️ SECRETS (jamais commit!)
├── docker-compose.production.yml        # Config Docker
└── .agent/SOP/deployment.md            # Documentation complète

/etc/nginx/sites-available/masstock.conf # Config nginx VPS
/etc/letsencrypt/live/dorian-gonzalez.fr/ # Certificats SSL
/var/log/masstock/                        # Logs de déploiement
/var/log/nginx/                           # Logs nginx
/var/backups/masstock/                    # Backups
```

---

## ⚠️ Sécurité

### Secrets Jamais Committés

Les fichiers suivants sont dans `.gitignore` et **ne doivent JAMAIS être committés**:

- `backend/.env.production`
- `frontend/.env.production`
- `backend/.env`
- `frontend/.env`

### Permissions Fichiers

```bash
# .env files
chmod 600 backend/.env.production

# Scripts
chmod +x deploy/*.sh

# Logs (si créés avec sudo)
sudo chmod 755 /var/log/masstock
sudo chmod 644 /var/log/masstock/*.log
```

### Secrets Auto-Générés

Ces secrets sont générés automatiquement par `generate-env.sh`:
- `JWT_SECRET` - 64 bytes crypto-secure
- `ENCRYPTION_KEY` - 32 bytes crypto-secure
- `REDIS_PASSWORD` - 32 bytes crypto-secure

**Jamais en dur dans le code!**

---

## 💡 Tips

1. **Toujours tester localement d'abord:**
   ```bash
   npm test
   npm run build
   ```

2. **Créer des branches pour les features:**
   ```bash
   git checkout -b feature/ma-feature
   # ... développement ...
   git push origin feature/ma-feature
   # → Pull Request → Review → Merge
   ```

3. **Monitorer après déploiement:**
   ```bash
   ./deploy/health-check.sh
   docker compose -f docker-compose.production.yml logs -f
   ```

4. **Garder les logs de déploiement:**
   ```bash
   ls -lh /var/log/masstock/
   # Utiles pour debugging si problème plus tard
   ```

5. **Rollback rapide si problème:**
   ```bash
   ./deploy/rollback.sh
   # Mieux qu'essayer de débugger en prod
   ```

---

## 📚 Documentation Complète

Pour plus de détails, voir:
- **SOP Complet:** `.agent/SOP/deployment.md`
- **README Projet:** `README.md`
- **CLAUDE.md:** `CLAUDE.md` (conventions, workflow, sécurité)

---

## 🆘 Support

**En cas de problème:**

1. **Check les logs:**
   ```bash
   tail -f /var/log/masstock/deployment-*.log
   docker compose -f docker-compose.production.yml logs -f
   ```

2. **Run health check:**
   ```bash
   ./deploy/health-check.sh --verbose
   ```

3. **Copier les erreurs:**
   - Code d'erreur (ERR0XX)
   - Message complet
   - Contexte
   - Logs

4. **Envoyer à Claude:**
   - Coller les erreurs
   - Claude va analyser et proposer des fixes
   - Appliquer les corrections
   - Re-tester

---

**Bon déploiement! 🚀**
