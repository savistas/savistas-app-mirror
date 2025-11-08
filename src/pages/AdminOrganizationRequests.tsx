import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useOrganizationRequests } from '@/hooks/useOrganizationRequests';
import { OrganizationRequestCard } from '@/components/OrganizationRequestCard';
import BurgerMenu from '@/components/BurgerMenu';

const AdminOrganizationRequests = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const {
    requests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    loading: requestsLoading,
    approveRequest,
    rejectRequest,
  } = useOrganizationRequests(true); // Mode admin

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, navigate]);

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
              Backoffice Admin
            </h1>
            <p className="text-xs text-slate-500">Gestion des demandes d'organisation</p>
          </div>
        </div>
        <BurgerMenu />
      </header>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-8 pt-24 md:pt-28 pb-16">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* En-tête */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Demandes d'organisation
            </h2>
            <p className="text-slate-600">
              Gérez les demandes de création d'organisation soumises par les établissements et entreprises.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Demandes au total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En attente</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  À traiter
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Validées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rejetées</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div>
                <p className="text-xs text-muted-foreground">
                  Refusées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alerte si aucune demande en attente */}
          {pendingRequests.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Aucune demande en attente</AlertTitle>
              <AlertDescription>
                Il n'y a actuellement aucune demande d'organisation à traiter.
              </AlertDescription>
            </Alert>
          )}

          {/* Liste des demandes par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes d'organisation</CardTitle>
              <CardDescription>
                Approuvez ou rejetez les demandes de création d'organisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 gap-1">
                  <TabsTrigger value="pending" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">En attente</span>
                    <span className="sm:hidden">Attente</span> ({pendingRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Approuvées</span>
                    <span className="sm:hidden">Validées</span> ({approvedRequests.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                    <span className="hidden sm:inline">Rejetées</span>
                    <span className="sm:hidden">Refusées</span> ({rejectedRequests.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune demande en attente
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <OrganizationRequestCard
                        key={request.id}
                        request={request}
                        onApprove={approveRequest}
                        onReject={rejectRequest}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="approved" className="space-y-4 mt-4">
                  {approvedRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune demande approuvée
                    </div>
                  ) : (
                    approvedRequests.map((request) => (
                      <OrganizationRequestCard
                        key={request.id}
                        request={request}
                        onApprove={approveRequest}
                        onReject={rejectRequest}
                        readOnly
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4 mt-4">
                  {rejectedRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucune demande rejetée
                    </div>
                  ) : (
                    rejectedRequests.map((request) => (
                      <OrganizationRequestCard
                        key={request.id}
                        request={request}
                        onApprove={approveRequest}
                        onReject={rejectRequest}
                        readOnly
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOrganizationRequests;
