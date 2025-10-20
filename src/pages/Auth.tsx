import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Auth = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailVerificationDialog, setShowEmailVerificationDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    // Nouveaux champs pour l'inscription
    fullName: "",
    phone: "",
    role: "",
  });
  
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserProfileAndRedirect = async () => {
      if (!authLoading && user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('country, education_level, classes, subjects, subscription')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error("Erreur lors de la récupération du profil:", error);
          navigate("/dashboard");
          return;
        }

        // Vérifier si le profil est incomplet
        const isIncomplete = !profile || 
          !profile.country || 
          !profile.education_level || 
          !profile.classes || 
          !profile.subjects || 
          !profile.subscription;

        if (isIncomplete) {
          navigate("/profile");
        } else {
          navigate("/dashboard");
        }
      }
    };

    checkUserProfileAndRedirect();
  }, [user, authLoading, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message === 'Invalid login credentials' 
            ? "Email ou mot de passe incorrect" 
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté",
        });
        // La redirection est maintenant gérée par le useEffect
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Erreur",
        description: "Vous devez accepter les conditions d'utilisation et la politique de confidentialité",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Préparer les données utilisateur pour l'inscription
      const userData = {
        full_name: formData.fullName,
        role: formData.role,
        phone: formData.phone,
      };

      // Créer le compte (Supabase Auth gère automatiquement les emails existants)
      const { user: newUser, error } = await signUp(formData.email, formData.password, userData);

      if (error) {
        console.error("Erreur d'inscription Supabase:", error);
        
        // Vérifier si l'utilisateur existe déjà
        if (error.message.includes("User already registered") || 
            error.message.includes("already") ||
            error.message.includes("duplicate") ||
            error.status === 422) {
          toast({
            title: "Compte existant",
            description: "Cette adresse mail est déjà inscrite. Veuillez vous connecter si vous avez déjà un compte.",
            variant: "destructive",
          });
          setActiveTab("signin");
          handleInputChange('email', formData.email);
        } else {
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: "destructive",
          });
        }
        setLoading(false);
        return;
      }

      const uid = newUser?.id;

      if (!uid) {
        toast({
          title: "Erreur",
          description: "Impossible de récupérer l'ID utilisateur après l'inscription.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Envoyer les données au webhook N8N uniquement si l'inscription est nouvelle
      try {
        const webhookData = {
          email: formData.email,
          role: formData.role,
          phone: formData.phone,
          full_name: formData.fullName,
          user_id: uid,
        };
        await fetch("https://n8n.srv932562.hstgr.cloud/webhook/creation-compte", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookData),
        });
      } catch (webhookError) {
        console.error("Erreur lors de l'envoi au webhook N8N:", webhookError);
      }

      // Afficher un message de succès sans dialogue de vérification
      toast({
        title: "Compte créé avec succès",
        description: "Vous pouvez maintenant vous connecter avec vos identifiants.",
      });

      // Rediriger vers l'onglet de connexion
      setActiveTab("signin");
      handleInputChange('email', formData.email);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du compte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre adresse email",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email envoyé",
          description: "Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.",
        });
        setShowForgotPasswordDialog(false);
        setResetEmail("");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de l'email",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border-border">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img
                src="/logo-savistas.png"
                alt="Savistas Logo"
                className="h-16 w-auto"
              />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-semibold">
                Bienvenue sur Savistas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Votre professeur particulier vous attend
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Se connecter</TabsTrigger>
                <TabsTrigger value="signup">S'inscrire</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="votre@email.com"
                      className="h-11"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordDialog(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading}
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-fullname">Nom complet *</Label>
                      <Input
                        id="signup-fullname"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Jean Dupont"
                        className="h-11"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Adresse e-mail *</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="jean.dupont@email.com"
                        className="h-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Champ téléphone supprimé */}

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Sélectionnez votre rôle *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleInputChange('role', value)}
                    >
                      <SelectTrigger className="h-11 rounded-md bg-background border border-input">
                        <SelectValue placeholder="Choisissez votre rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Élève</SelectItem>
                        <SelectItem value="teacher" disabled>Enseignant (bientôt disponible)</SelectItem>
                        <SelectItem value="parent" disabled>Parent (bientôt disponible)</SelectItem>
                        <SelectItem value="school" disabled>Établissement scolaire (bientôt disponible)</SelectItem>
                        <SelectItem value="company" disabled>Entreprise (bientôt disponible)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-0 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmer le mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-11 px-3 py-0 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={termsAccepted}
                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm">
                        J'accepte les <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">conditions d'utilisation</a> *
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="privacy" 
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked === true)}
                      />
                      <Label htmlFor="privacy" className="text-sm">
                        J'accepte la <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">politique de confidentialité</a> *
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11"
                    disabled={loading || !formData.fullName || !formData.email || !formData.password || !formData.role || !termsAccepted || !privacyAccepted}
                  >
                    {loading ? "Création du compte..." : "Créer mon compte"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dialogue mot de passe oublié */}
        <AlertDialog 
          open={showForgotPasswordDialog} 
          onOpenChange={setShowForgotPasswordDialog}
        >
          <AlertDialogContent className="rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Réinitialiser le mot de passe</AlertDialogTitle>
              <AlertDialogDescription>
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form onSubmit={handleForgotPassword}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="h-11"
                    required
                  />
                </div>
              </div>
              <AlertDialogFooter className="flex flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForgotPasswordDialog(false);
                    setResetEmail("");
                  }}
                  disabled={resetLoading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={resetLoading}>
                  {resetLoading ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialogue de vérification email */}
        <AlertDialog 
          open={showEmailVerificationDialog} 
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-center">Vérification requise</AlertDialogTitle>
              <AlertDialogDescription className="text-center">
                Un e-mail de confirmation a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et vos spams pour confirmer votre compte. Une fois votre e-mail confirmé, vous pourrez vous connecter.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="justify-center">
              <AlertDialogAction onClick={() => {
                setShowEmailVerificationDialog(false);
                setActiveTab("signin");
              }}>
                J'ai confirmé mon email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Auth;
