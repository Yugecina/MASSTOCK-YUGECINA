# MasStock - Production Deployment Checklist

Checklist complète pour vérifier que tous les aspects du déploiement sont correctement configurés.

## 🌐 DNS & Domaines

- [ ] A record configuré pour `dorian-gonzalez.fr` → IP VPS
- [ ] A record configuré pour `api.dorian-gonzalez.fr` → IP VPS
- [ ] DNS propagation vérifiée (24-48h max)
  ```bash
  dig dorian-gonzalez.fr
  dig api.dorian-gonzalez.fr
  ```

## 🖥️ Serveur VPS

- [ ] Système à jour (`apt update && apt upgrade`)
- [ ] Docker installé et fonctionnel
- [ ] Docker Compose installé
- [ ] Firewall configuré (ports 22, 80, 443)
- [ ] Utilisateur non-root créé (si nécessaire)
- [ ] Clés SSH configurées
- [ ] Directory `/opt/masstock` créé

## 📦 Repository & Code

- [ ] Repository cloné dans `/opt/masstock`
- [ ] Branche `main` à jour
- [ ] `.gitignore` contient `.env.production`
- [ ] Aucun secret commité dans Git

## 🔐 Secrets & Variables d'Environnement

### Backend `.env.production`
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000`
- [ ] `CORS_ORIGIN=https://dorian-gonzalez.fr` (EXACT)
- [ ] `SUPABASE_URL` configuré
- [ ] `SUPABASE_ANON_KEY` configuré
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configuré (NE PAS exposer!)
- [ ] `JWT_SECRET` généré avec `crypto.randomBytes(64)`
- [ ] `ENCRYPTION_KEY` généré avec `crypto.randomBytes(32)`
- [ ] `REDIS_PASSWORD` fort et aléatoire
- [ ] `LOG_LEVEL=error`
- [ ] Fichier permissions: `chmod 600`

### Frontend `.env.production`
- [ ] `VITE_API_URL=https://api.dorian-gonzalez.fr/api/v1` (EXACT)
- [ ] `VITE_ENV=production`
- [ ] `VITE_LOG_LEVEL=none`

## 🗄️ Supabase

- [ ] Projet Supabase créé
- [ ] Toutes les migrations exécutées (10 migrations)
- [ ] RLS activé sur toutes les tables
- [ ] Bucket `workflow-results` créé (public)
- [ ] API keys récupérées
- [ ] Service role key sécurisée (backend only!)

## 🔒 SSL/HTTPS

- [ ] Certbot installé
- [ ] Certificats générés pour `dorian-gonzalez.fr`
- [ ] Certificats générés pour `api.dorian-gonzalez.fr`
- [ ] Certificats copiés dans `/opt/masstock/nginx/ssl/`
- [ ] Auto-renewal configuré (cron daily)
- [ ] HTTP → HTTPS redirect actif
- [ ] HSTS headers configurés

Vérification:
```bash
curl -I https://dorian-gonzalez.fr
curl -I https://api.dorian-gonzalez.fr
```

Test SSL:
- https://www.ssllabs.com/ssltest/analyze.html?d=dorian-gonzalez.fr
- Grade A attendu

## 🐳 Docker Services

- [ ] Frontend build créé (`npm run build` dans frontend/)
- [ ] `docker-compose.production.yml` configuré
- [ ] Redis container démarre
- [ ] API container démarre
- [ ] Worker container démarre
- [ ] Nginx container démarre
- [ ] Health checks passent
  ```bash
  docker-compose -f docker-compose.production.yml ps
  ```

## 🔍 Health Checks

- [ ] API endpoint: `https://api.dorian-gonzalez.fr/health` → 200 OK
- [ ] Frontend: `https://dorian-gonzalez.fr` → 200 OK
- [ ] Redis: `docker exec masstock_redis redis-cli ping` → PONG
- [ ] Worker logs montrent "Worker started"
- [ ] Aucune erreur dans les logs

## 🚫 Production-Safe Logging

- [ ] Frontend: Aucun `console.log` dans le bundle production
  ```bash
  # Check build output
  grep -r "console.log" frontend/dist/assets/*.js || echo "✅ No console.log found"
  ```
- [ ] Backend: Winston configuré avec `NODE_ENV=production`
- [ ] Backend: Aucun console transport en production
- [ ] Logs uniquement dans fichiers (`/opt/masstock/backend/logs/`)

## 🔄 CI/CD GitHub Actions

- [ ] Repository sur GitHub
- [ ] Secrets configurés dans GitHub:
  - [ ] `SSH_PRIVATE_KEY`
  - [ ] `SSH_KNOWN_HOSTS`
  - [ ] `VPS_HOST`
  - [ ] `VPS_USER`
