# MasStock

> Plateforme SaaS d'automatisation de workflows pour agences de contenu IA

MasStock est une solution complète permettant aux agences de gérer leurs workflows de production de contenu avec l'IA, de la demande client à la livraison finale.

## Démarrage Rapide

### Prérequis

- Node.js 18+ et npm 9+
- Compte Supabase (pour la base de données)
- Redis (optionnel, pour les jobs en arrière-plan)

### Installation

```bash
# Cloner le repository
git clone <repo-url>
cd MASSTOCK

# Installation Backend
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos credentials Supabase

# Installation Frontend
cd ../frontend
npm install
cp .env.example .env
# Éditer .env avec l'URL de l'API
```

### Lancement

```bash
# Terminal 1 : Backend
cd backend
npm run dev          # API sur http://localhost:3000

# Terminal 2 : Frontend
cd frontend
npm run dev          # UI sur http://localhost:5173

# Terminal 3 (optionnel) : Worker
cd backend
npm run worker       # Worker pour jobs asynchrones
```

### Premier utilisateur admin

```bash
cd backend
node src/scripts/create-admin.js
# Suivre les instructions
```

### Tests

```bash
# Backend
cd backend
npm test                    # Tests unitaires avec couverture
npm run test:watch          # Mode watch

# Frontend
cd frontend
npm test                    # Tests unitaires avec couverture
npm run test:ui             # Interface Vitest

# E2E
cd tests/e2e
./test-auth-flow.sh         # Tester l'authentification
```

## Structure du Projet

```
MASSTOCK/
├── backend/           # API Node.js/Express
├── frontend/          # Application React
├── tests/             # Tests E2E et intégration
├── docs/              # Documentation
└── CLAUDE.md          # Guide pour Claude Code
```

## Stack Technique

### Backend
- Node.js + Express
- Supabase (PostgreSQL)
- Bull + Redis (job queue)
- Jest (tests)

### Frontend
- React 19 + Vite
- TailwindCSS 4
- Zustand (state management)
- Vitest (tests)

## Développement

### Workflow TDD (Test-Driven Development)

1. **Rouge** ❌ : Écrire un test qui échoue
2. **Vert** ✅ : Écrire le code minimum pour passer le test
3. **Refactor** ♻️ : Améliorer le code

```bash
# Démarrer les tests en mode watch
npm run test:watch

# Écrire le test d'abord
# Implémenter la fonctionnalité
# Vérifier la couverture
npm run test:coverage   # Objectif : ≥ 70%
```

### Avant de Commit

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test && npm run lint

# Si tout est vert ✅
git add .
git commit -m "feat: ma nouvelle fonctionnalité"
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Guide complet pour développer avec Claude Code
- **[Architecture](./docs/ARCHITECTURE.md)** - Architecture technique détaillée
- **[TDD Workflow](./docs/testing/TDD_WORKFLOW.md)** - Guide du workflow TDD
- **[Testing Guide](./docs/testing/TESTING_GUIDE.md)** - Guide de rédaction des tests
- **[Backend README](./backend/README.md)** - Documentation du backend
- **[Frontend README](./frontend/README.md)** - Documentation du frontend
- **[Design System](./docs/design/DESIGN_SYSTEM.md)** - Système de design

## API Documentation

Documentation interactive Swagger disponible à :
```
http://localhost:3000/api-docs
```

## Déploiement

### Backend

```bash
cd backend
npm run build           # Si build step requis
npm start               # Production mode
```

Voir [DEPLOYMENT.md](./backend/DEPLOYMENT.md) pour Render/Railway.

### Frontend

```bash
cd frontend
npm run build          # Build pour production
npm run preview        # Prévisualiser le build

# Déployer sur Vercel
vercel
```

## Tests

Le projet suit une approche TDD stricte avec des tests unitaires, d'intégration et E2E.

### Tests Unitaires

```bash
# Backend (Jest)
cd backend
npm run test:unit           # Tests uniquement
npm run test:coverage       # Avec couverture

# Frontend (Vitest)
cd frontend
npm run test:unit           # Tests uniquement
npm run test:ui             # Interface graphique
```

### Tests d'Intégration

```bash
cd tests/integration
node test_api.js            # Tests API
node test_db.js             # Tests base de données
```

### Tests E2E

```bash
cd tests/e2e
./test-auth-flow.sh                 # Flux d'authentification
./test-frontend-integration.sh     # Intégration frontend
./test-admin-endpoints.sh          # Endpoints admin
```

### Tests Postman

```bash
cd tests/postman
# Importer les collections dans Postman :
# - MasStock-API-Collection.postman_collection.json
# - MasStock-Postman-Environment.postman_environment.json
```

## Contribution

1. Créer une branche feature (`git checkout -b feature/amazing-feature`)
2. **Écrire les tests d'abord** (TDD)
3. Implémenter la fonctionnalité
4. Vérifier que tous les tests passent (`npm test`)
5. Commit (`git commit -m 'feat: add amazing feature'`)
6. Push (`git push origin feature/amazing-feature`)
7. Créer une Pull Request

## Variables d'Environnement

### Backend (.env)

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
LOG_LEVEL=info
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

## Dépannage

### Le backend ne démarre pas
```bash
# Vérifier la connexion Supabase
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL)"

# Vérifier Redis
redis-cli ping
```

### Le build frontend échoue
```bash
# Nettoyer le cache
rm -rf node_modules package-lock.json
npm install
```

### Les tests échouent
```bash
# Backend
cd backend && npm test -- --clearCache

# Frontend
cd frontend && npx vitest --clearCache
```

## License

MIT

## Support

Pour toute question ou problème :
- Consulter la [documentation](./docs/)
- Lire les [guides de test](./docs/testing/)
- Vérifier les [exemples de tests](./backend/src/__tests__/) et [frontend](./frontend/src/__tests__/)

---

**Développé avec ❤️ en suivant les principes TDD**
