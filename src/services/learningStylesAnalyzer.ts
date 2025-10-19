/**
 * Service pour analyser les styles d'apprentissage et générer des directives IA
 * Basé sur la logique n8n fournie
 */

export interface LearningStyleDirective {
  name: string;
  caracteristiques: string;
  directive_ia: string[];
}

export interface LearningStyleScore {
  score: number;
  name: string;
  caracteristiques: string;
  directive_ia: string[];
  field: string;
}

export interface DominantStyles {
  top3: LearningStyleScore[];
  formatted: string;
}

/**
 * Définition complète des styles d'apprentissage
 */
const LEARNING_STYLES: Record<string, LearningStyleDirective> = {
  'score_visuel': {
    name: 'Visuel',
    caracteristiques: 'préfère voir pour comprendre, aime les cartes mentales, graphiques, vidéos',
    directive_ia: [
      'Utiliser des schémas ASCII simples ou proposer des visualisations',
      'Structurer les réponses avec des listes numérotées et des titres clairs',
      'Employer des métaphores visuelles (ex. « Imagine une pyramide… »)'
    ]
  },
  'score_spatial': {
    name: 'Spatial',
    caracteristiques: 'comprend mieux avec des représentations dans l\'espace, aime manipuler mentalement les objets 3D',
    directive_ia: [
      'Décrire les concepts dans l\'espace (positions relatives, dimensions)',
      'Utiliser des analogies géométriques et spatiales',
      'Proposer des représentations en 2D/3D des concepts'
    ]
  },
  'score_auditif': {
    name: 'Auditif',
    caracteristiques: 'mémorise mieux via explications orales, discussions, répétitions',
    directive_ia: [
      'Expliquer comme si on racontait une histoire',
      'Utiliser des phrases rythmiques ou répétitives',
      'Encourager à répéter ou reformuler à voix haute'
    ]
  },
  'score_linguistique': {
    name: 'Linguistique',
    caracteristiques: 'excellent avec les mots, aime lire, écrire, jouer avec le langage',
    directive_ia: [
      'Utiliser un vocabulaire riche et précis',
      'Proposer des jeux de mots et associations linguistiques',
      'Donner des définitions étymologiques quand pertinent'
    ]
  },
  'score_kinesthésique': {
    name: 'Kinesthésique',
    caracteristiques: 'besoin de toucher, faire, bouger, manipuler',
    directive_ia: [
      'Proposer des exercices pratiques, simulations, jeux de rôle',
      'Inviter à « faire l\'expérience » plutôt qu\'à simplement lire',
      'Donner des exemples concrets du quotidien'
    ]
  },
  'score_lecture': {
    name: 'Lecture',
    caracteristiques: 'aime lire, analyser des textes, comprendre par la lecture',
    directive_ia: [
      'Fournir des textes bien structurés et détaillés',
      'Proposer des lectures complémentaires',
      'Encourager l\'analyse textuelle approfondie'
    ]
  },
  'score_ecriture': {
    name: 'Écriture',
    caracteristiques: 'aime rédiger, prendre des notes, résumer, créer des fiches',
    directive_ia: [
      'Donner des définitions précises et bien écrites',
      'Proposer des exercices de rédaction ou de résumé',
      'Fournir des fiches synthétiques'
    ]
  },
  'score_logique_mathematique': {
    name: 'Logique/Mathématique',
    caracteristiques: 'aime les structures logiques, les chiffres, les systèmes',
    directive_ia: [
      'Structurer les réponses par étapes numérotées',
      'Employer des analogies scientifiques ou mathématiques',
      'Proposer des exercices avec règles et formules'
    ]
  },
  'score_interpersonnelle': {
    name: 'Social/Interpersonnel',
    caracteristiques: 'aime apprendre en groupe, discuter, échanger',
    directive_ia: [
      'Proposer des mises en situation de collaboration',
      'Donner des exemples de travail en équipe',
      'Encourager le partage et la reformulation pour autrui'
    ]
  },
  'score_musicale': {
    name: 'Musical',
    caracteristiques: 'apprend mieux avec rythmes, mélodies, sons',
    directive_ia: [
      'Utiliser des rythmes et mélodies pour mémoriser',
      'Proposer des chansons ou comptines éducatives',
      'Créer des associations sonores avec les concepts'
    ]
  },
  'score_naturaliste': {
    name: 'Naturaliste',
    caracteristiques: 'aime observer la nature, classer, catégoriser',
    directive_ia: [
      'Utiliser des exemples de la nature et de l\'environnement',
      'Classer et catégoriser les informations',
      'Relier les concepts aux phénomènes naturels'
    ]
  },
  'score_intrapersonnelle': {
    name: 'Solitaire/Intrapersonnel',
    caracteristiques: 'préfère réfléchir seul, organiser son travail personnellement',
    directive_ia: [
      'Donner des méthodes d\'auto-apprentissage',
      'Encourager la prise de notes personnelles',
      'Valoriser la motivation et les objectifs personnels'
    ]
  }
};

/**
 * Analyser les styles d'apprentissage d'un utilisateur
 * Retourne les 3 styles dominants
 */
export function analyzeLearningStyles(userData: Record<string, any>): DominantStyles {
  // Extraction et tri des scores
  const scores: LearningStyleScore[] = [];

  for (const [scoreField, styleData] of Object.entries(LEARNING_STYLES)) {
    if (userData[scoreField] !== undefined && userData[scoreField] !== null && userData[scoreField] > 0) {
      scores.push({
        score: parseInt(userData[scoreField]),
        name: styleData.name,
        caracteristiques: styleData.caracteristiques,
        directive_ia: styleData.directive_ia,
        field: scoreField
      });
    }
  }

  // Tri par score décroissant
  scores.sort((a, b) => b.score - a.score);

  // Récupération des 3 styles dominants
  const top3 = scores.slice(0, 3);

  // Formatage pour le prompt IA
  const formatted = top3.map((style, index) =>
    `Style ${index + 1}: ${style.name} (${style.caracteristiques})`
  ).join('\n');

  return { top3, formatted };
}

/**
 * Générer les directives IA pour les styles dominants
 */
export function generateStyleDirectives(dominantStyles: LearningStyleScore[]): string {
  const directives: string[] = [];

  dominantStyles.forEach((style, index) => {
    directives.push(`**${style.name} (Style dominant ${index + 1}) :**`);
    style.directive_ia.forEach(directive => {
      directives.push(`- ${directive}`);
    });
  });

  return directives.join('\n');
}
