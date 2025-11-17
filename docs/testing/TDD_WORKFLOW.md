# Workflow TDD (Test-Driven Development)

## Introduction

Le TDD (Test-Driven Development) est une méthodologie de développement où **les tests sont écrits AVANT le code de production**. Cette approche garantit :

- ✅ Code testé à 100%
- ✅ Spécifications claires avant développement
- ✅ Refactoring sécurisé
- ✅ Documentation vivante via les tests
- ✅ Moins de bugs en production

## Le Cycle Rouge → Vert → Refactor

```
   ┌──────────────────────────────────────────┐
   │                                          │
   │   1. ROUGE ❌                            │
   │   Écrire un test qui échoue             │
   │                                          │
   └─────────────┬────────────────────────────┘
                 │
                 ▼
   ┌──────────────────────────────────────────┐
   │                                          │
   │   2. VERT ✅                             │
   │   Écrire le code minimum pour passer     │
   │                                          │
   └─────────────┬────────────────────────────┘
                 │
                 ▼
   ┌──────────────────────────────────────────┐
   │                                          │
   │   3. REFACTOR ♻️                         │
   │   Améliorer le code sans casser les tests│
   │                                          │
   └─────────────┬────────────────────────────┘
                 │
                 └──────────────┐
                                │
                                ▼
                        (Recommencer)
```

## Étape 1 : ROUGE ❌

**Objectif** : Écrire un test qui échoue car la fonctionnalité n'existe pas encore.

### Backend Exemple

```javascript
// backend/src/__tests__/controllers/userController.test.js

describe('UserController', () => {
  describe('createUser', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      // ARRANGE : Préparer les données
      const userData = {
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
      };

      // ACT : Appeler la fonction (qui n'existe pas encore!)
      const result = await createUser(userData);

      // ASSERT : Vérifier le résultat attendu
      expect(result).toHaveProperty('id');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('John Doe');
    });
  });
});
```

**Résultat** : ❌ Le test échoue → `createUser is not defined`

### Frontend Exemple

```jsx
// frontend/src/__tests__/components/UserCard.test.jsx

import { render, screen } from '@testing-library/react';
import { UserCard } from '@/components/UserCard';

describe('UserCard', () => {
  it('devrait afficher le nom de l\'utilisateur', () => {
    // ARRANGE
    const user = {
      name: 'John Doe',
      email: 'john@example.com',
    };

    // ACT
    render(<UserCard user={user} />);

    // ASSERT
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

**Résultat** : ❌ Le test échoue → `Module not found: UserCard`

## Étape 2 : VERT ✅

**Objectif** : Écrire le **code minimum** pour que le test passe.

### Backend Exemple

```javascript
// backend/src/controllers/userController.js

async function createUser(userData) {
  // Code minimum pour faire passer le test
  const newUser = {
    id: '123e4567-e89b-12d3-a456-426614174000', // UUID fictif
    email: userData.email,
    name: userData.name,
  };

  return newUser;
}

module.exports = { createUser };
```

**Résultat** : ✅ Le test passe !

### Frontend Exemple

```jsx
// frontend/src/components/UserCard.jsx

export function UserCard({ user }) {
  // Code minimum pour faire passer le test
  return (
    <div>
      <h2>{user.name}</h2>
    </div>
  );
}
```

**Résultat** : ✅ Le test passe !

## Étape 3 : REFACTOR ♻️

**Objectif** : Améliorer le code sans changer son comportement (les tests doivent toujours passer).

### Backend Exemple

```javascript
// backend/src/controllers/userController.js

const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/database');
const { logAudit } = require('../config/logger');