- [ ] Workflow `.github/workflows/tests.yml` présent
- [ ] Workflow `.github/workflows/deploy.yml` présent
- [ ] Test push → Actions déclenchées
- [ ] Deploy automatique fonctionne

## 📊 Monitoring & Backup

- [ ] Health check script créé et exécutable
- [ ] Backup script créé et exécutable
- [ ] Cron job health check configuré (*/5 * * * *)
  ```bash
  crontab -l | grep health-check
  ```
- [ ] Cron job backup configuré (0 2 * * *)
  ```bash
  crontab -l | grep backup
  ```
- [ ] Logs health check: `/var/log/masstock-health.log`
- [ ] Logs backup: `/var/log/masstock-backup.log`
- [ ] Directory backups: `/opt/masstock/backups/`

## 🧪 Tests Fonctionnels

### Frontend
- [ ] Page d'accueil charge
- [ ] Login fonctionne
- [ ] Dashboard accessible après login
- [ ] Pas d'erreurs dans console navigateur (F12)

### Backend API
- [ ] `/health` retourne 200
- [ ] `/api/v1/auth/me` avec token valide retourne user
- [ ] CORS headers présents
- [ ] Rate limiting actif

### Workflows
- [ ] Nano Banana workflow exécutable
- [ ] Worker traite les jobs
- [ ] Jobs apparaissent dans Executions
- [ ] Résultats sauvegardés dans Supabase Storage

Test workflow:
```bash
# Check worker logs
docker-compose -f /opt/masstock/docker-compose.production.yml logs worker -f
```

## 🔐 Sécurité

- [ ] `.env.production` non commité
- [ ] Service role key jamais exposée au frontend
- [ ] JWT secrets forts et aléatoires
- [ ] Redis password configuré
- [ ] API keys encryptées dans DB
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Rate limiting configuré
- [ ] Input validation avec Zod
- [ ] CORS strictement configuré (pas de `*`)

## 🚀 Performance

- [ ] Frontend build minifié
- [ ] Gzip compression activée (nginx)
- [ ] Static assets cached (nginx)
- [ ] Redis persistence configurée
- [ ] Docker images optimisées

## 📚 Documentation

- [ ] `docs/DEPLOYMENT.md` à jour
- [ ] `docs/PRODUCTION_CHECKLIST.md` remplie
- [ ] `README.md` contient section "Production Deployment"
- [ ] Scripts documentés avec comments

## 🎯 Tests de Charge (Optionnel)

- [ ] Test basique de charge avec `ab` ou `wrk`
  ```bash
  # Test API endpoint
  ab -n 1000 -c 10 https://api.dorian-gonzalez.fr/health
  ```
- [ ] Monitoring mémoire/CPU pendant charge
- [ ] Logs d'erreurs vérifiés

## 📈 Post-Deployment

- [ ] URL partagée: https://dorian-gonzalez.fr
- [ ] Utilisateur de test créé
- [ ] Client de test créé
- [ ] Workflow de test exécuté avec succès
- [ ] Support contacté si problème

## 🔔 Alertes & Notifications (Optionnel)

- [ ] Email configuré pour alerts
- [ ] Uptime monitoring (ex: UptimeRobot)
- [ ] Error tracking (ex: Sentry)

---

## ✅ Validation Finale

Une fois toutes les cases cochées ci-dessus:

1. **Test Frontend:**
   - Ouvrir https://dorian-gonzalez.fr
   - Login avec compte test
   - Exécuter un workflow Nano Banana
   - Vérifier le résultat

2. **Test Backend:**
   ```bash
   curl https://api.dorian-gonzalez.fr/health
   curl https://api.dorian-gonzalez.fr/api/v1/workflows
   ```

3. **Test CI/CD:**
   ```bash
   git commit --allow-empty -m "test: trigger deployment"
   git push origin main
   ```
   → Vérifier sur GitHub Actions

4. **Vérifier Health Checks:**
   ```bash
   /opt/masstock/scripts/health-check.sh
   ```

5. **Vérifier Backup:**
   ```bash
   /opt/masstock/scripts/backup.sh
   ls -la /opt/masstock/backups/
   ```

---

## 🎉 Déploiement Réussi !

Si toutes les cases sont cochées et tous les tests passent:

**✅ MasStock est déployé en production avec succès !**

URLs:
- **Frontend:** https://dorian-gonzalez.fr
- **API:** https://api.dorian-gonzalez.fr
- **Health Check:** https://api.dorian-gonzalez.fr/health

Prochaines étapes:
- Surveiller les logs pendant 24-48h
- Tester avec de vrais utilisateurs
- Optimiser les performances si nécessaire
- Mettre en place monitoring avancé (optionnel)
