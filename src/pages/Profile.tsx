import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";

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

  const onChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

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
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
