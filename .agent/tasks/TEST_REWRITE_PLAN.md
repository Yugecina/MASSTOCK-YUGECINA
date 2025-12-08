# 🚀 Plan de Réécriture Complète des Tests - Option 2

**Date de début**: 8 décembre 2025
**Durée estimée**: 6-8 jours (48-64h)
**Approche**: Test-Driven Development (TDD) moderne

---

## 🎯 Objectifs

1. ✅ **Supprimer** tous les tests obsolètes (85% backend)
2. ✅ **Réécrire** avec approche TDD moderne
3. ✅ **Réduire** le code de test de ~60% (plus simple = plus maintenable)
4. ✅ **Atteindre** >70% de couverture
5. ✅ **Créer** une foundation solide pour TDD futur

---

## 📋 Plan d'Exécution

### Phase 1: Nettoyage & Préparation (Jour 1 - 8h)

#### 1.1 Supprimer les tests obsolètes

**Backend** (à supprimer):
```
backend/src/__tests__/
├── controllers/          # 11 fichiers - SUPPRIMER
│   ├── adminController.test.ts
│   ├── adminUserController.test.ts
│   ├── adminWorkflowController.test.ts
│   ├── analyticsController.test.ts
│   ├── authController.test.ts
│   ├── authController.complete.test.ts
│   ├── authController.refresh.test.ts
│   ├── supportTicketsController.test.ts
│   ├── workflowRequestsController.test.ts
│   └── workflowsController.test.ts
├── routes/               # 6 fichiers - SUPPRIMER
├── middleware/           # 4 fichiers - SUPPRIMER (garder auth.test.ts)
├── workers/              # 2 fichiers - SUPPRIMER
├── queues/               # 1 fichier - SUPPRIMER
└── integration/          # 1 fichier - SUPPRIMER
```

**Frontend** (à ajuster):
```
frontend/src/__tests__/
├── components/admin/
│   ├── RevenueChart.test.tsx      # RÉÉCRIRE
│   ├── SuccessChart.test.tsx      # RÉÉCRIRE
│   ├── TrendChart.test.tsx        # RÉÉCRIRE
│   └── WorkflowTable.test.tsx     # RÉÉCRIRE
```

**Action**:
```bash
# Backend
rm -rf backend/src/__tests__/controllers/*
rm -rf backend/src/__tests__/routes/*
rm -rf backend/src/__tests__/middleware/*.complete.test.ts
rm -rf backend/src/__tests__/workers/*
rm -rf backend/src/__tests__/queues/*
rm -rf backend/src/__tests__/integration/*

# Garder uniquement:
# - backend/src/__tests__/middleware/auth.test.ts
# - backend/src/__tests__/utils/helpers.test.ts
# - backend/src/__tests__/config/redis.test.ts
```

#### 1.2 Créer structure de tests moderne

**Nouvelle structure**:
```
backend/src/__tests__/
├── __helpers__/              # Helpers de tests partagés
│   ├── supabase-mock.ts     # Mock factory Supabase
│   ├── express-mock.ts      # Mock factory Express
│   ├── fixtures.ts          # Données de test
│   └── setup.ts             # Configuration globale
├── unit/                     # Tests unitaires purs
│   ├── middleware/
│   ├── utils/
│   └── services/
├── integration/              # Tests d'intégration
│   ├── auth.integration.test.ts
│   ├── workflows.integration.test.ts
│   └── admin.integration.test.ts
└── e2e/                      # Tests end-to-end
    ├── auth-flow.e2e.test.ts
    ├── workflow-execution.e2e.test.ts
    └── admin-operations.e2e.test.ts
```

**Principes**:
1. **Unit tests** : Aucun mock externe (utils, helpers purs)
2. **Integration tests** : Mocks minimalistes (controllers + DB)
3. **E2E tests** : Pas de mocks (API complète)

---

### Phase 2: Tests End-to-End (Jour 2-3 - 16h)

#### 2.1 Setup E2E Testing

**Créer**: `backend/src/__tests__/__helpers__/e2e-setup.ts`

```typescript
import { supabaseAdmin } from '../../config/database';
import app from '../../server';

export async function setupE2ETest() {
  // Créer une base de test isolée
  const testClientId = `test-client-${Date.now()}`;

  // Nettoyer avant chaque test
  await cleanupTestData(testClientId);

  return { app, testClientId };
}

export async function cleanupTestData(clientId: string) {
  await supabaseAdmin
    .from('executions')
    .delete()
    .eq('client_id', clientId);

  await supabaseAdmin
    .from('workflows')
    .delete()
    .eq('client_id', clientId);

  await supabaseAdmin
    .from('users')
    .delete()
    .eq('client_id', clientId);
}
```

#### 2.2 Test: Auth Flow (Priorité 1)

**Créer**: `backend/src/__tests__/e2e/auth-flow.e2e.test.ts`

**Scénarios**:
1. ✅ Login avec credentials valides
2. ✅ Login avec credentials invalides
3. ✅ Refresh token automatique
4. ✅ Logout et suppression cookies
5. ✅ Protection des routes avec middleware

