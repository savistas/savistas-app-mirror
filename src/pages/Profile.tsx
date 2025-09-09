import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ProfileQuestionEditModal from "@/components/ProfileQuestionEditModal";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    postal_code: "",
    education_level: "",
    classes: "",
    subjects: "",
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [profilesInfos, setProfilesInfos] = useState<{
    pref_apprendre_idee?: string;
    memoire_poesie?: string;
    resoudre_maths?: string;
    temps_libre_pref?: string;
    travail_groupe_role?: string;
    retenir_info?: string;
    pref_enseignant?: string;
    decouvrir_endroit?: string;
    reussir_definition?: string;
    souvenir_important?: string;
  } | null>(null);

  // État pour la modal d'édition
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    questionKey: string;
    currentValue: string;
  }>({
    isOpen: false,
    questionKey: '',
    currentValue: '',
  });

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email,phone,country,city,postal_code,education_level,classes,subjects,profile_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        toast({ title: "Profil", description: "Impossible de charger le profil", variant: "destructive" });
        return;
      }
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          email: data.email ?? user.email ?? "",
          phone: data.phone ?? "",
          country: data.country ?? "",
          city: data.city ?? "",
          postal_code: data.postal_code ?? "",
          education_level: data.education_level ?? "",
          classes: data.classes ?? "",
          subjects: data.subjects ?? "",
        });
        setAvatarUrl(data.profile_photo_url ?? null);
      } else {
        // fallback minimal
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadProfilesInfos = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles_infos')
        .select('pref_apprendre_idee,memoire_poesie,resoudre_maths,temps_libre_pref,travail_groupe_role,retenir_info,pref_enseignant,decouvrir_endroit,reussir_definition,souvenir_important')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        toast({ title: "Informations d'apprentissage", description: "Impossible de charger les informations d'apprentissage", variant: "destructive" });
        return;
      }
      if (data) {
        setProfilesInfos(data);
      }
    };
    loadProfilesInfos();
    return () => { active = false; };
  }, [user]);

  const onChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Gestionnaires pour la modal d'édition
  const handleEditQuestion = (questionKey: string, currentValue: string) => {
    setEditModal({
      isOpen: true,
      questionKey,
      currentValue,
    });
  };

  const handleCloseModal = () => {
    setEditModal({
      isOpen: false,
      questionKey: '',
      currentValue: '',
    });
  };

  const handleSaveQuestion = (newValue: string) => {
    if (profilesInfos) {
      setProfilesInfos({
        ...profilesInfos,
        [editModal.questionKey]: newValue,
      });
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    try {
      setLoading(true);
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);

      // Ensure profile exists, then update
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('profiles').update({ profile_photo_url: publicUrl }).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email,
          full_name: form.full_name,
          profile_photo_url: publicUrl,
        });
      }

      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été enregistrée" });
    } catch (e: any) {
      toast({ title: "Erreur d'upload", description: e.message ?? "Impossible d'enregistrer la photo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('profiles').update(form).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').insert({ ...form, user_id: user.id });
      }
      toast({ title: "Profil enregistré", description: "Vos informations ont été mises à jour" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible d'enregistrer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été changé avec succès." });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de changer le mot de passe", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "Email mis à jour", description: "Un email de confirmation a été envoyé à votre nouvelle adresse et à votre ancienne adresse. Veuillez cliquer sur les liens dans les deux emails pour finaliser le changement." });
      setNewEmail("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de changer l'email", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-28">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-8">
              <div className="flex items-center space-x-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={avatarUrl ?? undefined} alt={form.full_name || form.email || 'Avatar'} />
                  <AvatarFallback>{(form.full_name || form.email || 'P').slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                    disabled={loading}
                  />
                  <Button type="button" onClick={() => document.getElementById('avatar')?.click()} disabled={loading}>
                    {loading ? 'Chargement...' : 'Changer la photo'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nom complet</Label>
                  <Input value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)} placeholder="Votre nom" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="Votre téléphone" />
                </div>
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Input value={form.country} onChange={(e) => onChange('country', e.target.value)} placeholder="Votre pays" />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Input value={form.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Votre ville" />
                </div>
                <div className="space-y-2">
                  <Label>Code postal</Label>
                  <Input value={form.postal_code} onChange={(e) => onChange('postal_code', e.target.value)} placeholder="Votre code postal" />
                </div>
                <div className="space-y-2">
                  <Label>Niveau d'enseignement</Label>
                  <Input value={form.education_level} onChange={(e) => onChange('education_level', e.target.value)} placeholder="Ex: Collège, Lycée" />
                </div>
                <div className="space-y-2">
                  <Label>Classes</Label>
                  <Input value={form.classes} onChange={(e) => onChange('classes', e.target.value)} placeholder="Ex: 2nde, 1ère" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Matières</Label>
                  <Input value={form.subjects} onChange={(e) => onChange('subjects', e.target.value)} placeholder="Ex: Mathématiques, Physique" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>



        {profilesInfos && Object.values(profilesInfos).some(value => value) && (
          <Card className="border-border mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Infos d'apprentissage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 relative">
                <Label>1. Préférence d'apprentissage</Label>
                <AutoResizeTextarea value={profilesInfos.pref_apprendre_idee ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('pref_apprendre_idee', profilesInfos.pref_apprendre_idee ?? '')}
                  aria-label="Modifier la préférence d'apprentissage"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>2. Mémoire et mémorisation</Label>
                <AutoResizeTextarea value={profilesInfos.memoire_poesie ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('memoire_poesie', profilesInfos.memoire_poesie ?? '')}
                  aria-label="Modifier la mémoire et mémorisation"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>3. Résolution de problèmes</Label>
                <AutoResizeTextarea value={profilesInfos.resoudre_maths ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('resoudre_maths', profilesInfos.resoudre_maths ?? '')}
                  aria-label="Modifier la résolution de problèmes"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>4. Intérêts personnels</Label>
                <AutoResizeTextarea value={profilesInfos.temps_libre_pref ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('temps_libre_pref', profilesInfos.temps_libre_pref ?? '')}
                  aria-label="Modifier les intérêts personnels"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>5. Travail en groupe</Label>
                <AutoResizeTextarea value={profilesInfos.travail_groupe_role ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('travail_groupe_role', profilesInfos.travail_groupe_role ?? '')}
                  aria-label="Modifier le travail en groupe"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>6. Rétention d'information</Label>
                <AutoResizeTextarea value={profilesInfos.retenir_info ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('retenir_info', profilesInfos.retenir_info ?? '')}
                  aria-label="Modifier la rétention d'information"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>7. Préférence d'enseignement</Label>
                <AutoResizeTextarea value={profilesInfos.pref_enseignant ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('pref_enseignant', profilesInfos.pref_enseignant ?? '')}
                  aria-label="Modifier la préférence d'enseignement"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>8. Découverte de nouveaux lieux</Label>
                <AutoResizeTextarea value={profilesInfos.decouvrir_endroit ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('decouvrir_endroit', profilesInfos.decouvrir_endroit ?? '')}
                  aria-label="Modifier la découverte de nouveaux lieux"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>9. Définition de la réussite</Label>
                <AutoResizeTextarea value={profilesInfos.reussir_definition ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('reussir_definition', profilesInfos.reussir_definition ?? '')}
                  aria-label="Modifier la définition de la réussite"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>10. Rappel de souvenirs</Label>
                <AutoResizeTextarea value={profilesInfos.souvenir_important ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('souvenir_important', profilesInfos.souvenir_important ?? '')}
                  aria-label="Modifier le rappel de souvenirs"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section pour changer le mot de passe */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Enregistrement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section pour changer l'email */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Changer l'email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Nouvel email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouvel.email@example.com"
                  required
                  disabled={emailLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? 'Enregistrement...' : 'Changer l\'email'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Modal d'édition des questions */}
        <ProfileQuestionEditModal
          isOpen={editModal.isOpen}
          onClose={handleCloseModal}
          questionKey={editModal.questionKey}
          currentValue={editModal.currentValue}
          onSave={handleSaveQuestion}
        />
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
