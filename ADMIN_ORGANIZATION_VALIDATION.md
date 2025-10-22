# Guide de Validation des Organisations (Admin)

Ce document explique comment valider manuellement les organisations créées dans Savistas AI-Cademy en tant qu'administrateur.

## Vue d'ensemble

Lorsqu'une école ou une entreprise s'inscrit sur la plateforme, une organisation est créée automatiquement avec le statut `pending` (en attente). En tant qu'administrateur, vous devez manuellement approuver ou rejeter ces demandes dans Supabase.

## Accès à Supabase

1. Connectez-vous à votre projet Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet Savistas AI-Cademy
3. Dans le menu latéral, cliquez sur **Table Editor**

## Processus de Validation

### Étape 1 : Consulter les Demandes en Attente

1. Dans le Table Editor, sélectionnez la table **`organizations`**
2. Filtrez les organisations par statut :
   - Cliquez sur le bouton **Filter** (icône d'entonnoir)
   - Choisissez la colonne `validation_status`
   - Opérateur : `equals`
   - Valeur : `pending`
   - Cliquez sur **Apply**

Vous verrez maintenant toutes les organisations en attente de validation.

### Étape 2 : Examiner une Organisation

Pour chaque organisation en attente, vérifiez les informations suivantes :

| Colonne | Description |
|---------|-------------|
| `name` | Nom de l'organisation (école ou entreprise) |
| `description` | Description fournie par l'organisation |
| `website` | Site web de l'organisation (vérifiez qu'il est légitime) |
| `type` | Type d'organisation : `school` (école) ou `company` (entreprise) |
| `created_by` | ID de l'utilisateur qui a créé l'organisation |
| `organization_code` | Code unique généré automatiquement (ex: ORG-ABC123) |
| `created_at` | Date de création de la demande |
| `max_members` | Nombre maximum de membres autorisés (par défaut : 100) |

### Étape 3 : Valider les Informations

Avant d'approuver une organisation, effectuez ces vérifications :

1. **Vérifier le site web** : Visitez le site web indiqué pour confirmer qu'il existe et correspond à l'organisation
2. **Vérifier le nom** : Assurez-vous que le nom est légitime et professionnel
3. **Vérifier l'administrateur** :
   - Notez l'ID dans `created_by`
   - Allez dans la table **`profiles`**
   - Recherchez cet utilisateur par `user_id`
   - Vérifiez son email, nom complet, et autres informations

### Étape 4 : Approuver ou Rejeter

#### Pour APPROUVER une organisation :

1. Cliquez sur la ligne de l'organisation dans le tableau
2. Modifiez les colonnes suivantes :
   - `validation_status` → `approved`
   - `validated_at` → Date et heure actuelles (format ISO : `2025-01-20T14:30:00Z`)
   - `validated_by` → Votre user ID (récupérez-le depuis la table `auth.users`)
3. Cliquez sur **Save** (bouton vert en bas à droite)

#### Pour REJETER une organisation :

1. Cliquez sur la ligne de l'organisation dans le tableau
2. Modifiez les colonnes suivantes :
   - `validation_status` → `rejected`
   - `validated_at` → Date et heure actuelles (format ISO : `2025-01-20T14:30:00Z`)
   - `validated_by` → Votre user ID
3. Cliquez sur **Save**

### Étape 5 : Notification de l'Utilisateur

**Approuvé :**
- L'organisation peut maintenant accéder à toutes les fonctionnalités
- L'alerte "en attente de validation" disparaîtra de leur dashboard
- Ils pourront inviter des membres et gérer leur organisation

**Rejeté :**
- L'utilisateur verra une alerte rouge indiquant que sa demande a été refusée
- Il devra contacter le support pour plus d'informations
- *Note : Vous devriez envoyer un email manuel à l'utilisateur pour expliquer le rejet*

## Gestion des Tiers d'Abonnement (Futur)

Actuellement, toutes les organisations ont `max_members: 100` par défaut. À l'avenir, vous devrez aussi gérer les tiers d'abonnement :

| Tier | Prix/mois | Max Members | Colonne à ajouter |
|------|-----------|-------------|-------------------|
| Tier 1 | 20€ | 10 | `subscription_tier: 'tier_1'` |
| Tier 2 | 50€ | 100 | `subscription_tier: 'tier_2'` |
| Tier 3 | TBD | 300 | `subscription_tier: 'tier_3'` |

*Note : La gestion des abonnements sera implémentée dans une future version.*

## Requêtes SQL Utiles

### Lister toutes les organisations en attente

```sql
SELECT
  id,
  name,
  description,
  website,
  type,
  organization_code,
  created_at,
  (SELECT email FROM profiles WHERE user_id = organizations.created_by LIMIT 1) as admin_email
FROM organizations
WHERE validation_status = 'pending'
ORDER BY created_at DESC;
```

### Approuver en masse (si nécessaire)

```sql
UPDATE organizations
SET
  validation_status = 'approved',
  validated_at = NOW(),
  validated_by = 'YOUR_USER_ID_HERE'
WHERE id IN ('org_id_1', 'org_id_2', 'org_id_3');
```

### Compter les organisations par statut

```sql
SELECT
  validation_status,
  COUNT(*) as count
FROM organizations
GROUP BY validation_status;
```

## Conseils de Sécurité

1. **Ne jamais approuver automatiquement** : Chaque organisation doit être vérifiée manuellement
2. **Vérifier l'authenticité** : Utilisez Google pour vérifier que l'organisation existe réellement
3. **Attention aux noms suspects** : Rejetez les noms génériques ou manifestement faux
4. **Documenter les rejets** : Gardez une trace des raisons de rejet pour référence future
5. **Surveiller les abus** : Si une organisation est rejetée et recréée plusieurs fois, bloquez l'utilisateur

## Support

Si vous avez des questions sur la validation d'une organisation spécifique, contactez l'équipe de développement Savistas.

---

**Dernière mise à jour** : 20 Janvier 2025
**Version** : 1.0
