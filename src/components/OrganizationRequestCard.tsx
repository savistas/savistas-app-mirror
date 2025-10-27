import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  GraduationCap,
  User,
  Calendar,
  Phone,
  MapPin,
  Globe,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { OrganizationRequest } from '@/hooks/useOrganizationRequests';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface OrganizationRequestCardProps {
  request: OrganizationRequest;
  onApprove: (requestId: string) => Promise<{ data: any; error: any }>;
  onReject: (requestId: string, reason?: string) => Promise<{ error: any }>;
  readOnly?: boolean;
}

export const OrganizationRequestCard = ({
  request,
  onApprove,
  onReject,
  readOnly = false,
}: OrganizationRequestCardProps) => {
  const { toast } = useToast();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const { error } = await onApprove(request.id);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver la demande',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Demande approuvée',
        description: `L'organisation "${request.organization_name}" a été créée avec succès`,
      });
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Raison requise',
        description: 'Veuillez fournir une raison pour le rejet',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const { error } = await onReject(request.id, rejectionReason);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de rejeter la demande',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Demande rejetée',
        description: `La demande de "${request.organization_name}" a été rejetée`,
      });
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approuvée
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejetée
          </Badge>
        );
    }
  };

  const orgTypeIcon = request.organization_type === 'school' ? GraduationCap : Building2;
  const OrgIcon = orgTypeIcon;
  const orgTypeLabel = request.organization_type === 'school' ? 'École' : 'Entreprise';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <OrgIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{request.organization_name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{orgTypeLabel}</Badge>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Informations de l'organisation */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700">Informations de l'organisation</h4>
            <div className="space-y-2 text-sm">
              <p className="text-slate-600">{request.organization_description}</p>
              {request.organization_website && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Globe className="w-4 h-4" />
                  <a
                    href={request.organization_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {request.organization_website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Informations de l'administrateur */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-700">Administrateur</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <User className="w-4 h-4" />
                {request.admin_full_name}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                {request.admin_email}
              </div>
              {request.admin_date_of_birth && request.admin_date_of_birth !== '1970-01-01' && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(request.admin_date_of_birth), 'dd/MM/yyyy', { locale: fr })}
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                {request.admin_phone}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                {request.admin_city ? `${request.admin_city}, ` : ''}{request.admin_country}
              </div>
            </div>
          </div>

          {/* Date de création */}
          <div className="text-xs text-slate-500">
            Demande créée le {format(new Date(request.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </div>

          {/* Raison du rejet si applicable */}
          {request.status === 'rejected' && request.rejection_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-1">Raison du rejet :</p>
              <p className="text-sm text-red-700">{request.rejection_reason}</p>
            </div>
          )}

          {/* Date de traitement si applicable */}
          {request.reviewed_at && (
            <div className="text-xs text-slate-500">
              Traitée le {format(new Date(request.reviewed_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
            </div>
          )}

          {/* Boutons d'action (uniquement si pending et pas en readOnly) */}
          {!readOnly && request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1"
                variant="default"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approuver
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={loading}
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison pour le rejet de cette demande. L'utilisateur sera notifié.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Raison du rejet *</Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Les informations fournies ne sont pas suffisantes..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason('');
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={loading}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
