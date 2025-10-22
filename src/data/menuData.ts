/**
 * Types et données pour le menu burger
 */

export interface MenuItem {
  label: string;
  href: string;
  disabled: boolean;
}

export interface MenuCategory {
  title: string;
  items: MenuItem[];
}

/**
 * Structure complète du menu avec 3 catégories :
 * - Cours (Audio, Replay, Generate de cours)
 * - Révision (Fiche de révision, Quiz, Professeur particulier)
 * - Méthodologie (Progression, Cahier d'erreur, Methode)
 *
 * Tous les items sont désactivés pour l'instant (disabled: true)
 */
export const menuData: MenuCategory[] = [
  {
    title: "Cours",
    items: [
      { label: "Audio", href: "#", disabled: true },
      { label: "Replay", href: "#", disabled: true },
      { label: "Generate de cours", href: "#", disabled: true },
    ],
  },
  {
    title: "Révision",
    items: [
      { label: "Fiche de révision", href: "#", disabled: true },
      { label: "Quiz", href: "#", disabled: true },
      { label: "Professeur particulier", href: "/professeur-particulier-virtuel", disabled: false },
    ],
  },
  {
    title: "Méthodologie",
    items: [
      { label: "Progression", href: "/progression", disabled: false },
      { label: "Cahier d'erreur", href: "/cahier-erreurs", disabled: false },
      { label: "Methode", href: "#", disabled: true },
    ],
  },
];
