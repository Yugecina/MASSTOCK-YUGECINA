# Tests Backend - MasStock

**Version**: 2.0 (Réécriture complète - Décembre 2025)
**Approche**: Test-Driven Development (TDD) moderne

---

## 📁 Structure

```
__tests__/
├── __helpers__/          # Mocks et utilitaires partagés
│   ├── supabase-mock.ts  # Factory pour mocks Supabase
│   ├── express-mock.ts   # Factory pour mocks Express
│   ├── fixtures.ts       # Données de test réutilisables
│   └── e2e-setup.ts      # Setup pour tests E2E
├── unit/                 # Tests unitaires (pas de mocks externes)
│   ├── middleware/       # Tests de middleware
│   ├── utils/            # Tests d'utilitaires
│   └── services/         # Tests de services
├── integration/          # Tests d'intégration (mocks minimaux)
└── e2e/                  # Tests end-to-end (pas de mocks)
    └── auth-flow.e2e.test.ts
```

## 🚀 Commandes

```bash
npm test                  # Tous les tests
npm run test:unit         # Tests unitaires seulement
npm run test:watch        # Mode watch (développement)
npm run test:coverage     # Coverage report
```

---

**Voir documentation complète**: Ce fichier sera mis à jour dans Phase 2.
