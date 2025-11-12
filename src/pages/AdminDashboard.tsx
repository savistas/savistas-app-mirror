import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Users } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useOrganizationRequests } from '@/hooks/useOrganizationRequests';
import BurgerMenu from '@/components/BurgerMenu';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const { pendingRequests, loading: requestsLoading } = useOrganizationRequests(true);

  // Vérifier les droits d'accès - seulement après le chargement complet
  useEffect(() => {
    // Attendre que le chargement soit terminé avant de rediriger
    if (!adminLoading && !requestsLoading && !isAdmin) {
      // Redirection avec un délai pour éviter les faux positifs lors des rafraîchissements de session
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, adminLoading, requestsLoading, navigate]);

  if (adminLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Sera redirigé par useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img
            src="/logo-savistas.png"
            alt="Savistas Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <div>
            <h1 className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">
              Administration Savistas
            </h1>
            <p className="text-xs text-slate-500">Tableau de bord administrateur</p>
          </div>
        </div>
        <BurgerMenu />
      </header>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-8 pt-24 md:pt-28 pb-16">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Titre */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">
              Bienvenue dans l'espace administrateur
            </h2>
            <p className="text-slate-600">
              Gérez les demandes d'organisation et supervisez la plateforme Savistas AI-Cademy.
            </p>
          </div>

          {/* Cartes d'actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Carte Demandes d'organisations */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    {pendingRequests.length > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {pendingRequests.length}
                      </span>
                    )}
                  </div>
                </div>
                <CardTitle>Demandes d'organisations</CardTitle>
                <CardDescription>
                  Valider ou rejeter les demandes de création d'organisation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/organization-requests')}
                  className="w-full group-hover:bg-primary/90"
                >
                  Accéder
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                {pendingRequests.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-3 text-center">
                    {pendingRequests.length} demande{pendingRequests.length > 1 ? 's' : ''} en attente
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Carte Gestion des utilisateurs */}
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  Bloquer ou supprimer des comptes utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/admin/user-management')}
                  className="w-full group-hover:bg-primary/90"
                >
                  Accéder
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
                <CardDescription>
                  Voir les statistiques de la plateforme (bientôt disponible)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button disabled className="w-full">
                  Bientôt disponible
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Informations */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Information</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 space-y-2">
              <p>
                Vous êtes connecté en tant qu'<strong>administrateur Savistas</strong>.
              </p>
              <p className="text-sm">
                Cet espace vous permet de gérer les aspects administratifs de la plateforme.
                Seul le compte <strong>contact.savistas@gmail.com</strong> a accès à cet espace.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