**Estimation**: 4h

#### 2.3 Test: Workflow Execution (Priorité 2)

**Créer**: `backend/src/__tests__/e2e/workflow-execution.e2e.test.ts`

**Scénarios**:
1. ✅ Créer un workflow
2. ✅ Exécuter un workflow (avec queue)
3. ✅ Vérifier le statut d'exécution
4. ✅ Récupérer les résultats
5. ✅ Gérer les erreurs d'exécution

**Estimation**: 6h

#### 2.4 Test: Admin Operations (Priorité 3)

**Créer**: `backend/src/__tests__/e2e/admin-operations.e2e.test.ts`

**Scénarios**:
1. ✅ Créer un client
2. ✅ Créer un utilisateur
3. ✅ Assigner un workflow à un client
4. ✅ Consulter les analytics
5. ✅ Gérer les permissions

**Estimation**: 6h

---

### Phase 3: Tests d'Intégration (Jour 4-5 - 16h)

#### 3.1 Setup Integration Testing

**Créer**: `backend/src/__tests__/__helpers__/integration-setup.ts`

```typescript
import { supabaseAdmin } from '../../config/database';

export function createSupabaseMock() {
  return {
    from: jest.fn((table: string) => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
  };
}

export function createExpressMocks() {
  return {
    req: {
      body: {},
      query: {},
      params: {},
      headers: {},
      user: null,
    },
    res: {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    },
    next: jest.fn(),
  };
}
```

#### 3.2 Tests: Controllers Critiques

**Créer**: `backend/src/__tests__/integration/workflows.integration.test.ts`

**Focus**:
- `workflowsController.getWorkflows()`
- `workflowsController.executeWorkflow()`
- `workflowsController.getExecutionStatus()`

**Estimation**: 6h

**Créer**: `backend/src/__tests__/integration/auth.integration.test.ts`

**Focus**:
- `authController.login()`
- `authController.refresh()`
- `authController.logout()`

**Estimation**: 4h

**Créer**: `backend/src/__tests__/integration/admin.integration.test.ts`

**Focus**:
- `adminController.getClients()`
- `adminUserController.createUser()`
- `adminWorkflowController.assignWorkflow()`

**Estimation**: 6h

---

### Phase 4: Tests Unitaires (Jour 5-6 - 16h)

#### 4.1 Tests: Middleware

**Garder**: `backend/src/__tests__/unit/middleware/auth.test.ts` (déjà OK)

**Créer**: `backend/src/__tests__/unit/middleware/errorHandler.test.ts`

**Créer**: `backend/src/__tests__/unit/middleware/rateLimit.test.ts`

**Estimation**: 4h

#### 4.2 Tests: Utils & Helpers

**Garder**: `backend/src/__tests__/unit/utils/helpers.test.ts` (déjà OK)

**Créer**: `backend/src/__tests__/unit/utils/encryption.test.ts`

**Créer**: `backend/src/__tests__/unit/utils/promptParser.test.ts`

**Créer**: `backend/src/__tests__/unit/utils/workflowLogger.test.ts`

**Estimation**: 4h

#### 4.3 Tests: Services

**Créer**: `backend/src/__tests__/unit/services/geminiImageService.test.ts`

**Focus**:
- Génération d'images
- Gestion des erreurs API
- Rate limiting

**Estimation**: 4h

#### 4.4 Tests: Workers & Queues

**Créer**: `backend/src/__tests__/unit/workers/workflow-worker.test.ts`

**Focus**:
- Processing de jobs
- Gestion d'erreurs
- Progress tracking

**Estimation**: 4h

---

### Phase 5: Tests Frontend (Jour 7 - 8h)

#### 5.1 Fixer les tests CSS/Charts

**Créer**: `frontend/vitest-setup.ts`

```typescript
import { beforeAll, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock CSS variables
beforeAll(() => {
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      getPropertyValue: (prop: string) => {
        const cssVars: Record<string, string> = {
          '--spacing-md': '16px',
          '--font-size-body-sm': '14px',
          '--neutral-600': '#666',
          '--neutral-900': '#111',
        };
        return cssVars[prop] || '';
      },
    }),
  });

  // Mock Intl.NumberFormat pour formatage monétaire
  const mockFormat = vi.fn((num) => `$${num.toFixed(2)}`);
  vi.spyOn(Intl, 'NumberFormat').mockImplementation(() => ({
    format: mockFormat,
  } as any));
});
```

**Réécrire**:
- `RevenueChart.test.tsx` - Focus sur données, pas rendu
- `SuccessChart.test.tsx` - Focus sur données, pas rendu
- `TrendChart.test.tsx` - Focus sur données, pas rendu
- `WorkflowTable.test.tsx` - Tester comportement, pas formatage

**Estimation**: 4h

#### 5.2 Vérifier tous les tests passent

```bash
cd frontend && npm test
# Target: 34/34 suites passent (100%)
```

**Estimation**: 2h

---

### Phase 6: Coverage & Documentation (Jour 8 - 8h)

#### 6.1 Vérifier la couverture

