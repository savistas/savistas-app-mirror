import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

const MAINTENANCE_CODE = 'SAVISTAS1';
const STORAGE_KEY = 'maintenance_bypass';

export const MaintenanceModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if user has already entered the correct code
    const hasBypass = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsOpen(!hasBypass);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (code === MAINTENANCE_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsOpen(false);
      setError(false);
    } else {
      setError(true);
      setCode('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-6 rounded-full bg-orange-100 p-4">
            <AlertTriangle className="h-12 w-12 text-orange-600" />
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Maintenance en cours
          </h2>

          <p className="mb-6 text-gray-600">
            Le site est actuellement en maintenance. Veuillez entrer le code d'accès pour continuer.
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Entrez le code d'accès"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError(false);
                }}
                className={`text-center text-lg font-mono ${error ? 'border-red-500' : ''}`}
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">
                  Code incorrect. Veuillez réessayer.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" size="lg">
              Valider
            </Button>
          </form>

          <div className="mt-8 text-sm text-gray-500">
            <p>Nous reviendrons bientôt.</p>
            <p className="mt-1">Merci de votre patience.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
