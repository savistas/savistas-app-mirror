import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, UserCheck, Clock, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { MemberRequestCard } from '@/components/MemberRequestCard';
import { MembersTable } from '@/components/MembersTable';
import { OrganizationSettings } from '@/components/OrganizationSettings';
import { OnboardingOrganizationDialog } from '@/components/OnboardingOrganizationDialog';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';

const DashboardOrganization = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const { organization, loading: orgLoading, createOrganization, regenerateCode, updateOrganization } = useOrganization();
  const {
    members,
    activeMembers,
    pendingMembers,
    pendingCount,
    loading: membersLoading,
    approveMember,
    rejectMember,
    removeMember,
  } = useOrganizationMembers(organization?.id || null);

  const [showOnboarding, setShowOnboarding] = useState(false);

  // Vérifier que l'utilisateur a le bon rôle
  useEffect(() => {
    if (!roleLoading && role) {
      if (role === 'student') {
        navigate('/dashboard');
      }
    }
  }, [role, roleLoading, navigate]);

  // Afficher le dialogue d'onboarding si pas d'organisation
  useEffect(() => {
    if (!orgLoading && !organization && !roleLoading) {
      setShowOnboarding(true);
    }
  }, [organization, orgLoading, roleLoading]);

  if (roleLoading || orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <>
        <OnboardingOrganizationDialog
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onCreateOrganization={createOrganization}
          userRole={role === 'school' ? 'school' : 'company'}
        />
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                Bienvenue sur votre espace organisation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Pour commencer, créez votre organisation et invitez vos membres.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Créer mon organisation
              </button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img
            src="/logo-savistas.png"
            alt="Savistas Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <div>
            <h1 className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">
              {organization.name}
            </h1>
            <p className="text-xs text-slate-500">Espace organisation</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-8 pt-24 md:pt-28 pb-32">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Alert pour validation en attente */}
          {organization.validation_status === 'pending' && (
            <Alert variant="default" className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <AlertTitle className="text-amber-900 font-semibold">
                Organisation en attente de validation
              </AlertTitle>
              <AlertDescription className="text-amber-800">
                Votre organisation a été créée avec succès et est actuellement en attente
                d'autorisation par un administrateur Savistas. Vous serez notifié par email
                une fois votre organisation validée. En attendant, vous pouvez consulter
                les informations de votre organisation ci-dessous.
              </AlertDescription>
            </Alert>
          )}

          {/* Alert pour validation rejetée */}
          {organization.validation_status === 'rejected' && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold">
                Organisation refusée
              </AlertTitle>
              <AlertDescription className="text-red-800">
                Votre demande de création d'organisation a été refusée par un administrateur.
                Pour plus d'informations, veuillez contacter le support Savistas.
              </AlertDescription>
            </Alert>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Membres</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{members.length}</div>
                <p className="text-xs text-muted-foreground">
                  Membres dans votre organisation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeMembers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Membres validés et actifs
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Attente</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">
                  Demandes d'adhésion en attente
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Notifications - Demandes en attente */}
          {pendingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Demandes en attente ({pendingCount})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingMembers.map((member) => (
                  <MemberRequestCard
                    key={member.id}
                    id={member.id}
                    fullName={member.full_name}
                    email={member.email}
                    profilePhotoUrl={member.profile_photo_url}
                    requestedAt={member.requested_at}
                    onApprove={approveMember}
                    onReject={rejectMember}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Liste des membres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Gestion des membres
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <MembersTable
                  members={members}
                  activeMembers={activeMembers}
                  pendingMembers={pendingMembers}
                  onRemoveMember={removeMember}
                />
              )}
            </CardContent>
          </Card>

          {/* Paramètres de l'organisation */}
          <OrganizationSettings
            name={organization.name}
            description={organization.description}
            organizationCode={organization.organization_code}
            activeMembersCount={activeMembers.length}
            onUpdateOrganization={updateOrganization}
            onRegenerateCode={regenerateCode}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
    </div>
  );
};

export default DashboardOrganization;
