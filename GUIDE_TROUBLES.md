# Guide du Module de Prédétection de Troubles Neurodéveloppementaux

## Vue d'ensemble

Ce module permet de détecter de manière préliminaire des troubles neurodéveloppementaux chez les étudiants afin de personnaliser leur parcours d'apprentissage.

## Architecture

### Composants
- `TroublesDetectionDialog.tsx` - Interface principale du questionnaire
- `Dashboard.tsx` - Affichage des résultats et gestion du flow
- `Profile.tsx` - Option pour refaire les questionnaires

### Tables Supabase
- `troubles_questionnaire_reponses` - Stockage des réponses brutes
- `troubles_detection_scores` - Scores calculés par trouble
- `profiles` - Flags de completion des questionnaires

### Types TypeScript
- `src/types/troubles.ts` - Définitions des types

## Flow Utilisateur

1. **Premier accès** : Dialog de troubles s'ouvre automatiquement
2. **Diagnostic médical** : Si l'utilisateur a un diagnostic, il le renseigne
3. **QCM optionnel** : 13 questions pour détecter les troubles
4. **Calcul automatique** : Algorithme de scoring selon les réponses
5. **Affichage résultats** : Badges sur le dashboard
6. **Questionnaire styles** : Enchaînement automatique vers les styles d'apprentissage

## Troubles Détectés

1. **TDAH** - Trouble Déficit de l'Attention avec Hyperactivité
2. **Dyslexie** - Trouble de la lecture
3. **Dyscalculie** - Trouble du calcul
4. **Dyspraxie** - Trouble de la coordination motrice
5. **TSA** - Trouble du Spectre Autistique
6. **Trouble du langage** - Difficultés de communication
7. **TDI** - Troubles des Apprentissages (général)
8. **Tics/Tourette** - Mouvements involontaires
9. **Bégaiement** - Trouble de la fluidité
10. **Trouble sensoriel isolé** - Hypersensibilités

## Niveaux de Risque

- **Faible** : Pas de signal particulier
- **Modéré** : Quelques signaux, surveillance recommandée
- **Élevé** : Signaux importants, évaluation conseillée
- **Très élevé** : Signaux très forts, consultation recommandée

## Personnalisation des Recommandations

Selon les troubles détectés, l'application peut :
- Adapter le format des contenus (visuels, auditifs)
- Proposer des exercices spécifiques
- Ajuster la difficulté et le rythme
- Suggérer des ressources complémentaires

## Aspect Légal et Éthique

⚠️ **Important** : Ce module ne remplace pas un diagnostic médical professionnel. Il s'agit uniquement d'un outil de prédétection pour personnaliser l'apprentissage.

### Mentions obligatoires :
- "Ceci n'est pas un diagnostic médical"
- "Ces résultats sont indicatifs"
- Recommandation de consulter un professionnel si besoin

## Configuration

### Variables d'environnement
Les clés Supabase doivent être configurées dans l'environnement.

### Permissions
Row Level Security (RLS) configuré pour que chaque utilisateur ne voit que ses propres données.

## Maintenance

### Mise à jour des règles de scoring
Les règles sont définies dans la fonction `calculateScores()` du composant TroublesDetectionDialog.

### Ajout de nouveaux troubles
1. Ajouter les colonnes dans `troubles_detection_scores`
2. Mettre à jour les types TypeScript
3. Ajouter les règles de calcul
4. Mettre à jour l'affichage

### Analytics
Possibilité d'ajouter des métriques pour suivre :
- Taux de completion des questionnaires
- Distribution des troubles détectés
- Efficacité des recommandations

## Support Technique

Pour toute question technique, se référer à :
- Documentation Supabase pour la base de données
- Documentation React/TypeScript pour les composants
- Guidelines d'accessibilité pour l'interface