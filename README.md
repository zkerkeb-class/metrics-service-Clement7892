# Service de Métriques de Performance

Ce service collecte et expose les métriques de performance de l'application CRM, incluant les requêtes HTTP, les opérations MongoDB, et l'utilisation de la bande passante.

## 🚀 Fonctionnalités

### Métriques Collectées

- **Requêtes HTTP** : méthode, chemin, code de statut, durée, taille de réponse
- **Opérations MongoDB** : type d'opération, collection, durée, succès/échec
- **Bande passante** : octets entrants/sortants, requêtes par seconde
- **Distributions** : répartition des requêtes par endpoint et codes de statut
- **Performances** : temps de réponse moyen, taux de succès par endpoint

### Périodes de Temps

- **Temps réel** : dernières 5 minutes (auto-refresh)
- **Dernière heure** : métriques de la dernière heure
- **Dernières 24h** : métriques des dernières 24 heures
- **Période personnalisée** : métriques pour une période spécifique

## 📊 API Endpoints

### Métriques Générales

```http
GET /api/metrics/realtime
GET /api/metrics/last-hour
GET /api/metrics/last-24-hours
GET /api/metrics/custom?start=2024-01-01T00:00:00Z&end=2024-01-02T00:00:00Z
```

### Distributions et Analyses

```http
GET /api/metrics/distribution/requests?period=last24Hours
GET /api/metrics/distribution/status?period=last24Hours
GET /api/metrics/performance/endpoints?period=last24Hours
```

### Enregistrement de Métriques

```http
POST /api/metrics/record/request
POST /api/metrics/record/mongo
POST /api/metrics/record/bandwidth
```

## 🛠️ Installation et Configuration

### Variables d'Environnement

```env
# Configuration du serveur
PORT=3004
NODE_ENV=development

# JWT
JWT_SECRET=your-jwt-secret

# Services surveillés
AUTH_SERVICE_URL=http://localhost:3001
DATABASE_SERVICE_URL=http://localhost:3002
EMAIL_SERVICE_URL=http://localhost:3003

# Notifications Discord
DISCORD_WEBHOOK_URL=your-discord-webhook-url
```

### Installation

```bash
npm install
npm run dev
```

## 🔧 Intégration avec d'Autres Services

### Middleware de Métriques

Ajoutez les middlewares de métriques à vos services :

```typescript
import {
  metricsMiddleware,
  bandwidthMiddleware
} from "./middlewares/metrics.middleware";

// Dans votre app.ts
app.use(metricsMiddleware);
app.use(bandwidthMiddleware);
```

### Métriques MongoDB

Utilisez le décorateur pour les opérations MongoDB :

```typescript
import { withMongoMetrics } from "./middlewares/metrics.middleware";

class UserService {
  @withMongoMetrics("find", "users")
  async findUsers() {
    return await User.find();
  }

  @withMongoMetrics("create", "users")
  async createUser(userData) {
    return await User.create(userData);
  }
}
```

### Envoi Manuel de Métriques

```typescript
import { MongoMetricsCollector } from "./middlewares/metrics.middleware";

const collector = MongoMetricsCollector.getInstance();

await collector.recordMongoOperation({
  operation: "find",
  collection: "users",
  duration: 150,
  success: true
});
```

## 📈 Frontend - Tableau de Bord

### Installation des Hooks

```typescript
import {
  useMetrics,
  useRealTimeMetrics,
  useRequestDistribution
} from "../hooks/useMetrics";

// Utilisation basique
const { data, loading, error } = useMetrics("last24Hours");

// Métriques temps réel
const realTimeData = useRealTimeMetrics(5000); // Refresh toutes les 5 secondes

// Distribution des requêtes
const { distribution } = useRequestDistribution("last24Hours");
```

### Composant de Tableau de Bord

```typescript
import MetricsDashboard from '../components/admin/health/MetricsDashboard';

// Dans votre page
<MetricsDashboard />
```

## 📊 Types de Données

### Métriques de Requête

```typescript
interface RequestMetrics {
  timestamp: Date;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  responseSize: number;
  userAgent?: string;
  ip?: string;
}
```

### Métriques MongoDB

```typescript
interface MongoMetrics {
  timestamp: Date;
  operation: string;
  collection: string;
  duration: number;
  success: boolean;
  error?: string;
}
```

### Métriques de Bande Passante

```typescript
interface BandwidthMetrics {
  timestamp: Date;
  bytesIn: number;
  bytesOut: number;
  requestsPerSecond: number;
}
```

## 🎯 Utilisation Avancée

### Filtrage par Période

```typescript
// Métriques personnalisées
const { fetchCustomMetrics } = useCustomPeriodMetrics();

const startDate = new Date("2024-01-01");
const endDate = new Date("2024-01-02");
await fetchCustomMetrics(startDate, endDate);
```

### Formatage des Données

```typescript
import metricsService from "../services/metrics.service";

// Formatage des bytes
metricsService.formatBytes(1024); // "1 KB"

// Formatage de la durée
metricsService.formatDuration(1500); // "1.50s"

// Formatage du pourcentage
metricsService.formatPercentage(95.5); // "95.50%"
```

## 🔍 Surveillance et Alertes

### Notifications Discord

Le service envoie automatiquement des notifications Discord pour :

- Changements d'état des services surveillés
- Alertes de performance
- Rapports périodiques

### Seuils de Performance

Configurez des seuils d'alerte dans le service :

```typescript
// Exemple de seuils
const PERFORMANCE_THRESHOLDS = {
  responseTime: 1000, // ms
  errorRate: 5, // %
  mongoTime: 500 // ms
};
```

## 🚨 Dépannage

### Problèmes Courants

1. **Métriques non collectées**

   - Vérifiez que les middlewares sont bien installés
   - Contrôlez les variables d'environnement
   - Vérifiez les logs du service

2. **Erreurs de connexion**

   - Vérifiez l'URL du service de métriques
   - Contrôlez le token JWT
   - Vérifiez la configuration réseau

3. **Données manquantes**
   - Vérifiez la période sélectionnée
   - Contrôlez les filtres appliqués
   - Vérifiez les permissions d'accès

### Logs

Les logs sont disponibles dans le dossier `logs/` :

```bash
tail -f logs/metrics-service.log
```

## 📝 Exemples d'Utilisation

### Dashboard Administrateur

```typescript
// Page de métriques admin
const AdminMetricsPage = () => {
  return (
    <div className="metrics-dashboard">
      <MetricsDashboard />
    </div>
  );
};
```

### Intégration dans les Services

```typescript
// Service avec métriques automatiques
class ClientService {
  @withMongoMetrics("find", "clients")
  async getClients() {
    return await Client.find();
  }

  @withMongoMetrics("create", "clients")
  async createClient(clientData) {
    return await Client.create(clientData);
  }
}
```

## 🔄 Maintenance

### Nettoyage des Données

Le service nettoie automatiquement les anciennes métriques :

- Conservation des 10 000 dernières métriques
- Nettoyage toutes les 5 minutes
- Suppression des données de plus de 30 jours

### Sauvegarde

```bash
# Sauvegarde des métriques
npm run backup-metrics

# Restauration
npm run restore-metrics
```

## 📚 Ressources Additionnelles

- [Documentation API Swagger](/api-docs)
- [Guide de déploiement](./DEPLOYMENT.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Changelog](./CHANGELOG.md)
