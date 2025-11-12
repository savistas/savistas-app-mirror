# Déploiement de la fonctionnalité de suppression de compte

## Vue d'ensemble

Cette fonctionnalité permet la suppression complète d'un compte utilisateur, incluant:
- ✅ Toutes les données de la base de données (profil, cours, quiz, organisations, etc.)
- ✅ Tous les fichiers de stockage (photos de profil, fichiers de cours)
- ✅ Le compte d'authentification Supabase

## Étapes de déploiement

### 1. Appliquer la migration SQL

La migration crée la fonction RPC `delete_user_account()` qui supprime toutes les données utilisateur de la base de données.

```bash
npx supabase db push
```

Ou manuellement via le Dashboard Supabase:
```bash
# Exécuter le contenu du fichier suivant dans l'éditeur SQL:
supabase/migrations/20251106120000_add_delete_user_account_function.sql
```

**Vérification:**
```sql
-- Vérifier que la fonction existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'delete_user_account';
```

### 2. Déployer l'Edge Function

L'Edge Function `delete-account` orchestre la suppression complète:

```bash
npx supabase functions deploy delete-account
```

**Important:** Cette fonction nécessite les secrets suivants:
- `SUPABASE_URL` (automatiquement disponible)
- `SUPABASE_ANON_KEY` (automatiquement disponible)
- `SUPABASE_SERVICE_ROLE_KEY` (automatiquement disponible)

**Note:** Supabase fournit automatiquement ces 3 variables d'environnement dans toutes les Edge Functions. Aucune configuration manuelle n'est nécessaire.

**Vérification:**
```bash
# Lister les fonctions déployées
npx supabase functions list

# Vérifier les logs
npx supabase functions logs delete-account --tail
```

### 3. Tester la fonctionnalité

#### Test 1: Depuis la page Profile (utilisateur normal)

1. Se connecter avec un compte test
2. Aller sur la page Profile
3. Scroll vers le bas jusqu'à la "Zone dangereuse"
4. Cliquer sur "Supprimer mon compte"
5. Confirmer dans le dialog
6. Vérifier:
   - ✅ Toast de confirmation
   - ✅ Redirection vers `/auth`
   - ✅ Données supprimées de la base de données
   - ✅ Compte Auth supprimé (impossible de se reconnecter)

#### Test 2: Depuis la page Organization Request (demande rejetée)

1. Créer un compte avec rôle "school" ou "company"
2. Soumettre une demande d'organisation (ne pas compléter le profil)
3. En tant qu'admin, rejeter la demande
4. Revenir sur le compte test
5. Vérifier la page `/school/creation-request` ou `/company/creation-request`
6. Cliquer sur "Supprimer mon compte"
7. Vérifier la suppression complète

### 4. Vérifications de sécurité

#### Sécurité RPC Function
```sql
-- Vérifier les permissions (seul l'utilisateur connecté peut supprimer ses données)
SELECT grantor, grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'delete_user_account';
```

La fonction utilise `auth.uid()` pour s'assurer que seul l'utilisateur connecté peut supprimer ses propres données.

#### Sécurité Edge Function

L'Edge Function:
1. ✅ Vérifie le token JWT dans le header Authorization
2. ✅ Utilise `getUser(token)` pour valider l'authentification
3. ✅ Supprime uniquement les données de l'utilisateur authentifié
4. ✅ Utilise le service role key UNIQUEMENT pour l'API Admin (deleteUser)

## Flux de suppression

```
┌─────────────────────────────────────────────┐
│ 1. Utilisateur clique "Supprimer mon compte"│
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 2. Dialog de confirmation                    │
│    "Êtes-vous sûr?"                          │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 3. Appel Edge Function /delete-account       │
│    avec Bearer token                         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 4. Edge Function vérifie le token JWT       │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 5. Appel RPC delete_user_account()          │
│    → Suppression de toutes les données DB   │
│      (profiles, courses, quizzes, etc.)     │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 6. Suppression des fichiers Storage         │
│    → profile-photos/{user_id}/*             │
│    → course-files/{user_id}/*               │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 7. Suppression du compte Auth               │
│    → supabaseAdmin.auth.admin.deleteUser()  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 8. Retour succès au client                  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│ 9. Sign out + Redirection vers /auth        │
└─────────────────────────────────────────────┘
```

## Tables affectées par delete_user_account()

La fonction RPC supprime les données dans cet ordre (pour respecter les contraintes de clés étrangères):

