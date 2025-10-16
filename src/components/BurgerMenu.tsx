import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BurgerIcon from './BurgerIcon';
import BurgerMenuContent from './BurgerMenuContent';
import { useClickOutside } from '@/hooks/useClickOutside';

interface BurgerMenuProps {
  className?: string;
}

/**
 * Variants d'animation pour le menu (clipPath circle)
 * Animation depuis le coin supérieur droit (position du burger)
 */
const menuVariants = {
  open: {
    clipPath: "circle(150% at calc(100% - 50px) 50px)",
    transition: {
      type: "spring",
      stiffness: 20,
      restDelta: 2,
    },
  },
  closed: {
    clipPath: "circle(30px at calc(100% - 50px) 50px)",
    transition: {
      delay: 0.2,
      type: "spring",
      stiffness: 400,
      damping: 40,
    },
  },
};

/**
 * Composant principal du menu burger
 * Gère l'état d'ouverture/fermeture et les interactions
 */
const BurgerMenu: React.FC<BurgerMenuProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic à l'extérieur
  useClickOutside(menuRef, useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]));

  // Fermer le menu avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <>
      {/* Burger Icon Button */}
      <BurgerIcon isOpen={isOpen} onClick={handleToggle} />

      {/* Menu et Backdrop - Rendus via Portal pour échapper au contexte du header */}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop (overlay sombre) - Couvre TOUTE la page y compris la navbar */}
              <motion.div
                className="fixed inset-0 bg-black/40 z-[60]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsOpen(false)}
              />

              {/* Menu Container */}
              <motion.div
                ref={menuRef}
                id="burger-menu"
                role="navigation"
                aria-label="Menu principal"
                className={`fixed top-16 md:top-[4.5rem] right-2 md:right-4 w-80 md:w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden z-[70] max-h-[calc(100vh-5rem)] md:max-h-[calc(100vh-5.5rem)] overflow-y-auto ${className || ''}`}
                variants={menuVariants}
                initial="closed"
                animate="open"
                exit="closed"
              >
                <BurgerMenuContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default BurgerMenu;
