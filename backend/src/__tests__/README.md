# Tests Unitaires Backend

Ce dossier contient tous les tests unitaires pour le backend MasStock.

## Structure

```
__tests__/
├── controllers/     # Tests des contrôleurs
├── middleware/      # Tests des middlewares
├── utils/           # Tests des fonctions utilitaires
└── README.md        # Ce fichier
```

## Exécuter les tests

```bash
# Exécuter tous les tests
npm test

# Exécuter uniquement les tests unitaires (sans coverage)
npm run test:unit

# Exécuter les tests en mode watch (re-exécute automatiquement)
npm run test:watch

# Générer un rapport de couverture
npm run test:coverage
```

## Workflow TDD (Test-Driven Development)

### Cycle Rouge → Vert → Refactor

1. **Rouge** ❌ : Écrire un test qui échoue
2. **Vert** ✅ : Écrire le code minimum pour que le test passe
3. **Refactor** ♻️ : Améliorer le code sans changer le comportement

### Exemple pratique

```javascript
// 1. ROUGE : Écrire le test d'abord
describe('calculateTotal', () => {
  it('devrait calculer le total avec TVA', () => {
    const result = calculateTotal(100, 0.20);
    expect(result).toBe(120);
  });
});

// 2. VERT : Implémenter la fonction
function calculateTotal(price, taxRate) {
  return price + (price * taxRate);
}

// 3. REFACTOR : Améliorer si nécessaire
function calculateTotal(price, taxRate) {
  if (price < 0 || taxRate < 0) {
    throw new Error('Values must be positive');
  }
  return price * (1 + taxRate);
}
```

## Bonnes pratiques

### 1. Nommage des tests

```javascript
// ✅ BON : Descriptif et clair
it('devrait retourner une erreur 400 si email manquant', () => { ... });

// ❌ MAUVAIS : Trop vague
it('test login', () => { ... });
```

### 2. Structure AAA

```javascript
it('devrait authentifier un utilisateur', async () => {
  // ARRANGE : Préparer les données
  const email = 'test@example.com';
  const password = 'password123';

  // ACT : Exécuter la fonction
  const result = await login(email, password);

  // ASSERT : Vérifier le résultat
  expect(result).toHaveProperty('token');
  expect(result.user.email).toBe(email);
});
```

### 3. Tester les cas d'erreur

```javascript
describe('validateEmail', () => {
  // Cas normal
  it('devrait valider un email correct', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  // Cas d'erreur
  it('devrait rejeter un email sans @', () => {
    expect(validateEmail('invalid')).toBe(false);
  });

  it('devrait rejeter null', () => {
    expect(validateEmail(null)).toBe(false);
  });

  it('devrait rejeter une chaîne vide', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

### 4. Mocker les dépendances

```javascript
// Mock de Supabase
jest.mock('../../config/database');
const { supabaseAdmin } = require('../../config/database');

// Mock d'une méthode
supabaseAdmin.auth.signInWithPassword = jest.fn().mockResolvedValue({
  data: { user: { id: '123' } },
  error: null,
});

// Vérifier que le mock a été appelé
expect(supabaseAdmin.auth.signInWithPassword).toHaveBeenCalledWith({
  email: 'test@example.com',
  password: 'password123',
});
```

## Couverture de code

Notre objectif est d'atteindre au minimum 70% de couverture sur :
- Branches
- Fonctions
- Lignes
- Statements

Vérifiez la couverture avec :

```bash
npm run test:coverage
```

Le rapport HTML sera généré dans `coverage/index.html`.

## Commandes Jest utiles

```bash
# Exécuter un fichier de test spécifique
npm test authController.test.js

# Exécuter les tests contenant un pattern
npm test -- --testNamePattern="login"

# Mode watch avec couverture
npm test -- --watch --coverage

# Verbose mode
npm test -- --verbose

# Mise à jour des snapshots
npm test -- -u
```

## Avant de commit

```bash
# Exécuter tous les tests
npm test

# Vérifier que la couverture est ≥ 70%
npm run test:coverage
```

Si les tests échouent, ne commitez pas ! Corrigez d'abord les tests ou le code.

## Ressources

- [Documentation Jest](https://jestjs.io/docs/getting-started)
- [Guide TDD](../../docs/testing/TDD_WORKFLOW.md)
- [Guide de tests](../../docs/testing/TESTING_GUIDE.md)
