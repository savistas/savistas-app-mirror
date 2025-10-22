import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Camera, Upload, ArrowLeft, Plus, XCircle, Image } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNav from "@/components/BottomNav";
import BurgerMenu from "@/components/BurgerMenu";
import { SubjectCombobox } from "@/components/SubjectCombobox";

const UploadCourse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    subject: "",
    lesson: "",
    difficulties: "",
    days: 7,
  });
  const [files, setFiles] = useState<File[]>([]); // Changed from 'file' to 'files'
  const [uploadKind, setUploadKind] = useState<'photo' | 'pdf' | null>(null);
  const [creating, setCreating] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [showAddMoreOptions, setShowAddMoreOptions] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null); // New ref for gallery
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // New ref for combined file input
  const isMobile = useIsMobile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(selectedFiles)]);
      setStep(2);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  // Function to sanitize filename for storage
  const sanitizeFileName = (fileName: string): string => {
    // Get file extension
    const lastDotIndex = fileName.lastIndexOf('.');
    const name = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex !== -1 ? fileName.substring(lastDotIndex) : '';
    
    // Replace invalid characters with underscores and remove multiple consecutive underscores
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
      .replace(/_+/g, '_') // Replace multiple underscores with single one
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return sanitizedName + extension;
  };

  const handleCreate = async () => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour créer un cours.", variant: "destructive" });
      return;
    }
    if (!formData.lesson || !formData.subject) {
      toast({ title: "Champs manquants", description: "Matière et leçon sont requis.", variant: "destructive" });
      return;
    }

    if (files.length === 0) { // Changed from 'file' to 'files.length'
      toast({ title: "Fichier requis", description: "Ajoutez au moins une image ou un PDF pour votre cours.", variant: "destructive" });
      return;
    }

    try {
      setCreating(true);
      const fileUrls: string[] = [];
      const coverUrls: string[] = [];

      for (const file of files) {
        const unique = (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}`;
        const sanitizedFileName = sanitizeFileName(file.name);
        const path = `${user.id}/${unique}-${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from('courses')
          .upload(path, file, { upsert: false, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data: pub } = supabase.storage.from('courses').getPublicUrl(path);
        const publicUrl = pub.publicUrl;
        fileUrls.push(publicUrl);

        const isImage = file.type.startsWith('image/');
        if (isImage) {
          coverUrls.push(publicUrl);
        }
      }

      const { data, error: insertError } = await supabase
        .from('courses')
        .insert([
          {
            title: formData.lesson,
            subject: formData.subject,
            description: formData.difficulties || null,
            file_url: fileUrls, // Store as JSON array
            cover_url: coverUrls.length > 0 ? coverUrls : null, // Store as JSON array or null
            user_id: user.id,
            days_number: formData.days, // Store days_number
          },
        ])
        .select(); // Select the inserted data to get the ID

      if (insertError) throw insertError;

      const courseId = data?.[0]?.id;

      if (courseId && user.id) {
        setShowLoader(true); // Show loader
        try {
          const webhookUrl = "https://n8n.srv932562.hstgr.cloud/webhook/gneration-cours-savistas";
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              course_id: String(courseId), // Ensure course_id is a string
              user_id: String(user.id),   // Ensure user_id is a string
            }),
          });

          if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`);
          }

          const webhookResponse = await response.json();
          const courseIdFromWebhook = webhookResponse.id_course;

          if (courseIdFromWebhook) {
            toast({ title: "Webhook envoyé", description: "Les exercices sont en cours de génération." });
            navigate(`/courses/${courseIdFromWebhook}`);
          } else {
            toast({ title: "Webhook envoyé", description: "Les exercices sont en cours de génération, mais l'ID du cours n'a pas été reçu du webhook." });
            navigate("/planning"); // Fallback if id_course is not in webhook response
          }
        } catch (webhookError: any) {
          console.error("Webhook error:", webhookError);
          toast({ title: "Erreur Webhook", description: webhookError?.message ?? "Échec de l'envoi au webhook.", variant: "destructive" });
          navigate("/planning"); // Navigate to planning on webhook error
        } finally {
          setShowLoader(false); // Hide loader
        }
      } else {
        toast({ title: "Cours créé", description: "Votre cours a été enregistré." });
        navigate("/planning"); // Fallback if courseId is not available from Supabase insert
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: "Échec de la création", description: e?.message ?? "Une erreur est survenue.", variant: "destructive" });
      navigate("/planning"); // Navigate to planning on general error
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link to="/dashboard">
              <ArrowLeft className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </Link>
            <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">Nouveau cours</span>
          </div>
          <BurgerMenu />
        </header>

        <div className="p-6 pt-24 md:pt-28 pb-32 max-w-2xl mx-auto animate-fade-in">
          {/* Hidden file inputs for initial selection */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*,image/webp"
            className="hidden"
            multiple
            capture="environment" // Force camera on mobile
            onChange={handleFileChange}
          />
          <input
            ref={galleryInputRef} // New input for gallery
            type="file"
            accept="image/*,image/webp"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-center text-foreground">
                Comment souhaitez-vous ajouter votre cours ?
              </h2>
              
              <Card 
                className="cursor-pointer transition-all hover:shadow-md border-border"
                onClick={() => fileInputRef.current?.click()}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                  <Upload className="w-12 h-12 text-primary" strokeWidth={1.5} />
                  <span className="text-lg font-medium text-foreground">
                    Ajouter un document
                  </span>
                </CardContent>
              </Card>
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
                {/* Display selected files */}
                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Fichiers ajoutés</Label>
                    <ul className="space-y-1">
                      {files.map((file, index) => (
                        <li key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Ajouter un autre cours
                    </Button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="subject">Matière</Label>
                  <SubjectCombobox
                    value={formData.subject}
                    onChange={(value) => setFormData({...formData, subject: value})}
                  />
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
                  <Label htmlFor="qcm-days">Nombre de jours d'exercices (1 à 10)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[formData.days]}
                      onValueChange={(v) => setFormData({ ...formData, days: v[0] })}
                      min={1}
                      max={10}
                      step={1}
                      aria-label="Nombre de jours d'exercices"
                      className="w-full"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {formData.days} {formData.days > 1 ? "jours" : "jour"}
                    </span>
                  </div>
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

    <Dialog open={showLoader}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Génération des exercices</DialogTitle>
          <DialogDescription>
            Veuillez patienter pendant que nous générons les exercices pour votre cours. Cela peut prendre quelques instants.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center py-4">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </DialogContent>
    </Dialog>

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>
    </div>
    </>
  );
};

export default UploadCourse;