1. `error_single_revision` - Révisions d'erreurs individuelles
2. `error_responses` - Réponses d'erreurs
3. `exercise_responses` - Réponses aux exercices
4. `exercises` - Exercices
5. `user_documents` - Documents utilisateur
6. `documents` - Documents généraux
7. `fiche_revision` - Fiches de révision
8. `courses` - Cours (cascade vers données liées)
9. `ai_teacher_conversations` - Conversations avec l'IA
10. `ai_teacher_agent_configs` - Configurations d'agents IA
11. `conversations` - Conversations générales
12. `styles_apprentissage` - Styles d'apprentissage
13. `troubles_detection_scores` - Scores de détection de troubles
14. `troubles_questionnaire_reponses` - Réponses questionnaire
15. `profiles_infos` - Informations de profil
16. `user_activities` - Activités utilisateur
17. `user_progress_snapshots` - Snapshots de progression
18. `organization_monthly_usage` - Utilisation mensuelle organisation
19. `organization_members` - Adhésions aux organisations
20. `organizations` - Organisations créées (cascade)
21. `organization_requests` - Demandes d'organisations
22. `monthly_usage` - Utilisation mensuelle
23. `user_subscriptions` - Abonnements
24. `emails_registry` - Registre d'emails
25. `profiles` - Profil principal (EN DERNIER)

**Tables supprimées en cascade automatique:**
- `messages` - Messages (via conversations)
- `ai_teacher_messages` - Messages IA (via ai_teacher_conversations)
- `question_timings` - Timings des questions (via exercise_responses)

## Rollback

Si nécessaire, pour revenir en arrière:

### Supprimer l'Edge Function
```bash
# Note: Il n'y a pas de commande "undeploy", mais vous pouvez désactiver
# via le Dashboard Supabase > Edge Functions > delete-account > Disable
```

### Supprimer la fonction RPC
```sql
DROP FUNCTION IF EXISTS public.delete_user_account();
```

## Monitoring

### Logs Edge Function
```bash
# Voir les logs en temps réel
npx supabase functions logs delete-account --tail

# Voir les 100 derniers logs
npx supabase functions logs delete-account --limit 100
```

### Logs base de données
Les logs PostgreSQL montreront les appels à la fonction RPC.

## Cas d'usage

### 1. Utilisateur normal supprime son compte

**Depuis:** Page Profile (`/profile` ou `/:role/profile`)
**Action:** Clic sur "Supprimer mon compte" dans la zone dangereuse
**Résultat:** Compte complètement supprimé, redirection vers `/auth`

### 2. Organisation rejetée

**Depuis:** Page Organization Request Status (`/:role/creation-request`)
**Contexte:** Demande d'organisation rejetée par l'admin
**Action:** Clic sur "Supprimer mon compte"
**Raison:** L'utilisateur ne peut pas utiliser son compte car sa demande a été rejetée
**Résultat:** Compte complètement supprimé, peut créer un nouveau compte

## Support

En cas de problème:

1. **Vérifier les logs Edge Function:**
   ```bash
   npx supabase functions logs delete-account --limit 50
   ```

2. **Vérifier l'existence de la fonction RPC:**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_name = 'delete_user_account';
   ```

3. **Tester manuellement la fonction RPC:**
   ```sql
   -- ATTENTION: Ceci supprimera VRAIMENT les données de l'utilisateur connecté
   -- À utiliser uniquement en DEV avec un compte test
   SELECT delete_user_account();
   ```

4. **Vérifier les secrets de l'Edge Function:**
   ```bash
   npx supabase secrets list
   ```

## Checklist de déploiement

- [ ] Migration SQL appliquée (`npx supabase db push`)
- [ ] Fonction RPC `delete_user_account` existe dans la DB
- [ ] Edge Function `delete-account` déployée
- [ ] Secrets configurés (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Test suppression depuis Profile page
- [ ] Test suppression depuis Organization Request page (demande rejetée)
- [ ] Vérification logs (pas d'erreurs)
- [ ] Vérification complète: données DB + Auth + Storage supprimés

## Notes importantes

⚠️ **ATTENTION:** Cette opération est IRRÉVERSIBLE. Une fois qu'un compte est supprimé:
- Toutes les données sont perdues définitivement
- Le compte Auth ne peut plus se connecter
- Il faudra créer un nouveau compte pour utiliser l'application

✅ **Sécurité:** La fonction est sécurisée car:
- Seul l'utilisateur authentifié peut supprimer SON compte (via `auth.uid()`)
- Le token JWT est vérifié à chaque appel
- Pas de possibilité de supprimer le compte d'un autre utilisateur
