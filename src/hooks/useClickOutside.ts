import { RefObject, useEffect } from 'react';

/**
 * Hook pour détecter les clics à l'extérieur d'un élément
 * Utilisé pour fermer le menu burger lors d'un clic en dehors
 */
export const useClickOutside = (
  ref: RefObject<HTMLElement>,
  handler: () => void
) => {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      // Ne rien faire si on clique à l'intérieur de l'élément
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};
