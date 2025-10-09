# Tests pour le Module de Prédétection de Troubles

## Scénarios de Test

### 1. Utilisateur avec diagnostic médical
**Étapes :**
1. Ouvrir l'application et se connecter
2. Le dialog de troubles s'ouvre automatiquement
3. Cliquer sur "Commencer"
4. Répondre "Oui" à "Avez-vous déjà été diagnostiqué(e) ?"
5. Saisir un diagnostic médical (ex: "TDAH diagnostiqué par Dr. Martin en 2023")
6. Cliquer sur "Enregistrer"

**Résultat attendu :**
- Le dialog se ferme
- Le dialog de styles d'apprentissage s'ouvre
- Dans la base, `troubles_detection_completed = true`
- Les données médicales sont sauvegardées

### 2. Utilisateur qui refuse le QCM
**Étapes :**
1. Ouvrir l'application et se connecter
2. Le dialog de troubles s'ouvre automatiquement
3. Cliquer sur "Commencer"
4. Répondre "Non" à "Avez-vous déjà été diagnostiqué(e) ?"
5. Cliquer sur "Non merci" pour le QCM

**Résultat attendu :**
- Le dialog se ferme
- Le dialog de styles d'apprentissage s'ouvre
- Dans la base, `troubles_detection_completed = true`
- Au refresh de la page, le dialog de troubles ne s'ouvre plus

### 3. Utilisateur qui fait le QCM
**Étapes :**
1. Ouvrir l'application et se connecter
2. Le dialog de troubles s'ouvre automatiquement
3. Cliquer sur "Commencer"
4. Répondre "Non" à "Avez-vous déjà été diagnostiqué(e) ?"
5. Cliquer sur "Oui, je fais le test"
6. Répondre aux 13 questions
7. Arriver à la dernière question et cliquer "Terminer"

**Résultat attendu :**
- Le dialog se ferme
- Le dialog de styles d'apprentissage s'ouvre
- Les réponses et scores sont calculés et sauvegardés
- Dans la base, `troubles_detection_completed = true`
- Les badges de troubles apparaissent sur le dashboard (si scores > Faible)

### 4. Refaire les questionnaires depuis le profil
**Étapes :**
1. Aller sur la page Profil
2. Cliquer sur "Refaire les questionnaires de prédétection"

**Résultat attendu :**
- Redirection vers le dashboard
- Le dialog de troubles s'ouvre à nouveau
- Les flags sont remis à false dans la base

## Vérifications Base de Données

### Tables à vérifier :
1. `troubles_questionnaire_reponses` - réponses brutes
2. `troubles_detection_scores` - scores calculés
3. `profiles` - flags de completion

### Requêtes de test :
```sql
-- Vérifier les flags de completion
SELECT user_id, troubles_detection_completed, learning_styles_completed, survey_completed 
FROM profiles 
WHERE user_id = 'USER_ID';

-- Vérifier les réponses
SELECT * FROM troubles_questionnaire_reponses WHERE user_id = 'USER_ID';

-- Vérifier les scores
SELECT * FROM troubles_detection_scores WHERE user_id = 'USER_ID';
```

## Règles de Scoring à Valider

### TDAH (Q1 + Q8)
- C + C = Très élevé
- C ou C = Élevé  
- B + B = Modéré

### Dyslexie (Q2 + Q9)
- C + C = Très élevé
- (C + B) ou (B + C) = Élevé
- B + B = Modéré

### Autres règles à tester selon le document fourni...

## Interface Utilisateur

### Éléments à vérifier :
- [ ] Logo Savistas affiché
- [ ] Texte d'avertissement médical visible
- [ ] Animation fluide entre les questions
- [ ] Barre de progression fonctionnelle
- [ ] Boutons de navigation (précédent/suivant)
- [ ] Auto-avancement après sélection radio
- [ ] Badges colorés sur le dashboard
- [ ] Section troubles distincte des styles d'apprentissage