# Tests Unitaires Frontend

Ce dossier contient tous les tests unitaires pour le frontend MasStock (React + Vite).

## Structure

```
__tests__/
├── components/      # Tests des composants React
├── hooks/           # Tests des hooks personnalisés
├── utils/           # Tests des fonctions utilitaires
└── README.md        # Ce fichier
```

## Exécuter les tests

```bash
# Exécuter tous les tests avec couverture
npm test

# Exécuter uniquement les tests unitaires (sans coverage)
npm run test:unit

# Mode watch (re-exécute automatiquement les tests)
npm run test:watch

# Générer un rapport de couverture détaillé
npm run test:coverage

# Interface utilisateur interactive (recommandé pour le développement)
npm run test:ui
```

## Workflow TDD (Test-Driven Development)

### Cycle Rouge → Vert → Refactor

1. **Rouge** ❌ : Écrire un test qui échoue
2. **Vert** ✅ : Écrire le code minimum pour que le test passe
3. **Refactor** ♻️ : Améliorer le code sans changer le comportement

### Exemple avec un composant React

```jsx
// 1. ROUGE : Écrire le test d'abord
import { render, screen } from '@testing-library/react';
import { LoginForm } from '../components/LoginForm';

it('devrait afficher les champs email et password', () => {
  render(<LoginForm />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

// 2. VERT : Créer le composant minimum
export function LoginForm() {
  return (
    <form>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />
      <label htmlFor="password">Password</label>
      <input id="password" type="password" />
    </form>
  );
}

// 3. REFACTOR : Améliorer (styling, validation, etc.)
```

## Guide des tests par type

### 1. Tests de composants

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('devrait gérer les clics', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Tests de hooks

```jsx
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

describe('useCounter', () => {
  it('devrait incrémenter le compteur', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### 3. Tests de fonctions utilitaires

```jsx
import { formatPrice } from '@/utils/formatting';

describe('formatPrice', () => {
  it('devrait formater correctement', () => {
    expect(formatPrice(1234.56)).toBe('1 234,56 €');
  });
});
```

## Queries Testing Library (par ordre de priorité)

Utilisez toujours la query la plus accessible :

1. **getByRole** (meilleur pour l'accessibilité)
   ```jsx
   screen.getByRole('button', { name: /submit/i })
   screen.getByRole('textbox', { name: /email/i })
   ```

2. **getByLabelText** (pour les formulaires)
   ```jsx
   screen.getByLabelText(/email/i)
   ```

3. **getByPlaceholderText** (si pas de label)
   ```jsx
   screen.getByPlaceholderText(/enter your email/i)
   ```

4. **getByText** (pour le contenu visible)
   ```jsx
   screen.getByText(/welcome/i)
   ```

5. **getByTestId** (en dernier recours)
   ```jsx
   <div data-testid="user-card">...</div>
   screen.getByTestId('user-card')
   ```

## Mocker les dépendances

### Mocker un module entier

```jsx
vi.mock('@/services/api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'Test' })),
}));
```

### Mocker fetch

```jsx
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'test' }),
  })
);
```

### Mocker useNavigate (React Router)

```jsx
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
```

### Mocker Zustand store

```jsx
import { useAuthStore } from '@/store/authStore';

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// Dans le test
useAuthStore.mockReturnValue({
  user: { id: 1, name: 'Test' },
  logout: vi.fn(),
});
```

## Snapshot Testing

```jsx
import { render } from '@testing-library/react';
import { Card } from '@/components/Card';

it('devrait correspondre au snapshot', () => {
  const { container } = render(<Card title="Test" />);
  expect(container.firstChild).toMatchSnapshot();
});

// Mettre à jour les snapshots
npm test -- -u
```

## Tests asynchrones

```jsx
import { waitFor, screen } from '@testing-library/react';

it('devrait charger les données', async () => {
  render(<UserProfile id="1" />);

  // Attendre qu'un élément apparaisse
  await waitFor(() => {
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  // Ou utiliser findBy (recommandé)
  expect(await screen.findByText(/john doe/i)).toBeInTheDocument();
});
```

## Couverture de code

Notre objectif est d'atteindre au minimum 70% de couverture sur :
- Branches
- Fonctions
- Lignes
- Statements

```bash
# Générer le rapport
npm run test:coverage

# Ouvrir le rapport HTML
open coverage/index.html
```

## Commandes Vitest utiles

```bash
# Exécuter un fichier spécifique
npm test Button.test.jsx

# Exécuter les tests qui correspondent à un pattern
npm test -- --grep="login"

# Mode UI (interface graphique)
npm run test:ui

# Verbose mode
npm test -- --reporter=verbose

# Watch mode avec interface
npm run test:watch
```

## Debugging

### Afficher le DOM rendu

```jsx
import { render, screen } from '@testing-library/react';

const { debug } = render(<MyComponent />);
debug(); // Affiche le DOM complet
screen.debug(); // Affiche l'élément courant
```

### Utiliser console.log dans les tests

```jsx
it('devrait...', () => {
  console.log('État actuel:', result.current);
  // Les logs s'affichent dans le terminal
});
```

## Avant de commit

```bash
# 1. Exécuter tous les tests
npm test

# 2. Vérifier la couverture ≥ 70%
npm run test:coverage

# 3. Linter le code
npm run lint
```

Si les tests échouent, ne commitez pas ! Corrigez d'abord.

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Guide TDD](../../../docs/testing/TDD_WORKFLOW.md)
- [Guide de tests](../../../docs/testing/TESTING_GUIDE.md)

## Exemples disponibles

- `components/Button.test.jsx` - Test d'un composant simple
- `hooks/useAuth.test.jsx` - Test d'un hook personnalisé
- `utils/formatting.test.js` - Test de fonctions utilitaires