```bash
cd backend && npm run test:coverage
```

**Target**:
- Branches: ≥70%
- Functions: ≥70%
- Lines: ≥70%
- Statements: ≥70%

**Si < 70%**: Ajouter tests manquants

**Estimation**: 4h

#### 6.2 Documentation

**Créer**: `backend/src/__tests__/README.md`

```markdown
# Tests Backend - MasStock

## Structure

- `__helpers__/` - Mocks et fixtures partagés
- `unit/` - Tests unitaires (pas de mocks externes)
- `integration/` - Tests d'intégration (mocks minimaux)
- `e2e/` - Tests end-to-end (pas de mocks)

## Commandes

```bash
npm test              # Tous les tests
npm run test:unit     # Tests unitaires seulement
npm run test:e2e      # Tests E2E seulement
npm run test:watch    # Mode watch
npm run test:coverage # Coverage report
```

## Écrire un nouveau test

### Test Unitaire
```typescript
import { myFunction } from '../../utils/myFunction';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### Test d'Intégration
```typescript
import { setupIntegrationTest } from '../__helpers__/integration-setup';
import { myController } from '../../controllers/myController';

describe('myController Integration', () => {
  const { req, res, supabaseMock } = setupIntegrationTest();

  it('should handle request', async () => {
    await myController.myMethod(req, res);
    expect(res.json).toHaveBeenCalled();
  });
});
```

### Test E2E
```typescript
import request from 'supertest';
import { setupE2ETest } from '../__helpers__/e2e-setup';

describe('My Feature E2E', () => {
  const { app, cleanup } = setupE2ETest();

  afterAll(async () => await cleanup());

  it('should work end-to-end', async () => {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
  });
});
```
```

**Estimation**: 2h

#### 6.3 Créer GitHub Issue

**Créer issue**: "Test Suite Rewrite - Complete Implementation"

**Template**:
```markdown
## Context
Migration TypeScript has broken 85% of backend tests due to incompatible mocks.

## Decision
Option 2: Complete rewrite with modern TDD approach

## Implementation Plan
- [ ] Phase 1: Cleanup & Setup (Day 1)
- [ ] Phase 2: E2E Tests (Days 2-3)
- [ ] Phase 3: Integration Tests (Days 4-5)
- [ ] Phase 4: Unit Tests (Days 5-6)
- [ ] Phase 5: Frontend Fixes (Day 7)
- [ ] Phase 6: Coverage & Docs (Day 8)

## Success Criteria
- ✅ 100% test suites pass
- ✅ >70% code coverage
- ✅ Modern, maintainable test code
- ✅ TDD foundation for future development

## Estimated Effort
6-8 days (48-64h)

## Files Changed
- ~22 backend test files deleted
- ~15 new test files created
- ~3,000 lines of new test code
```

**Estimation**: 2h

---

## 📊 Timeline Détaillé

| Jour | Phase | Tâches | Heures | Cumul |
|------|-------|--------|--------|-------|
| **J1** | Phase 1 | Nettoyage + Setup | 8h | 8h |
| **J2** | Phase 2 | E2E Auth + Workflows | 8h | 16h |
| **J3** | Phase 2 | E2E Admin + Fixes | 8h | 24h |
| **J4** | Phase 3 | Integration Workflows + Auth | 8h | 32h |
| **J5** | Phase 3 | Integration Admin + Unit Middleware | 8h | 40h |
| **J6** | Phase 4 | Unit Utils + Services + Workers | 8h | 48h |
| **J7** | Phase 5 | Frontend Fixes + Vérification | 8h | 56h |
| **J8** | Phase 6 | Coverage + Documentation | 8h | 64h |

**Total**: 64h (8 jours) - Planning pessimiste
**Optimiste**: 48h (6 jours) - Si phases 4-5 plus rapides

---

## 🎯 Livrables Finaux

### Code
- ✅ ~15 nouveaux fichiers de tests
- ✅ 3,000-4,000 lignes de code de test
- ✅ Mock factories réutilisables
- ✅ Helpers et fixtures partagés

### Tests
- ✅ 3-4 tests E2E critiques
- ✅ 8-10 tests d'intégration
- ✅ 15-20 tests unitaires
- ✅ 6 tests frontend fixés

### Documentation
- ✅ README.md des tests
- ✅ Exemples de patterns
- ✅ Guide pour écrire nouveaux tests

### Qualité
- ✅ 100% des suites passent
- ✅ >70% de couverture de code
- ✅ CI/CD intégré
- ✅ Pre-commit hooks

---

## 🚀 Prochaine Action Immédiate

**Je recommande de commencer maintenant par Phase 1** :

1. Supprimer les tests obsolètes
2. Créer la nouvelle structure
3. Créer les premiers helpers

**Voulez-vous que je commence ?**

Options:
- **A)** Oui, démarre Phase 1 maintenant
- **B)** Crée d'abord la GitHub Issue
- **C)** Montre-moi un exemple de test E2E d'abord
- **D)** Autre chose

---

**Généré avec Claude Code - 8 décembre 2025**
