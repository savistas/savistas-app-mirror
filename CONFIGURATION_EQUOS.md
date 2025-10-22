# Configuration Equos (Sécurisée)

## 🔒 Architecture Sécurisée

La clé secrète Equos est **protégée côté serveur** via des Edge Functions Supabase. Elle n'est JAMAIS exposée dans le code JavaScript du navigateur.

```
Frontend React → Edge Function Supabase → API Equos
                  (clé secrète cachée ici)
```

## 📋 Étapes de Configuration

### 1. Configurer la clé secrète dans Supabase (Local)

Pour le développement local, configurez le secret :

```bash
# Créer le fichier de secrets si inexistant
npx supabase secrets set EQUOS_SECRET_KEY=sk_1Def2L80VH0QN3ESA5V9fKdUy0iuvqloFVyAaNCRB3XoD
```

### 2. Déployer les Edge Functions

```bash
# Déployer la fonction de création d'agents
npx supabase functions deploy create-equos-agent

# Déployer la fonction de création de sessions
npx supabase functions deploy create-equos-session
```

### 3. Configurer la clé secrète en production

Une fois prêt pour la production :

```bash
# Se connecter à votre projet Supabase
npx supabase link --project-ref votre-project-ref

# Configurer le secret en production
npx supabase secrets set EQUOS_SECRET_KEY=sk_1Def2L80VH0QN3ESA5V9fKdUy0iuvqloFVyAaNCRB3XoD --project-ref votre-project-ref
```

### 4. Configurer l'Avatar ID par défaut (Optionnel)

Créez un fichier `.env.local` à la racine du projet :

```env
# Avatar ID par défaut (récupéré depuis le dashboard Equos)
VITE_ECOS_DEFAULT_AVATAR_ID=votre_avatar_id
```

## 🧪 Tester la Configuration

### Démarrer Supabase localement

```bash
# Démarrer les services Supabase (Docker requis)
npx supabase start

# Déployer les Edge Functions localement
npx supabase functions serve
```

### Tester l'application

```bash
# Démarrer le serveur de développement
npm run dev

# Naviguer vers http://localhost:8080/equos-professeur-virtuel
```

## 📊 Vérification

Quand vous cliquez sur "Démarrer" :

1. ✅ Les logs devraient montrer :
   ```
   🎭 [EQUOS] Création agent pour: Jean Dupont
   📏 [EQUOS] Longueur instructions: 2450 caractères
   ✅ [EQUOS] Agent créé: ag_xyz123...
   🎬 [EQUOS] Création session...
   ✅ [EQUOS] Session créée: ses_abc456...
   🔗 [EQUOS] LiveKit server: wss://...
   ```

2. ❌ Si erreur "EQUOS_SECRET_KEY not configured" :
   - Vérifiez que vous avez exécuté `npx supabase secrets set`
   - Redémarrez les Edge Functions : `npx supabase functions serve`

## 🔑 Vos Clés Equos

- **Clé publique** (non utilisée) : `pk_DRXiRnxyWJ94zw8yYcNgeSZ8Z2zPoE6`
- **Clé secrète** (protégée côté serveur) : `sk_1Def2L80VH0QN3ESA5V9fKdUy0iuvqloFVyAaNCRB3XoD`

⚠️ **IMPORTANT** : La clé secrète ne sera JAMAIS visible dans le code client. Elle est uniquement stockée dans les secrets Supabase.

## 📁 Fichiers Créés

- `supabase/functions/create-equos-agent/index.ts` - Edge Function pour créer agents
- `supabase/functions/create-equos-session/index.ts` - Edge Function pour créer sessions
- `src/services/equosAgentService.ts` - Service client (modifié pour utiliser Edge Functions)
- `src/pages/EquosProfesseurVirtuel.tsx` - Page du professeur virtuel
- `src/components/equos/EquosLiveKitContainer.tsx` - Composant LiveKit

## 🚀 Déploiement en Production

Quand vous serez prêt à déployer :

1. Déployez votre application React (Vercel, Netlify, etc.)
2. Assurez-vous que les Edge Functions sont déployées sur Supabase
3. Configurez le secret `EQUOS_SECRET_KEY` en production
4. Testez sur votre site de production

## ❓ Troubleshooting

### Erreur CORS

Si vous voyez des erreurs CORS, vérifiez que les Edge Functions ont les headers corrects (déjà configurés).

### Edge Function ne répond pas

```bash
# Vérifier les logs des Edge Functions
npx supabase functions logs create-equos-agent
npx supabase functions logs create-equos-session
```

### Avatar ne se charge pas

1. Vérifiez que vous avez un avatar valide dans votre compte Equos
2. Configurez `VITE_ECOS_DEFAULT_AVATAR_ID` dans `.env.local`
3. Sinon, Equos utilisera l'avatar par défaut de votre organisation
