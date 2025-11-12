import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Users, AlertCircle, Search, Ban, Trash2, ShieldCheck } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BurgerMenu from '@/components/BurgerMenu';
import { Badge } from '@/components/ui/badge';

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
  profile_photo_url: string | null;
  role: string | null;
  is_blocked: boolean | null;
  created_at: string;
}

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!adminLoading && !loading && !isAdmin) {
      const timeout = setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, adminLoading, loading, navigate]);

  // Charger la liste des utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, email, full_name, profile_photo_url, role, is_blocked, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setUsers(data || []);
        setFilteredUsers(data || []);
      } catch (error: any) {
        console.error('Error loading users:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger la liste des utilisateurs',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin && !adminLoading) {
      loadUsers();
    }
  }, [isAdmin, adminLoading, toast]);

  // Filtrer les utilisateurs par recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          (user.full_name && user.full_name.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  // Bloquer/Débloquer un utilisateur
  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: !currentBlocked })
        .eq('user_id', userId);

      if (error) throw error;

      // Mettre à jour l'état local
      setUsers((prev) =>
        prev.map((user) =>
          user.user_id === userId ? { ...user, is_blocked: !currentBlocked } : user
        )
      );

      toast({
        title: currentBlocked ? 'Utilisateur débloqué' : 'Utilisateur bloqué',
        description: currentBlocked
          ? 'L\'utilisateur peut à nouveau accéder à la plateforme'
          : 'L\'utilisateur ne peut plus accéder à la plateforme',
      });
    } catch (error: any) {
      console.error('Error toggling block status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut de l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId: string, email: string) => {
    try {
      // Supprimer toutes les données de l'utilisateur via RPC
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId,
      });

      if (error) throw error;

      // Mettre à jour l'état local
      setUsers((prev) => prev.filter((user) => user.user_id !== userId));

      toast({
        title: 'Utilisateur supprimé',
        description: `Le compte de ${email} a été supprimé avec succès`,
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'utilisateur',
        variant: 'destructive',
      });
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'student':
        return 'Élève';
      case 'school':
        return 'École';
      case 'company':
        return 'Entreprise';
      default:
        return 'Non défini';
    }
  };

  const getRoleBadgeVariant = (role: string | null) => {
    switch (role) {
      case 'student':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'school':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'company':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (adminLoading || loading) {
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
    return null;
  }

  const blockedUsers = users.filter((u) => u.is_blocked);
  const activeUsers = users.filter((u) => !u.is_blocked);

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
            <p className="text-xs text-slate-500">Gestion des utilisateurs</p>
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
              Gestion des utilisateurs
            </h2>
            <p className="text-slate-600">
              Gérez les comptes utilisateurs : bloquez ou supprimez des comptes si nécessaire.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Comptes enregistrés
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Actifs</CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Avec accès à la plateforme
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs Bloqués</CardTitle>
                <Ban className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{blockedUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Accès refusé
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des utilisateurs */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                Recherchez, bloquez ou supprimez des comptes utilisateurs
              </CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par email ou nom..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Aucun utilisateur trouvé</AlertTitle>
                  <AlertDescription>
                    {searchQuery
                      ? 'Aucun utilisateur ne correspond à votre recherche.'
                      : 'Il n\'y a actuellement aucun utilisateur enregistré.'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Inscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profile_photo_url || undefined} />
                                <AvatarFallback>
                                  {(user.full_name || user.email).charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeVariant(user.role)}>
                              {getRoleLabel(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_blocked ? (
                              <Badge variant="destructive">Bloqué</Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                Actif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleBlock(user.user_id, user.is_blocked || false)}
                              >
                                {user.is_blocked ? (
                                  <>
                                    <ShieldCheck className="h-4 w-4 mr-1" />
                                    Débloquer
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Bloquer
                                  </>
                                )}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Supprimer
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Supprimer ce compte ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Êtes-vous sûr de vouloir supprimer le compte de{' '}
                                      <strong>{user.email}</strong> ?
                                      <br />
                                      <br />
                                      Cette action est irréversible et supprimera toutes les
                                      données associées à ce compte.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUser(user.user_id, user.email)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Supprimer
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
