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
}

export const MembersTable = ({
  members,
  activeMembers,
  pendingMembers,
  onRemoveMember,
}: MembersTableProps) => {
  const { toast } = useToast();
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  const MemberRow = ({ member }: { member: Member }) => (
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
        <span className="capitalize">{member.role}</span>
      </TableCell>
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Aucun membre
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="active" className="mt-4">
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Aucun membre actif
                  </TableCell>
                </TableRow>
              ) : (
                activeMembers.map((member) => (
                  <MemberRow key={member.id} member={member} />
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
                <TableHead>Rôle</TableHead>
                <TableHead>Date d'inscription</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    Aucune demande en attente
                  </TableCell>
                </TableRow>
              ) : (
                pendingMembers.map((member) => (
                  <MemberRow key={member.id} member={member} />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </TabsContent>
    </Tabs>
  );
};
