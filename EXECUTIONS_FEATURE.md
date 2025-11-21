# Fonctionnalité de Visualisation des Exécutions de Workflows

## Vue d'ensemble

Cette fonctionnalité permet aux clients de visualiser toutes les exécutions de leurs workflows avec des détails complets, des filtres et des statistiques.

## Composants implémentés

### 1. Page Executions (`frontend/src/pages/Executions.jsx`)

Nouvelle page dédiée à la visualisation des exécutions de workflows avec les fonctionnalités suivantes :

#### Fonctionnalités principales :

- **Liste complète des exécutions** : Affichage de toutes les exécutions de workflows du client
- **Statistiques en temps réel** : Cartes de statistiques montrant :
  - Total des exécutions
  - Exécutions complétées
  - Exécutions en cours de traitement
  - Exécutions en attente
  - Exécutions échouées

- **Filtres avancés** :
  - Filtrage par statut (completed, processing, pending, failed)
  - Filtrage par workflow spécifique
  - Bouton "Clear Filters" pour réinitialiser

- **Modal de détails d'exécution** :
  - Statut et barre de progression
  - Date/heure de début et de fin
  - Durée d'exécution
  - Données d'entrée (input_data) formatées en JSON
  - Données de sortie (output_data) formatées en JSON
  - Messages d'erreur (si applicable)
  - Nombre de tentatives (retry_count)
  - Bouton "View Workflow" pour naviguer vers le workflow

#### Navigation :
- Bouton "Back to Workflows" pour retourner à la liste des workflows
- Clic sur une exécution pour afficher les détails
- Navigation vers le workflow depuis le modal de détails

### 2. Routes ajoutées (`frontend/src/App.jsx`)

```javascript
<Route
  path="/executions"
  element={
    <ProtectedRoute>
      <Executions />
    </ProtectedRoute>
  }
/>
```

### 3. Navigation mise à jour (`frontend/src/components/layout/Sidebar.jsx`)

Ajout d'un lien "Executions" dans la sidebar avec l'icône 🚀

### 4. Styles CSS (`frontend/src/styles/global.css`)

Ajout de nouveaux styles pour :
- **Modals** : `.modal-overlay`, `.modal-content`, `.modal-header`, `.modal-body`, `.modal-footer`
- **Code blocks** : `.code-block` pour afficher les données JSON
- **Progress bars** : `.progress-bar`, `.progress-fill`
- **Utility classes** : `.cursor-pointer`, `.hover-shadow`, `.hover-bg-neutral-100`, etc.

### 5. Tests (`frontend/src/pages/__tests__/Executions.test.jsx`)

Suite de tests complète couvrant :
- Rendu du composant
- Affichage des exécutions
- Comptage des statuts
- Filtrage par statut et par workflow
- Ouverture/fermeture du modal de détails
- Affichage des erreurs
- Navigation
- Gestion des états vides
- Gestion des erreurs API

## API Endpoints utilisés

### Backend existant :

1. **GET /api/workflows** - Liste tous les workflows
2. **GET /api/workflows/:workflow_id/executions** - Liste les exécutions d'un workflow
3. **GET /api/executions/:execution_id** - Détails d'une exécution spécifique
4. **GET /api/executions/:execution_id/batch-results** - Résultats batch (pour workflows spéciaux)

## Modèle de données

### Workflow Execution (backend/database/migrations/001_create_tables.sql)

```sql
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    client_id UUID REFERENCES clients(id),
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    error_stack_trace TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Utilisation

### Pour les utilisateurs :

1. **Accéder à la page** : Cliquer sur "Executions" 🚀 dans la sidebar
2. **Voir les statistiques** : Les cartes en haut affichent un résumé des exécutions
3. **Filtrer** :
   - Utiliser le dropdown "Status" pour filtrer par statut
   - Utiliser le dropdown "Workflow" pour filtrer par workflow spécifique
   - Cliquer sur une carte de statistique pour filtrer rapidement
4. **Voir les détails** : Cliquer sur une exécution pour ouvrir le modal de détails
5. **Naviguer** : Utiliser "View Workflow" pour accéder au workflow concerné

### Pour les développeurs :

#### Service utilisé :
```javascript
import { workflowService } from '../services/workflows'

// Lister les workflows
const { workflows } = await workflowService.list()

// Obtenir les exécutions d'un workflow
const { executions } = await workflowService.getExecutions(workflowId)

// Obtenir les détails d'une exécution
const { data } = await workflowService.getExecution(executionId)
```

## Structure du code

```
frontend/src/
├── pages/
│   ├── Executions.jsx                    # Page principale
│   └── __tests__/
│       └── Executions.test.jsx          # Tests
├── components/
│   └── layout/
│       └── Sidebar.jsx                   # Navigation mise à jour
├── services/
│   └── workflows.js                      # Service API (existant)
├── styles/
│   └── global.css                        # Styles CSS (mis à jour)
└── App.jsx                               # Routes (mis à jour)
```

## Statuts des exécutions

- **pending** 🔵 : En attente de traitement
- **processing** 🟡 : En cours de traitement
- **completed** 🟢 : Terminée avec succès
- **failed** 🔴 : Échouée avec erreur

## Améliorations futures possibles

1. **Pagination** : Pour gérer un grand nombre d'exécutions
2. **Recherche** : Recherche par ID ou date
3. **Tri** : Trier par date, durée, statut
4. **Export** : Exporter les résultats en CSV/JSON
5. **Graphiques** : Visualisation graphique des tendances
6. **Rafraîchissement auto** : Mise à jour automatique pour les exécutions en cours
7. **Notifications** : Alertes pour les exécutions échouées
8. **Retry** : Bouton pour relancer une exécution échouée
9. **Filtres de date** : Filtrer par plage de dates
10. **Batch results viewer** : Visualisation améliorée pour les résultats batch

## Conformité avec les règles du projet

✅ **Pure CSS uniquement** : Aucune classe Tailwind utilisée
✅ **TDD** : Tests écrits pour tous les scénarios
✅ **Sécurité** : Authentification requise via ProtectedRoute
✅ **Architecture** : Suit le pattern Pages → Components → Services
✅ **RLS** : Les données sont filtrées par client_id au niveau backend

## Accès à la fonctionnalité

**URL** : http://localhost:5173/executions (après connexion)

**Navigation** : Dashboard → Sidebar → Executions 🚀
