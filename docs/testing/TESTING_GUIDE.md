# Guide de Rédaction de Tests

Ce guide détaille comment écrire de bons tests pour le projet MasStock.

## Table des Matières

- [Principes Généraux](#principes-généraux)
- [Tests Backend (Jest)](#tests-backend-jest)
- [Tests Frontend (Vitest)](#tests-frontend-vitest)
- [Mocking](#mocking)
- [Tests Asynchrones](#tests-asynchrones)
- [Bonnes Pratiques](#bonnes-pratiques)
- [Anti-Patterns](#anti-patterns)

## Principes Généraux

### Structure AAA (Arrange-Act-Assert)

Tous les tests doivent suivre cette structure :

```javascript
it('devrait faire quelque chose', () => {
  // ARRANGE : Préparer les données et mocks
  const input = 'test';
  const expected = 'TEST';

  // ACT : Exécuter la fonction à tester
  const result = toUpperCase(input);

  // ASSERT : Vérifier le résultat
  expect(result).toBe(expected);
});
```

### Nommage des Tests

Utilisez des descriptions claires et précises :

```javascript
// ✅ BON : Descriptif et précis
it('devrait retourner une erreur 400 si l\'email est manquant', () => {});
it('devrait créer un workflow avec un statut "active" par défaut', () => {});

// ❌ MAUVAIS : Trop vague
it('test email', () => {});
it('workflow creation', () => {});
```

### Organisation des Tests

Regroupez les tests par fonctionnalité avec `describe` :

```javascript
describe('UserController', () => {
  describe('createUser', () => {
    it('devrait créer un utilisateur avec des données valides', () => {});
    it('devrait rejeter un email invalide', () => {});
    it('devrait générer un ID unique', () => {});
  });

  describe('deleteUser', () => {
    it('devrait supprimer un utilisateur existant', () => {});
    it('devrait retourner une erreur 404 pour un ID inexistant', () => {});
  });
});
```

## Tests Backend (Jest)

### Configuration

Les tests backend utilisent Jest avec la configuration dans `backend/jest.config.js`.

```javascript
// backend/src/__tests__/example.test.js

// Imports
const { myFunction } = require('../utils/myFunction');

// Mocks (si nécessaire)
jest.mock('../config/database');

describe('MonModule', () => {
  // Setup avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Tests...
});
```

### Tester un Controller

```javascript
// backend/src/__tests__/controllers/userController.test.js

const { createUser } = require('../../controllers/userController');
const { supabaseAdmin } = require('../../config/database');

jest.mock('../../config/database');

describe('UserController', () => {
  describe('createUser', () => {
    let req, res;

    beforeEach(() => {
      req = {
        body: {
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Mock Supabase
      supabaseAdmin.from = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'user-123',
                email: 'test@example.com',
                name: 'Test User',
              },
              error: null,
            }),
          }),
        }),
      });
    });

    it('devrait créer un utilisateur avec succès', async () => {
      await createUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: expect.objectContaining({
          email: 'test@example.com',
        }),
      });
    });

    it('devrait retourner une erreur si email manquant', async () => {
      req.body.email = undefined;

      await expect(createUser(req, res)).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('email'),
      });
    });
  });
});
```

### Tester un Middleware

```javascript
// backend/src/__tests__/middleware/auth.test.js

const { requireAuth } = require('../../middleware/auth');
const { verifyToken } = require('../../utils/jwt');

jest.mock('../../utils/jwt');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('devrait passer si token valide', async () => {
    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockResolvedValue({ userId: '123' });

    await requireAuth(req, res, next);

    expect(req.user).toEqual({ userId: '123' });
    expect(next).toHaveBeenCalled();
  });

  it('devrait rejeter si token manquant', async () => {
    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### Tester des Fonctions Utilitaires

```javascript
// backend/src/__tests__/utils/validation.test.js

const { validateEmail, sanitizeInput } = require('../../utils/validation');

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    // Tests paramétrés
    it.each([
      ['test@example.com', true],
      ['user+tag@domain.co.uk', true],
      ['invalid', false],
      ['@example.com', false],
      ['test@', false],
      [null, false],
      [undefined, false],
      ['', false],
    ])('validateEmail(%s) devrait retourner %s', (email, expected) => {
      expect(validateEmail(email)).toBe(expected);
    });
  });

  describe('sanitizeInput', () => {
    it('devrait retirer les scripts XSS', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).toBe('Hello');
      expect(result).not.toContain('<script>');
    });

    it('devrait préserver le HTML sûr', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeInput(input);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
    });
  });
});
```

## Tests Frontend (Vitest)

### Configuration

Les tests frontend utilisent Vitest avec React Testing Library.

```jsx
// frontend/src/__tests__/example.test.jsx

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MonComposant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait...', () => {
    // Test code
  });
});
```

### Tester un Composant

```jsx
// frontend/src/__tests__/components/Button.test.jsx

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('devrait afficher le texte fourni', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('devrait appeler onClick quand cliqué', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('devrait être désactivé quand disabled=true', () => {
    render(<Button disabled>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('devrait appliquer la classe CSS appropriée', () => {
    render(<Button variant="primary">Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('btn-primary');
  });
});
```

### Queries Testing Library (par ordre de priorité)

Utilisez toujours la query la plus accessible :

```jsx
// 1. getByRole (MEILLEUR pour l'accessibilité)
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('heading', { level: 1 });

// 2. getByLabelText (pour les formulaires)
screen.getByLabelText(/email address/i);
screen.getByLabelText(/password/i);

// 3. getByPlaceholderText (si pas de label)
screen.getByPlaceholderText(/enter your email/i);

// 4. getByText (pour le contenu visible)
screen.getByText(/welcome to masstock/i);
screen.getByText(/loading\.\.\./i);

// 5. getByDisplayValue (pour les inputs avec valeur)
screen.getByDisplayValue('john@example.com');

// 6. getByTestId (DERNIER RECOURS)
screen.getByTestId('user-card');
```

### Tester un Hook Personnalisé

```jsx
// frontend/src/__tests__/hooks/useAuth.test.jsx

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('devrait initialiser avec user null', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('devrait se connecter avec succès', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          user: { id: '1', email: 'test@example.com' },
          token: 'fake-token',
        }),
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.user).toEqual({
      id: '1',
      email: 'test@example.com',
    });
  });

  it('devrait gérer les erreurs de connexion', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong');
      } catch (error) {
        expect(error.message).toContain('Invalid credentials');
      }
    });
  });
});
```

### Tester un Composant avec Zustand Store

```jsx
// frontend/src/__tests__/components/UserProfile.test.jsx

