import { motion } from 'framer-motion';
import { menuData, MenuCategory } from '@/data/menuData';

/**
 * Animations variants pour Framer Motion
 */

// Animation staggered pour les items (apparition décalée)
const itemsVariants = {
  open: {
    transition: { staggerChildren: 0.05, delayChildren: 0.2 },
  },
  closed: {
    transition: { staggerChildren: 0.03, staggerDirection: -1 },
  },
};

// Animation pour chaque item individuel
const itemVariant = {
  open: {
    y: 0,
    opacity: 1,
    transition: { y: { stiffness: 1000, velocity: -100 } },
  },
  closed: {
    y: -20,
    opacity: 0,
    transition: { y: { stiffness: 1000 } },
  },
};

/**
 * Composant d'affichage du contenu du menu burger
 * Affiche les 3 catégories avec leurs items respectifs
 */
const BurgerMenuContent: React.FC = () => {
  const handleDisabledClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <motion.nav
      className="py-2"
      variants={itemsVariants}
      initial="closed"
      animate="open"
      exit="closed"
    >
      {menuData.map((category: MenuCategory, categoryIndex: number) => (
        <motion.div key={categoryIndex} className="mb-3" variants={itemVariant}>
          {/* Titre de la catégorie */}
          <h3 className="font-bold text-slate-900 text-lg mb-2 px-4 pt-2">
            {category.title}
          </h3>

          {/* Items de la catégorie */}
          <div className="space-y-0.5">
            {category.items.map((item, itemIndex: number) => (
              <motion.a
                key={itemIndex}
                href={item.href}
                onClick={item.disabled ? handleDisabledClick : undefined}
                className={`block px-6 py-2 text-sm rounded-lg mx-2 transition-opacity ${
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                    : 'text-slate-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer'
                }`}
                variants={itemVariant}
                tabIndex={item.disabled ? -1 : 0}
              >
                {item.label}
              </motion.a>
            ))}
          </div>
        </motion.div>
      ))}
    </motion.nav>
  );
};

export default BurgerMenuContent;
