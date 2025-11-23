# 🚀 Quick Start - Déploiement en 3 Commandes

## Sur Ta Machine Locale

```bash
cd /Users/dorian/Documents/MASSTOCK
git add .
git commit -m "feat(deploy): add production deployment infrastructure"
git push origin main
```

## Sur Ton VPS

```bash
# 1. Clone (ou pull)
git clone <ton-repo> /opt/masstock
cd /opt/masstock

# 2. Déploie
sudo ./deploy/master-deploy.sh

# 3. Vérifie
./deploy/health-check.sh
```

**C'est tout!** 🎉

---

## Ce qui va se passer

Le script `master-deploy.sh` va te demander:

1. ✅ **Supabase URL** → `https://xxxxx.supabase.co`
2. ✅ **Supabase Anon Key** → (masqué, appuie sur Entrée après avoir tapé)
3. ✅ **Supabase Service Role Key** → (masqué)
4. ✅ **Gemini API Key** → (optionnel, appuie sur Entrée pour skip)
5. ✅ **Email pour Let's Encrypt** → `ton@email.com`
6. ✅ Confirmations → Appuie sur `y` + Entrée

**Durée:** 10-15 minutes

---

## Résultat Final

**Sites en ligne:**
- 🌐 Frontend: https://dorian-gonzalez.fr
- 🔌 API: https://api.dorian-gonzalez.fr
- 📊 Health: https://api.dorian-gonzalez.fr/health

**Fonctionnalités:**
- ✅ SSL/HTTPS automatique
- ✅ Auto-restart si crash
- ✅ Auto-deploy sur `git push` (après config GitHub Secrets)
- ✅ Monitoring complet
- ✅ Rollback facile
- ✅ Logs détaillés

---

## Si Erreur

**1. Copie l'erreur:**
```
[ERROR] ❌ [ERR063] Message d'erreur...
```

**2. Envoie à Claude:**
```
"J'ai cette erreur: [colle l'erreur]"
```

**3. Applique le fix**

**4. Relance:**
```bash
sudo ./deploy/master-deploy.sh
```

---

## Docs Complètes

- **Usage des scripts:** `deploy/README.md`
- **SOP complet:** `.agent/SOP/deployment.md`
- **Guide détaillé:** `DEPLOYMENT_READY.md`

---

**Let's go! 🚀**
