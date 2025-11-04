import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserCircle, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationMembersUsage } from '@/hooks/useOrganizationMembersUsage';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  status: 'pending' | 'active' | 'rejected' | 'removed';
  role: string;
  requested_at: string;
  approved_at: string | null;
}

interface MembersTableProps {
  members: Member[];
  activeMembers: Member[];
  pendingMembers: Member[];
  onRemoveMember: (id: string) => Promise<{ error: any }>;
  organizationId: string | null;
}

export const MembersTable = ({
  members,
  activeMembers,
  pendingMembers,
  onRemoveMember,
  organizationId,
}: MembersTableProps) => {
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const { getRemaining, isLoading: usageLoading } = useOrganizationMembersUsage(organizationId);

  const handleRemove = async (id: string, name: string) => {
    setRemovingId(id);
    const { error } = await onRemoveMember(id);
    setRemovingId(null);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de retirer le membre',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Membre retiré',
        description: `${name} a été retiré de votre organisation`,
      });
    }
  };

  const MemberRow = ({ member, showUsage = false }: { member: Member; showUsage?: boolean }) => {
    // Only get usage data for active members
    const exercisesData = showUsage ? getRemaining(member.user_id, 'exercises') : null;
    const fichesData = showUsage ? getRemaining(member.user_id, 'fiches') : null;
    const aiMinutesData = showUsage ? getRemaining(member.user_id, 'ai_minutes') : null;
    const coursesData = showUsage ? getRemaining(member.user_id, 'courses') : null;

    return (
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage
                src={member.profile_photo_url || undefined}
                alt={member.full_name}
              />
              <AvatarFallback>
                <UserCircle className="w-6 h-6 text-gray-400" />
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{member.full_name}</span>
          </div>
        </TableCell>
        <TableCell>{member.email}</TableCell>
        <TableCell>
          {format(new Date(member.requested_at), 'dd/MM/yyyy', { locale: fr })}
        </TableCell>
        <TableCell>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              member.status === 'active'
                ? 'bg-green-100 text-green-800'
                : member.status === 'pending'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {member.status === 'active' ? 'Actif' : 'En attente'}
          </span>
        </TableCell>
        {showUsage && (
          <>
            <TableCell className="text-center">
              {usageLoading ? (
                <span className="text-gray-400">...</span>
              ) : exercisesData ? (
                <span className={exercisesData.remaining === 0 ? 'text-red-600 font-medium' : ''}>
                  {exercisesData.remaining}/{exercisesData.max}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {usageLoading ? (
                <span className="text-gray-400">...</span>
              ) : fichesData ? (
                <span className={fichesData.remaining === 0 ? 'text-red-600 font-medium' : ''}>
                  {fichesData.remaining}/{fichesData.max}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {usageLoading ? (
                <span className="text-gray-400">...</span>
              ) : aiMinutesData ? (
                <span className={aiMinutesData.remaining === 0 ? 'text-red-600 font-medium' : ''}>
                  {aiMinutesData.remaining}/{aiMinutesData.max}
                </span>
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </TableCell>
            <TableCell className="text-center">
              {usageLoading ? (
                <span className="text-gray-400">...</span>
              ) : coursesData ? (
                <span>{coursesData.current}</span>
              ) : (
                <span className="text-gray-400">0</span>
              )}
            </TableCell>
          </>
        )}
        <TableCell>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={removingId === member.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserMinus className="w-4 h-4 mr-1" />
                Retirer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir retirer {member.full_name} de votre
                  organisation ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRemove(member.id, member.full_name)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Retirer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="all">
          Tous ({members.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Actifs ({activeMembers.length})
        </TabsTrigger>
        <TabsTrigger value="pending">
          En attente ({pendingMembers.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-4">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Exercices</TableHead>
                <TableHead className="text-center">Fiches</TableHead>
                <TableHead className="text-center">Minutes IA</TableHead>
                <TableHead className="text-center">Cours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    Aucun membre
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    showUsage={member.status === 'active'}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="active" className="mt-4">
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Exercices</TableHead>
                <TableHead className="text-center">Fiches</TableHead>
                <TableHead className="text-center">Minutes IA</TableHead>
                <TableHead className="text-center">Cours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    Aucun membre actif
                  </TableCell>
                </TableRow>
              ) : (
                activeMembers.map((member) => (
                  <MemberRow key={member.id} member={member} showUsage={true} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="pending" className="mt-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    Aucune demande en attente
                  </TableCell>
                </TableRow>
              ) : (
                pendingMembers.map((member) => (
                  <MemberRow key={member.id} member={member} showUsage={false} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
};
