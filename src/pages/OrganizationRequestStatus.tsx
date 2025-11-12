import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Clock, AlertCircle, Building2, CheckCircle, XCircle, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganizationRequests } from '@/hooks/useOrganizationRequests';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

const OrganizationRequestStatus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();
  const { requests, loading: requestsLoading } = useOrganizationRequests(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    organization_name: '',
    organization_description: '',
    organization_website: '',
    admin_full_name: '',
    admin_phone: '',
    admin_country: '',
    admin_city: '',
  });

  // Chercher la demande la plus récente (tous statuts confondus)
  const latestRequest = requests.length > 0
    ? requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  useEffect(() => {
    if (!roleLoading && !requestsLoading) {
      // Si pas de demande du tout, rediriger vers le profil
      if (!latestRequest) {
        navigate(`/${role}/profile`);
        return;
      }

      // Si demande approuvée, rediriger vers le dashboard après 5 secondes
      if (latestRequest.status === 'approved') {
        const timer = setTimeout(() => {
          navigate(`/${role}/dashboard-organization`);
        }, 5000);
        return () => clearTimeout(timer);
      }

      // Charger les données de la demande
      setFormData({
        organization_name: latestRequest.organization_name,
        organization_description: latestRequest.organization_description,
        organization_website: latestRequest.organization_website || '',
        admin_full_name: latestRequest.admin_full_name,
        admin_phone: latestRequest.admin_phone,
        admin_country: latestRequest.admin_country,
        admin_city: latestRequest.admin_city || '',
      });
    }
  }, [latestRequest, roleLoading, requestsLoading, navigate, role]);

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);

    try {
      // Step 1: Delete all user data from database using Edge Function
      console.log('🗑️ Deleting user account...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData?.session) {
        throw new Error('No active session');
      }

      const session = sessionData.session;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete account');
      }

      console.log('✅ Account deleted successfully');

      // Sign out (account is already deleted, but let's clean up the local session)
      await supabase.auth.signOut();

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Au revoir !",
      });

      // Redirect to auth page
      navigate('/auth');
    } catch (e: any) {
      console.error('❌ Error deleting account:', e);
      toast({
        title: "Erreur",
        description: e.message ?? "Impossible de supprimer le compte",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (roleLoading || requestsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!latestRequest) {
    return null; // Sera redirigé par useEffect
  }

  const orgTypeLabel = latestRequest.organization_type === 'school' ? 'établissement scolaire' : 'entreprise';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Main Content - Centré */}
      <div className="w-full max-w-3xl space-y-6">
          {/* Alert de statut - Conditionnel selon le status */}
          {latestRequest.status === 'pending' && (
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-5 w-5 text-orange-600" />
              <AlertTitle className="text-orange-900 font-semibold text-lg">
                Demande en cours de vérification
              </AlertTitle>
              <AlertDescription className="text-orange-800 mt-2">
                Votre demande de création d'{orgTypeLabel} a été soumise avec succès et est actuellement
                en cours de vérification par un administrateur Savistas. Vous serez notifié par email
                une fois votre demande traitée.
              </AlertDescription>
            </Alert>
          )}

          {latestRequest.status === 'approved' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-900 font-semibold text-lg">
                Demande approuvée !
              </AlertTitle>
              <AlertDescription className="text-green-800 mt-2">
                Félicitations ! Votre demande de création d'{orgTypeLabel} a été approuvée.
                Vous allez être redirigé vers votre tableau de bord dans quelques secondes...
              </AlertDescription>
            </Alert>
          )}

          {latestRequest.status === 'rejected' && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-900 font-semibold text-lg">
                Demande rejetée
              </AlertTitle>
              <AlertDescription className="text-red-800 mt-2">
                Votre demande de création d'{orgTypeLabel} a été rejetée.
                {latestRequest.rejection_reason && (
                  <div className="mt-3 p-3 bg-red-100 rounded border border-red-200">
                    <p className="font-semibold">Raison du rejet :</p>
                    <p className="mt-1">{latestRequest.rejection_reason}</p>
                  </div>
                )}
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-red-900">
                    Votre compte ne peut pas être utilisé car la demande d'organisation a été rejetée.
                    Vous devez supprimer votre compte pour pouvoir en créer un nouveau.
                  </p>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                    variant="destructive"
                    className="w-full sm:w-auto bg-red-700 hover:bg-red-800"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Suppression en cours...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer mon compte
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Accordéon des informations - Uniquement si pending */}
          {latestRequest.status === 'pending' && (
          <Accordion type="single" collapsible defaultValue="info" className="w-full">
            <AccordionItem value="info" className="border rounded-lg">
              <AccordionTrigger className="px-6 py-4 hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-base font-semibold">Informations de votre demande</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-6 pt-4">
                  {/* Informations de l'organisation */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900">Informations de l'organisation</h3>

                    <div className="space-y-2">
                      <Label htmlFor="organization_name">Nom de l'organisation</Label>
                      <Input
                        id="organization_name"
                        value={formData.organization_name}
                        disabled
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization_description">Description</Label>
                      <Textarea
                        id="organization_description"
                        value={formData.organization_description}
                        disabled
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization_website">Site web</Label>
                      <Input
                        id="organization_website"
                        type="url"
                        value={formData.organization_website}
                        disabled
                        placeholder="https://www.exemple.fr"
                      />
                    </div>
                  </div>

                  {/* Informations de l'administrateur */}
                  <div className="space-y-4 pt-6 border-t">
                    <h3 className="font-semibold text-slate-900">Vos informations</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin_full_name">Nom complet</Label>
                        <Input
                          id="admin_full_name"
                          value={formData.admin_full_name}
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin_phone">Téléphone</Label>
                        <Input
                          id="admin_phone"
                          type="tel"
                          value={formData.admin_phone}
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin_country">Pays</Label>
                        <Input
                          id="admin_country"
                          value={formData.admin_country}
                          disabled
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="admin_city">Ville</Label>
                        <Input
                          id="admin_city"
                          value={formData.admin_city}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          )}

          {/* Information supplémentaire - Uniquement si pending */}
          {latestRequest.status === 'pending' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Temps de traitement</AlertTitle>
              <AlertDescription>
                Le traitement de votre demande peut prendre jusqu'à 48 heures. Nous vous contacterons
                par email dès que votre organisation sera validée ou si nous avons besoin d'informations
                complémentaires.
              </AlertDescription>
            </Alert>
          )}
      </div>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        userEmail={user?.email || ''}
      />
    </div>
  );
};

export default OrganizationRequestStatus;