async function createUser(userData) {
  // REFACTORING : Vraie implémentation avec DB
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([
      {
        id: uuidv4(),
        email: userData.email,
        name: userData.name,
        role: userData.role || 'user',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  logAudit('user_created', data.id, { email: data.email });

  return data;
}

module.exports = { createUser };
```

**Vérification** : ✅ Les tests passent toujours !

### Frontend Exemple

```jsx
// frontend/src/components/UserCard.jsx

export function UserCard({ user }) {
  // REFACTORING : Ajouter du style et plus d'infos
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {user.name}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
      </div>
    </div>
  );
}
```

**Vérification** : ✅ Les tests passent toujours !

## Workflow Complet : Exemple Pratique

### Scénario : Ajouter une validation d'email

#### 1. ROUGE ❌ : Écrire le test

```javascript
// backend/src/__tests__/utils/validation.test.js

const { validateEmail } = require('../../utils/validation');

describe('validateEmail', () => {
  it('devrait accepter un email valide', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('devrait rejeter un email sans @', () => {
    expect(validateEmail('invalid')).toBe(false);
  });

  it('devrait rejeter un email null', () => {
    expect(validateEmail(null)).toBe(false);
  });
});
```

**Exécution** : `npm run test:watch`
**Résultat** : ❌ Tous les tests échouent

#### 2. VERT ✅ : Implémenter le minimum

```javascript
// backend/src/utils/validation.js

function validateEmail(email) {
  if (!email) return false;
  return email.includes('@');
}

module.exports = { validateEmail };
```

**Exécution** : `npm run test:watch` (toujours actif)
**Résultat** : ✅ Tous les tests passent !

#### 3. REFACTOR ♻️ : Améliorer

```javascript
// backend/src/utils/validation.js

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Regex plus robuste
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = { validateEmail };
```

**Résultat** : ✅ Tous les tests passent !

#### 4. Ajouter plus de tests (recommencer le cycle)

```javascript
it('devrait rejeter un email avec espaces', () => {
  expect(validateEmail('test @example.com')).toBe(false);
});

it('devrait rejeter un email sans domaine', () => {
  expect(validateEmail('test@')).toBe(false);
});
```

## Commandes Essentielles

### Backend (Jest)

```bash
# Mode watch (recommandé pour TDD)
npm run test:watch

# Exécuter un fichier spécifique
npm test validation.test.js

# Couverture
npm run test:coverage
```

### Frontend (Vitest)

```bash
# Mode watch (recommandé pour TDD)
npm run test:watch

# Mode UI (interface graphique)
npm run test:ui

# Exécuter un fichier spécifique
npm test UserCard.test.jsx

# Couverture
npm run test:coverage
```

## Bonnes Pratiques TDD

### ✅ À FAIRE

1. **Écrire le test AVANT le code**
   - Le test doit échouer initialement
   - C'est la preuve qu'il teste vraiment quelque chose

2. **Écrire le code minimum**
   - Ne pas over-engineer
   - Juste assez pour faire passer le test

3. **Refactorer régulièrement**
   - Améliorer le code tant que les tests passent
   - Garder le code propre et lisible

4. **Un test = une assertion principale**
   - Tester un comportement à la fois
   - Créer plusieurs tests si besoin

5. **Nommer les tests de façon descriptive**
   ```javascript
   // ✅ BON
   it('devrait retourner une erreur 400 si email manquant', () => {})

   // ❌ MAUVAIS
   it('test email', () => {})
   ```

6. **Utiliser le mode watch**
   - Feedback instantané
   - Cycle rouge-vert plus rapide

### ❌ À ÉVITER

1. **Écrire le code avant le test**
   - Défait tout l'intérêt du TDD

2. **Écrire beaucoup de tests d'un coup**
   - Cycle rouge → vert → refactor doit être court
   - Un test à la fois

3. **Ignorer les tests qui échouent**
   - Tous les tests doivent être verts avant de continuer
   - Pas de "je le ferai plus tard"

4. **Tester l'implémentation plutôt que le comportement**
   ```javascript
   // ❌ MAUVAIS : Teste l'implémentation
   expect(myFunction.toString()).toContain('for loop');

   // ✅ BON : Teste le comportement
   expect(myFunction([1,2,3])).toEqual([2,4,6]);
   ```

5. **Oublier de refactorer**
   - Le code devient vite illisible
   - La dette technique s'accumule

## Métriques de Succès

### Couverture de Code

Objectif minimum : **70%** sur :
- Branches
- Functions
- Lines
- Statements

```bash
# Vérifier la couverture
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

### Qualité des Tests

- ✅ Tests lisibles et compréhensibles
- ✅ Tests indépendants (pas de dépendances entre tests)
- ✅ Tests rapides (< 1 seconde par test unitaire)
- ✅ Tests déterministes (même résultat à chaque fois)

## TDD avec des Dépendances Externes

### Mocker les Dépendances

```javascript
// Mock de Supabase
jest.mock('../../config/database');
const { supabaseAdmin } = require('../../config/database');

beforeEach(() => {
  supabaseAdmin.from = jest.fn().mockReturnValue({
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: { id: '123', email: 'test@example.com' },
          error: null,
        }),
      }),
    }),
  });
});
```

## Exemple Complet : Ajouter une Feature

### Feature : Système de like pour les workflows

#### Étape 1 : Test Backend

```javascript
// backend/src/__tests__/controllers/workflowController.test.js

describe('likeWorkflow', () => {
  it('devrait liker un workflow', async () => {
    const req = {
      params: { id: 'workflow-123' },
      user: { id: 'user-123' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await likeWorkflow(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      likes: expect.any(Number),
    });
  });
});
```

#### Étape 2 : Implémentation Backend

```javascript
// backend/src/controllers/workflowController.js

async function likeWorkflow(req, res) {
  const { id } = req.params;
  const userId = req.user.id;

  // Insert like
  await supabaseAdmin
    .from('workflow_likes')
    .insert({ workflow_id: id, user_id: userId });

  // Count likes
  const { count } = await supabaseAdmin
    .from('workflow_likes')
    .select('*', { count: 'exact' })
    .eq('workflow_id', id);

  res.status(200).json({ success: true, likes: count });
}
```

#### Étape 3 : Test Frontend

```jsx
// frontend/src/__tests__/components/WorkflowCard.test.jsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowCard } from '@/components/WorkflowCard';

it('devrait afficher le bouton like', async () => {
  const workflow = { id: '1', name: 'Test', likes: 5 };

  render(<WorkflowCard workflow={workflow} />);

  expect(screen.getByRole('button', { name: /like/i })).toBeInTheDocument();
  expect(screen.getByText('5')).toBeInTheDocument();
});

it('devrait incrémenter les likes au clic', async () => {
  const workflow = { id: '1', name: 'Test', likes: 5 };
  const onLike = jest.fn();
  const user = userEvent.setup();

  render(<WorkflowCard workflow={workflow} onLike={onLike} />);

  await user.click(screen.getByRole('button', { name: /like/i }));

  expect(onLike).toHaveBeenCalledWith('1');
});
```

#### Étape 4 : Implémentation Frontend

```jsx
// frontend/src/components/WorkflowCard.jsx

export function WorkflowCard({ workflow, onLike }) {
  const [likes, setLikes] = useState(workflow.likes);

  const handleLike = async () => {
    await onLike(workflow.id);
    setLikes(likes + 1);
  };

  return (
    <div>
      <h3>{workflow.name}</h3>
      <button onClick={handleLike} aria-label="Like workflow">
        ❤️ {likes}
      </button>
    </div>
  );
}
```

## Conclusion

Le TDD peut sembler plus lent au début, mais il garantit :

- **Code de qualité** dès le premier jet
- **Confiance** pour refactorer
- **Documentation** via les tests
- **Moins de bugs** en production
- **Développement plus rapide** sur le long terme

**Règle d'or** : Si vous écrivez du code sans test, vous faites probablement une erreur.

## Ressources

- [Testing Guide](./TESTING_GUIDE.md)
- [Backend Tests](../../backend/src/__tests__/README.md)
- [Frontend Tests](../../frontend/src/__tests__/README.md)
- [Architecture](../ARCHITECTURE.md)
