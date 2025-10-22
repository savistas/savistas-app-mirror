import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MemberRequestCardProps {
  id: string;
  fullName: string;
  email: string;
  profilePhotoUrl: string | null;
  requestedAt: string;
  onApprove: (id: string) => Promise<{ error: any }>;
  onReject: (id: string) => Promise<{ error: any }>;
}

export const MemberRequestCard = ({
  id,
  fullName,
  email,
  profilePhotoUrl,
  requestedAt,
  onApprove,
  onReject,
}: MemberRequestCardProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    const { error } = await onApprove(id);
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
        description: `${fullName} a été ajouté à votre organisation`,
      });
    }
  };

  const handleReject = async () => {
    setLoading(true);
    const { error } = await onReject(id);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de refuser la demande',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Demande refusée',
        description: `La demande de ${fullName} a été refusée`,
      });
    }
  };

  const formattedDate = format(new Date(requestedAt), 'dd MMMM yyyy', {
    locale: fr,
  });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar className="w-12 h-12">
          <AvatarImage src={profilePhotoUrl || undefined} alt={fullName} />
          <AvatarFallback>
            <UserCircle className="w-8 h-8 text-gray-400" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold text-base">{fullName}</h3>
          <p className="text-sm text-gray-600">{email}</p>
          <p className="text-xs text-gray-500 mt-1">
            Demande reçue le {formattedDate}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleApprove}
            disabled={loading}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-1" />
            Accepter
          </Button>
          <Button
            onClick={handleReject}
            disabled={loading}
            size="sm"
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Refuser
          </Button>
        </div>
      </div>
    </Card>
  );
};