import { render, screen } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';
import { UserProfile } from '@/components/UserProfile';

// Mock du store
vi.mock('@/store/authStore');

describe('UserProfile', () => {
  it('devrait afficher le profil de l\'utilisateur connecté', () => {
    // Mock des données du store
    useAuthStore.mockReturnValue({
      user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      logout: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('devrait afficher un message si non connecté', () => {
    useAuthStore.mockReturnValue({
      user: null,
      logout: vi.fn(),
    });

    render(<UserProfile />);

    expect(screen.getByText(/not logged in/i)).toBeInTheDocument();
  });
});
```

## Mocking

### Mocker un Module Complet

```javascript
// Backend (Jest)
jest.mock('../../config/database');
const { supabaseAdmin } = require('../../config/database');

// Frontend (Vitest)
vi.mock('@/services/api');
import { api } from '@/services/api';
```

### Mocker une Fonction Spécifique

```javascript
// Backend
const myFunction = jest.fn().mockReturnValue('mocked value');

// Frontend
const myFunction = vi.fn().mockReturnValue('mocked value');
```

### Mocker des Promises

```javascript
// Résolution réussie
mockFunction.mockResolvedValue({ data: 'success' });

// Rejet avec erreur
mockFunction.mockRejectedValue(new Error('Failed'));
```

### Mocker fetch

```javascript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

### Mocker axios

```javascript
import axios from 'axios';
vi.mock('axios');

axios.get.mockResolvedValue({
  data: { users: [] },
});
```

### Mocker React Router

```javascript
import { useNavigate } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
```

## Tests Asynchrones

### Async/Await

```javascript
it('devrait charger les données', async () => {
  const data = await fetchData();
  expect(data).toHaveLength(3);
});
```

### waitFor (Frontend)

```jsx
it('devrait charger les utilisateurs', async () => {
  render(<UserList />);

  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### findBy* (Frontend)

```jsx
it('devrait afficher le message de succès', async () => {
  render(<Form />);

  // findBy attend automatiquement
  expect(await screen.findByText(/success/i)).toBeInTheDocument();
});
```

## Bonnes Pratiques

### 1. Tests Indépendants

```javascript
// ✅ BON : Chaque test est indépendant
describe('Counter', () => {
  let counter;

  beforeEach(() => {
    counter = new Counter(); // Nouvelle instance à chaque fois
  });

  it('devrait incrémenter', () => {
    counter.increment();
    expect(counter.value).toBe(1);
  });

  it('devrait décrémenter', () => {
    counter.decrement();
    expect(counter.value).toBe(-1);
  });
});

// ❌ MAUVAIS : Les tests dépendent les uns des autres
describe('Counter', () => {
  const counter = new Counter(); // Partagé!

  it('devrait incrémenter', () => {
    counter.increment(); // value = 1
    expect(counter.value).toBe(1);
  });

  it('devrait décrémenter', () => {
    counter.decrement(); // value = 0 (dépend du test précédent!)
    expect(counter.value).toBe(-1); // ❌ ÉCHOUE
  });
});
```

### 2. Tester le Comportement, Pas l'Implémentation

```javascript
// ✅ BON : Teste le résultat
it('devrait doubler chaque nombre', () => {
  const result = double([1, 2, 3]);
  expect(result).toEqual([2, 4, 6]);
});

// ❌ MAUVAIS : Teste comment c'est fait
it('devrait utiliser map', () => {
  const spy = jest.spyOn(Array.prototype, 'map');
  double([1, 2, 3]);
  expect(spy).toHaveBeenCalled();
});
```

### 3. Tests Lisibles

```javascript
// ✅ BON : Clair et explicite
it('devrait rejeter un email invalide', () => {
  const result = validateEmail('not-an-email');
  expect(result.valid).toBe(false);
  expect(result.error).toBe('Invalid email format');
});

// ❌ MAUVAIS : Obscur
it('should work', () => {
  const r = v('abc');
  expect(r.v).toBe(false);
});
```

### 4. Un Test = Une Assertion Principale

```javascript
// ✅ BON : Focus sur une chose
it('devrait créer un utilisateur avec un ID', () => {
  const user = createUser({ name: 'John' });
  expect(user.id).toBeDefined();
});

it('devrait créer un utilisateur avec le nom fourni', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

// ⚠️ Acceptable : Assertions liées
it('devrait créer un utilisateur valide', () => {
  const user = createUser({ name: 'John' });
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('name', 'John');
  expect(user).toHaveProperty('createdAt');
});
```

## Anti-Patterns

### ❌ Tests trop fragiles

```javascript
// ❌ MAUVAIS : Teste la structure HTML exacte
expect(container.innerHTML).toBe('<div><span>Hello</span></div>');

// ✅ BON : Teste le contenu visible
expect(screen.getByText('Hello')).toBeInTheDocument();
```

### ❌ Tests qui testent la librairie

```javascript
// ❌ MAUVAIS : Teste que useState fonctionne
it('should update state', () => {
  const [value, setValue] = useState(0);
  setValue(1);
  expect(value).toBe(1); // Teste React, pas votre code
});
```

### ❌ Tests sans assertions

```javascript
// ❌ MAUVAIS : Pas d'assertion
it('should call function', () => {
  myFunction();
});

// ✅ BON : Vérifie le résultat
it('should call function and return value', () => {
  const result = myFunction();
  expect(result).toBe('expected');
});
```

### ❌ Ignorer les tests qui échouent

```javascript
// ❌ MAUVAIS
it.skip('should work eventually', () => {
  // Test qui échoue qu'on va "fixer plus tard"
});

// ✅ BON : Fixer le test ou le supprimer
```

## Debugger les Tests

### Afficher le DOM (Frontend)

```jsx
import { render, screen } from '@testing-library/react';

const { debug } = render(<MyComponent />);
debug(); // Affiche le DOM complet

screen.debug(); // Affiche l'élément actuel
```

### Console.log dans les Tests

```javascript
it('should debug', () => {
  console.log('Current value:', someVariable);
  expect(someVariable).toBe(expected);
});
```

### Mode Verbose

```bash
# Backend
npm test -- --verbose

# Frontend
npm test -- --reporter=verbose
```

## Couverture de Code

Objectif : **≥ 70%** pour branches, functions, lines, statements

```bash
# Générer le rapport
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/index.html
```

### Fichiers à exclure

- node_modules/
- Configuration files (*.config.js)
- Tests eux-mêmes (*test.js, *spec.js)
- Entry points (src/index.js, src/server.js)

## Checklist Avant de Commit

- [ ] Tous les tests passent (`npm test`)
- [ ] Couverture ≥ 70% (`npm run test:coverage`)
- [ ] Pas de `console.log` oubliés
- [ ] Pas de `it.skip` ou `it.only`
- [ ] Pas de tests commentés
- [ ] Lint passe (`npm run lint`)

## Ressources

- [TDD Workflow](./TDD_WORKFLOW.md)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Backend Tests Examples](../../backend/src/__tests__/)
- [Frontend Tests Examples](../../frontend/src/__tests__/)
