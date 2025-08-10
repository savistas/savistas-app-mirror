import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Camera, Upload, BarChart3, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const UploadCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subject: "",
    level: "",
    lesson: "",
    difficulties: "",
    duration: [15],
    format: "20QCM"
  });
  const [file, setFile] = useState<File | null>(null);
  const [uploadKind, setUploadKind] = useState<'photo' | 'pdf' | null>(null);
  const [creating, setCreating] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour créer un cours.", variant: "destructive" });
      return;
    }
    if (!formData.lesson || !formData.subject || !formData.level) {
      toast({ title: "Champs manquants", description: "Matière, niveau et leçon sont requis.", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Fichier requis", description: "Ajoutez une image ou un PDF pour votre cours.", variant: "destructive" });
      return;
    }

    try {
      setCreating(true);
      const unique = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}`;
      const path = `${user.id}/${unique}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('courses')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pub } = supabase.storage.from('courses').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const isImage = file.type.startsWith('image/');

      const { error: insertError } = await supabase
        .from('courses')
        .insert([
          {
            title: formData.lesson,
            subject: formData.subject,
            level: formData.level,
            description: formData.difficulties || null,
            file_url: publicUrl,
            cover_url: isImage ? publicUrl : null,
            user_id: user.id,
          },
        ]);

      if (insertError) throw insertError;

      toast({ title: "Cours créé", description: "Votre cours a été enregistré." });
      navigate("/planning");
    } catch (e: any) {
      console.error(e);
      toast({ title: "Échec de la création", description: e?.message ?? "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-border">
        <Link to="/dashboard">
          <ArrowLeft className="w-6 h-6 text-foreground" strokeWidth={1.5} />
        </Link>
        <h1 className="ml-4 text-xl font-semibold text-foreground">
          Nouveau cours
        </h1>
      </header>

      <div className="p-6 max-w-2xl mx-auto animate-fade-in">
        {/* Hidden file inputs for initial selection */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f) {
              setUploadKind('photo');
              setStep(2);
            }
          }}
        />
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f) {
              setUploadKind('pdf');
              setStep(2);
            }
          }}
        />
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-center text-foreground">
              Comment souhaitez-vous ajouter votre cours ?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer transition-all hover:shadow-md border-border"
                onClick={() => { setUploadKind('photo'); photoInputRef.current?.click(); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Camera className="w-12 h-12 text-primary" strokeWidth={1.5} />
                  <span className="text-lg font-medium text-foreground">
                    Prendre une photo
                  </span>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer transition-all hover:shadow-md border-border"
                onClick={() => { setUploadKind('pdf'); pdfInputRef.current?.click(); }}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Upload className="w-12 h-12 text-primary" strokeWidth={1.5} />
                  <span className="text-lg font-medium text-foreground">
                    Uploader un PDF
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-xl text-center">
                Configuration du cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Matière</Label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({...formData, subject: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mathematiques">Mathématiques</SelectItem>
                      <SelectItem value="physique">Physique</SelectItem>
                      <SelectItem value="chimie">Chimie</SelectItem>
                      <SelectItem value="francais">Français</SelectItem>
                      <SelectItem value="histoire">Histoire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seconde">Seconde</SelectItem>
                      <SelectItem value="premiere">Première</SelectItem>
                      <SelectItem value="terminale">Terminale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson">Leçon/Chapitre</Label>
                <Input
                  id="lesson"
                  placeholder="Ex: Fonctions affines"
                  value={formData.lesson}
                  onChange={(e) => setFormData({...formData, lesson: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulties">Difficultés rencontrées (optionnel)</Label>
                <Input
                  id="difficulties"
                  placeholder="Décrivez vos difficultés..."
                  value={formData.difficulties}
                  onChange={(e) => setFormData({...formData, difficulties: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">Fichier du cours ({uploadKind === 'pdf' ? 'PDF' : 'Image'})</Label>
                <Input
                  id="file"
                  type="file"
                  accept={uploadKind === 'pdf' ? 'application/pdf' : 'image/*'}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">Le fichier sera stocké de façon sécurisée.</p>
              </div>

              <div className="space-y-4">
                <Label>Durée : {formData.duration[0]} jour(s)</Label>
                <Slider
                  value={formData.duration}
                  onValueChange={(value) => setFormData({...formData, duration: value})}
                  max={31}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="format">Format</Label>
                <div className="flex items-center space-x-2">
                  <span className={formData.format === "20QCM" ? "text-primary font-medium" : "text-muted-foreground"}>
                    20 QCM
                  </span>
                  <Switch 
                    checked={formData.format === "40QCM"}
                    onCheckedChange={(checked) => setFormData({...formData, format: checked ? "40QCM" : "20QCM"})}
                  />
                  <span className={formData.format === "40QCM" ? "text-primary font-medium" : "text-muted-foreground"}>
                    40 QCM
                  </span>
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  <span className="font-medium">Aperçu graphique évolutif</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Votre progression sera suivie jour par jour avec des graphiques détaillés.
                </p>
              </div>

              <Button 
                onClick={handleCreate}
                disabled={creating}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
              >
                {creating ? "Création..." : "Créer"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UploadCourse;