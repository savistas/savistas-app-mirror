# Système de Catégorisation Automatique des Erreurs QCM

## Vue d'ensemble

Ce système envoie automatiquement les erreurs des utilisateurs lors de la complétion d'un QCM vers un webhook N8N pour analyse et catégorisation.

## Fonctionnement

### 1. Déclenchement
Lorsqu'un utilisateur **termine** un QCM, le système :
- Sauvegarde les réponses dans `exercise_responses`
- Met à jour le statut de l'exercice à "Terminé"
- **Envoie uniquement les réponses incorrectes** au webhook N8N

### 2. Données envoyées

Le webhook reçoit un payload JSON contenant :

```json
{
  "user_id": "uuid-de-l-utilisateur",
  "exercise_id": "uuid-de-l-exercice",
  "course_id": "uuid-du-cours",
  "timestamp": "2025-10-14T10:30:00.000Z",
  "errors": [
    {
      "matiere": "E-commerce",
      "question": "Quelle est la première étape de la méthode...",
      "reponse_fausse": "A. Trouver des produits gagnants...",
      "bonne_reponse": "C. Ouvrir sa boutique e-commerce...",
      "explication": "La première étape de la méthode 'Enfin Libre' est d'ouvrir votre boutique...",
      "question_index": "1"
    }
  ]
}
```

### 3. Gestion des cas spéciaux

- **Si toutes les réponses sont correctes** : Aucun envoi au webhook (log dans la console)
- **Si le webhook est indisponible** : L'erreur est loguée mais n'empêche pas la navigation vers la page de résultats
- **Si la matière n'est pas trouvée** : Utilise la matière stockée dans les métadonnées de l'exercice

## Configuration

### Webhook URL
L'URL du webhook N8N est définie dans : [src/lib/errorCategorizationService.ts](src/lib/errorCategorizationService.ts)

```typescript
const N8N_WEBHOOK_URL = "https://n8n.srv932562.hstgr.cloud/webhook/error-categorization";
```

### Modification de l'URL
Pour changer l'URL du webhook, éditez la constante `N8N_WEBHOOK_URL` dans le fichier ci-dessus.

## Architecture

### Fichiers impliqués

1. **[src/lib/errorCategorizationService.ts](src/lib/errorCategorizationService.ts)**
   - Service responsable de l'extraction des erreurs
   - Envoi au webhook N8N
   - Gestion des erreurs réseau

2. **[src/pages/DailyQuiz.tsx](src/pages/DailyQuiz.tsx)**
   - Page où l'utilisateur répond au QCM
   - Appelle le service après la soumission finale
   - Ligne ~163-172

### Flux de données

```
Utilisateur termine QCM
    ↓
Sauvegarde dans exercise_responses (Supabase)
    ↓
Mise à jour statut exercice
    ↓
Récupération de la matière du cours
    ↓
Extraction des erreurs uniquement
    ↓
Envoi POST au webhook N8N
    ↓
Navigation vers page de résultats
```

## Développement et Débogage

### Logs console
Le service log automatiquement :
- Les erreurs extraites avant l'envoi
- Le succès ou l'échec de l'envoi
- Les warnings si des données sont manquantes

### Tester localement
```bash
# Lancer le serveur de dev
npm run dev

# Compléter un QCM avec au moins une erreur
# Vérifier la console du navigateur pour les logs
```

### Exemple de log réussi
```
Sending errors to N8N webhook: {
  user_id: "...",
  exercise_id: "...",
  errors: [...]
}
Errors sent successfully to N8N
```

## Workflow N8N

Le workflow N8N doit accepter une requête POST avec le payload décrit ci-dessus.

### Exemple de traitement côté N8N
1. Réception du webhook
2. Pour chaque erreur :
   - Analyser le type d'erreur (inattention, connaissance, raisonnement, etc.)
   - Utiliser l'IA pour catégoriser
3. Optionnel : Renvoyer les résultats à Supabase ou via callback

## Améliorations futures possibles

- [ ] Ajouter un système de retry en cas d'échec
- [ ] Stocker les catégorisations dans une table Supabase
- [ ] Afficher les insights de catégorisation sur le profil utilisateur
- [ ] Créer un dashboard d'analytics des erreurs
- [ ] Ajouter un système de notification pour les erreurs récurrentes

## Support

En cas de problème :
1. Vérifier les logs du navigateur (Console)
2. Vérifier que le webhook N8N est actif
3. Tester l'URL du webhook avec curl ou Postman
4. Vérifier les permissions RLS sur Supabase
