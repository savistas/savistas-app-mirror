import { motion } from 'framer-motion';

interface BurgerIconProps {
  isOpen: boolean;
  onClick: () => void;
}

/**
 * Composant d'icône de menu burger animée
 * Transitions entre ☰ (3 lignes) et ✕ (croix) avec Framer Motion
 */
const BurgerIcon: React.FC<BurgerIconProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors relative focus:outline-none focus:ring-2 focus:ring-slate-300"
      aria-label="Menu de navigation"
      aria-expanded={isOpen}
      aria-controls="burger-menu"
    >
      <svg width="23" height="23" viewBox="0 0 23 23">
        {/* Ligne du haut - se transforme en ligne diagonale supérieure de la croix */}
        <motion.path
          fill="transparent"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          className="text-slate-600"
          variants={{
            closed: { d: "M 2 5.5 L 20 5.5" },
            open: { d: "M 3 16.5 L 17 2.5" }
          }}
          animate={isOpen ? "open" : "closed"}
          initial={false}
          transition={{ duration: 0.3 }}
        />

        {/* Ligne du milieu - disparaît (opacité 0) */}
        <motion.path
          fill="transparent"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          className="text-slate-600"
          d="M 2 11.5 L 20 11.5"
          variants={{
            closed: { opacity: 1 },
            open: { opacity: 0 }
          }}
          animate={isOpen ? "open" : "closed"}
          initial={false}
          transition={{ duration: 0.3 }}
        />

        {/* Ligne du bas - se transforme en ligne diagonale inférieure de la croix */}
        <motion.path
          fill="transparent"
          strokeWidth="2"
          stroke="currentColor"
          strokeLinecap="round"
          className="text-slate-600"
          variants={{
            closed: { d: "M 2 17.5 L 20 17.5" },
            open: { d: "M 3 2.5 L 17 16.346" }
          }}
          animate={isOpen ? "open" : "closed"}
          initial={false}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </button>
  );
};

export default BurgerIcon;
