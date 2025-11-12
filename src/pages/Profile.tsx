import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, LogOut, ChevronLeft, ChevronRight, AlertCircle, Check, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import BurgerMenu from "@/components/BurgerMenu";
import ProfileQuestionEditModal from "@/components/ProfileQuestionEditModal";
import InformationSurveyDialog from "@/components/InformationSurveyDialog";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { OrganizationCodeInput } from "@/components/OrganizationCodeInput";
import { OrganizationCodeDialog } from "@/components/OrganizationCodeDialog";
import { OrganizationPendingApproval } from "@/components/OrganizationPendingApproval";
import { ActiveOrganizationInfo } from "@/components/ActiveOrganizationInfo";
import { useNavigate, useSearchParams } from "react-router-dom";
import { InformationStep } from "@/components/register/InformationStep";
import { EducationStep } from "@/components/register/EducationStep";
import { SubscriptionStep } from "@/components/register/SubscriptionStep";
import { StepIndicator } from "@/components/register/StepIndicator";
import { StudentProfileForm } from "@/components/StudentProfileForm";
import { OrganizationProfileForm } from "@/components/OrganizationProfileForm";
import { useUserRole } from "@/hooks/useUserRole";
import { SubscriptionCard } from "@/components/subscription/SubscriptionCard";
import { clearCheckoutSession } from "@/lib/checkoutSession";
import { useSubscription } from "@/hooks/useSubscription";
import { RoleChangeDialog } from "@/components/RoleChangeDialog";
import { useOrganizationLeave } from "@/hooks/useOrganizationLeave";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, loading: roleLoading } = useUserRole();
  const { refetch: refetchSubscription } = useSubscription();
  const { leaveOrganization, isLeaving: isLeavingOrgHook } = useOrganizationLeave();

  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // États pour le mode complétion
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [completionStep, setCompletionStep] = useState(1);
  const [completionData, setCompletionData] = useState({
    country: "",
    city: "",
    postalCode: "",
    profilePhoto: null as File | null,
    organizationCode: "",
    aiLevel: "",
    educationLevel: "",
    classes: "",
    subjects: "",
    subscription: "",
  });

  // États pour la validation du code d'organisation
  const [organizationValidated, setOrganizationValidated] = useState<boolean>(false);
  const [validatedOrgId, setValidatedOrgId] = useState<string | null>(null);
  const [validatedOrgName, setValidatedOrgName] = useState<string | null>(null);
  const [validatedOrgCode, setValidatedOrgCode] = useState<string | null>(null);

  // État pour le dialog du code d'organisation (étudiants uniquement)
  const [showOrgCodeDialog, setShowOrgCodeDialog] = useState<boolean>(false);
  const [orgDialogDismissed, setOrgDialogDismissed] = useState<boolean>(false);
  const [pendingOrgApproval, setPendingOrgApproval] = useState<{ organizationName: string } | null>(null);
  const [activeOrganization, setActiveOrganization] = useState<{ organizationName: string; adminEmail: string; membershipId: string } | null>(null);
  const [isLeavingOrg, setIsLeavingOrg] = useState(false);

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
    role: "",
    subscription: "basic",
    ai_level: "",
    troubles_detection_completed: false,
    learning_styles_completed: false,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // État pour les styles d'apprentissage
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);

  // État pour le dialogue de suppression de compte
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // État pour le dialogue de changement de rôle
  const [showRoleChangeDialog, setShowRoleChangeDialog] = useState(false);

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
      if (!user || roleLoading) return;

      // Charger les données du localStorage si disponibles (pour les étudiants)
      if (role === 'student') {
        // Vérifier si l'étudiant a une demande en attente
        const { data: pendingMembership } = await supabase
          .from('organization_members')
          .select('id, status, organization_id, organizations(name)')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (pendingMembership && pendingMembership.organizations) {
          // L'utilisateur a une demande en attente
          setPendingOrgApproval({ organizationName: pendingMembership.organizations.name });
          // Nettoyer le localStorage
          localStorage.removeItem('validated_org_id');
          localStorage.removeItem('validated_org_name');
          localStorage.removeItem('validated_org_code');
        } else {
          // Vérifier si l'étudiant a une adhésion active
          const { data: activeMembership, error: membershipError } = await supabase
            .from('organization_members')
            .select(`
              id,
              status,
              organization_id,
              approved_by,
              organizations(name, created_by)
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          console.log('Active membership query result:', { activeMembership, membershipError });

          if (activeMembership && activeMembership.organizations) {
            // Récupérer l'email de l'admin qui a approuvé (ou du créateur de l'organisation)
            const adminId = activeMembership.approved_by || (activeMembership.organizations as any).created_by;

            console.log('Admin ID to fetch:', adminId);

            if (adminId) {
              const { data: adminProfile, error: profileError } = await supabase
                .from('profiles')
                .select('email')
                .eq('user_id', adminId)
                .maybeSingle();

              console.log('Admin profile result:', { adminProfile, profileError });

              if (adminProfile?.email) {
                const orgData = {
                  organizationName: (activeMembership.organizations as any).name,
                  adminEmail: adminProfile.email,
                  membershipId: activeMembership.id
                };
                console.log('Setting active organization:', orgData);
                setActiveOrganization(orgData);
              } else {
                console.error('Failed to fetch admin profile, error:', profileError);
                // Fallback: set organization info without admin email
                const orgData = {
                  organizationName: (activeMembership.organizations as any).name,
                  adminEmail: 'Non disponible',
                  membershipId: activeMembership.id
                };
                console.log('Setting active organization (no admin email):', orgData);
                setActiveOrganization(orgData);
              }
            }
          } else {
            // Charger depuis localStorage pour pré-remplir le formulaire
            const storedOrgId = localStorage.getItem('validated_org_id');
            const storedOrgName = localStorage.getItem('validated_org_name');
            const storedOrgCode = localStorage.getItem('validated_org_code');

            if (storedOrgId && storedOrgName && storedOrgCode) {
              setValidatedOrgId(storedOrgId);
              setValidatedOrgName(storedOrgName);
              setValidatedOrgCode(storedOrgCode);
              setOrganizationValidated(true);
            }
          }
        }
      }

      // IMPORTANT : Vérifier d'abord si l'organisation a une demande en attente ou rejetée
      if (role === 'school' || role === 'company') {
        const { data: requests } = await supabase
          .from('organization_requests')
          .select('id, status')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false });

        if (requests && requests.length > 0) {
          const latestRequest = requests[0];

          // Si pending ou rejected, rediriger vers creation-request
          if (latestRequest.status === 'pending' || latestRequest.status === 'rejected') {
            navigate(`/${role}/creation-request`);
            return;
          }

          // Si approved, continuer normalement et permettre l'accès au profil
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email,phone,country,city,postal_code,education_level,classes,subjects,subscription,profile_photo_url')
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
          role: data.role ?? "",
          subscription: data.subscription ?? "basic",
          link_code: data.link_code ?? "",
          link_relation: data.link_relation ?? "",
          ent: data.ent ?? "",
          ai_level: data.ai_level ?? "",
          troubles_detection_completed: data.troubles_detection_completed ?? false,
          learning_styles_completed: data.learning_styles_completed ?? false,
        });
        setAvatarUrl(data.profile_photo_url ?? null);

        // Vérifier si le profil est incomplet
        const isIncomplete = !data.country ||
          !data.education_level ||
          !data.classes ||
          !data.subjects ||
          !data.subscription;

        if (isIncomplete) {
          setIsProfileIncomplete(true);
          // Pré-remplir completionData avec les données existantes
          setCompletionData(prev => ({
            ...prev,
            country: data.country ?? "",
            city: data.city ?? "",
            postalCode: data.postal_code ?? "",
            educationLevel: data.education_level ?? "",
            classes: data.classes ?? "",
            subjects: data.subjects ?? "",
            subscription: data.subscription ?? "",
          }));
        } else {
          setIsProfileIncomplete(false);
        }
      } else {
        // fallback minimal
        setForm((f) => ({ ...f, email: user.email ?? "" }));
        setIsProfileIncomplete(true); // Si pas de données, profil incomplet
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [user, role, roleLoading, navigate]);

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

  // Handle Stripe checkout return (success/cancel)
  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout');

    if (checkoutStatus) {
      if (checkoutStatus === 'success') {
        // Clear the checkout session from localStorage
        clearCheckoutSession();

        // Show success toast
        toast({
          title: "Paiement réussi!",
          description: "Votre abonnement a été mis à jour avec succès.",
        });

        // Refetch subscription data to update UI
        refetchSubscription();
      } else if (checkoutStatus === 'canceled') {
        // Clear the checkout session from localStorage
        clearCheckoutSession();

        // Show canceled toast
        toast({
          title: "Paiement annulé",
          description: "Vous avez annulé le processus de paiement.",
          variant: "default",
        });
      }

      // Remove the query parameter from URL
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast, refetchSubscription]);

  // Effet pour afficher le dialog du code d'organisation pour les étudiants avec profil incomplet
  useEffect(() => {
    const checkOrganizationDialog = async () => {
      if (!user || roleLoading || !isProfileIncomplete) return;
      if (role !== 'student') return;
      if (orgDialogDismissed) return;

      // Vérifier si un code a déjà été validé (dans localStorage)
      const storedOrgCode = localStorage.getItem('validated_org_code');
      if (storedOrgCode) {
        // Code déjà validé, ne pas afficher le dialog
        return;
      }

      // Vérifier si l'étudiant est déjà membre d'une organisation
      const { data: membership } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      // Si pas encore membre et pas de code validé, afficher le dialog
      if (!membership) {
        setShowOrgCodeDialog(true);
      }
    };

    checkOrganizationDialog();
  }, [user, role, roleLoading, isProfileIncomplete, orgDialogDismissed]);

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

  // Fonctions pour le mode complétion
  const calculateCompletionProgress = () => {
    const totalFields = 5; // country, city, postalCode, educationLevel, classes, subjects, subscription
    const requiredFields = ['country', 'city', 'postalCode', 'educationLevel', 'classes', 'subjects', 'subscription'];
    const completedFields = requiredFields.filter(field => {
      const value = completionData[field as keyof typeof completionData];
      return value && value !== "";
    });
    
    const percentage = Math.round((completedFields.length / totalFields) * 100);
    const missing = requiredFields.filter(field => {
      const value = completionData[field as keyof typeof completionData];
      return !value || value === "";
    }).map(field => {
      const fieldNames: Record<string, string> = {
        country: "Pays",
        city: "Ville", 
        postalCode: "Code postal",
        educationLevel: "Niveau d'éducation",
        classes: "Classes",
        subjects: "Matières",
        subscription: "Abonnement"
      };
      return fieldNames[field] || field;
    });

    return { percentage, missing };
  };

  const handleCompletionNext = () => {
    if (canProceedCompletion() && completionStep < 3) {
      setCompletionStep(prev => prev + 1);
    }
  };

  const handleCompletionPrev = () => {
    if (completionStep > 1) {
      setCompletionStep(prev => prev - 1);
    }
  };

  const canProceedCompletion = () => {
    // Vérifier seulement les champs obligatoires
    return (
      completionData.country !== "" && 
      completionData.educationLevel !== "" && 
      completionData.classes !== "" && 
      completionData.subjects !== "" && 
      completionData.subscription !== ""
    );
  };

  const handleCompletionSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      console.log('Starting profile completion...', { user_id: user.id, completionData });

      // Upload photo de profil si existe
      let profilePhotoUrl: string | null = null;
      if (completionData.profilePhoto) {
        console.log('Uploading profile photo...');
        const fileExt = completionData.profilePhoto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, completionData.profilePhoto, { upsert: true });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(uploadData.path);
          profilePhotoUrl = urlData.publicUrl;
          console.log('Photo uploaded successfully:', profilePhotoUrl);
        }
      }

      // Vérifier si le profil existe déjà
      console.log('Checking if profile exists...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      console.log('Existing profile:', existingProfile);

      // Préparer les données de mise à jour
      const profileUpdate = {
        user_id: user.id,
        email: user.email,
        country: completionData.country,
        city: completionData.city,
        postal_code: completionData.postalCode,
        education_level: completionData.educationLevel,
        classes: completionData.classes,
        subjects: completionData.subjects,
        subscription: completionData.subscription,
        ai_level: completionData.aiLevel || null,
        updated_at: new Date().toISOString(),
        ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {}),
        ...(existingProfile?.full_name ? { full_name: existingProfile.full_name } : {})
      };

      console.log('Profile update data:', profileUpdate);

      // Utiliser upsert pour créer ou mettre à jour
      const { data: upsertData, error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select();

      if (profileError) {
        console.error('Profile upsert error:', profileError);
        throw profileError;
      }

      console.log('Profile updated successfully:', upsertData);

      // Si un code d'organisation valide a été entré, créer la demande d'adhésion
      if (organizationValidated && validatedOrgId) {
        try {
          const { data: existingMembership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!existingMembership) {
            const { error: memberError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: validatedOrgId,
                user_id: user.id,
                status: 'pending',
                role: 'student',
                requested_at: new Date().toISOString(),
              });

            if (memberError) {
              console.error('Error creating organization membership:', memberError);
            } else {
              toast({
                title: "Demande envoyée !",
                description: `Votre demande a été envoyée à ${validatedOrgName}. Vous recevrez une notification une fois votre demande approuvée.`,
              });
            }
          }
        } catch (orgError) {
          console.error('Organization membership error:', orgError);
        }
      }

      if (!organizationValidated || !validatedOrgId) {
        toast({
          title: "Profil complété !",
          description: "Vos informations ont été enregistrées avec succès.",
        });
      }

      // Reload automatique de la page pour actualiser l'état du profil
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error('Profile completion error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de compléter le profil",
        variant: "destructive",
      });
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

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté avec succès." });
      navigate("/auth");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de se déconnecter", variant: "destructive" });
    }
  };

  const handleLeaveOrganization = async () => {
    if (!user || !activeOrganization) return;

    setIsLeavingOrg(true);

    try {
      // Utiliser le hook pour quitter et restaurer l'abonnement
      const success = await leaveOrganization(user.id, activeOrganization.membershipId);

      if (success) {
        // Réinitialiser l'état
        setActiveOrganization(null);

        // Recharger les données du profil pour refléter les changements
        setTimeout(() => {
          window.location.reload();
        }, 2000); // Attendre 2 secondes pour que l'utilisateur puisse lire les notifications
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message ?? "Impossible de quitter l'organisation",
        variant: "destructive"
      });
    } finally {
      setIsLeavingOrg(false);
    }
  };

  const handleRetakeQuestionnaires = async () => {
    if (!user) return;
    try {
      // Delete questionnaire data - triggers will automatically set flags to false

      // Delete troubles detection data
      await supabase
        .from('troubles_questionnaire_reponses')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('troubles_detection_scores')
        .delete()
        .eq('user_id', user.id);

      // Delete learning styles data
      await supabase
        .from('styles_apprentissage')
        .delete()
        .eq('user_id', user.id);

      // Delete survey data
      await supabase
        .from('profiles_infos')
        .delete()
        .eq('user_id', user.id);

      // Note: flags are automatically reset to false by database triggers

      toast({
        title: "Questionnaires réinitialisés",
        description: pendingOrgApproval
          ? "Rechargez la page pour refaire les questionnaires."
          : "Vous pouvez maintenant refaire les questionnaires sur le tableau de bord."
      });

      // Si en attente d'approbation, recharger la page au lieu de naviguer vers dashboard
      if (pendingOrgApproval) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        navigate('/dashboard');
      }
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e.message ?? "Impossible de réinitialiser les questionnaires",
        variant: "destructive"
      });
    }
  };

  const handleProfileCompletion = () => {
    // Nettoyer le localStorage après complétion
    localStorage.removeItem('validated_org_id');
    localStorage.removeItem('validated_org_name');
    localStorage.removeItem('validated_org_code');

    // Recharger le profil après complétion
    setIsProfileIncomplete(false);
    window.location.reload();
  };

  // Gestionnaires pour le dialog du code d'organisation
  const handleOrgCodeSuccess = async (organizationId: string, organizationName: string, code: string) => {
    if (!user) return;

    // Stocker dans le localStorage pour persister entre les renders
    // L'ajout à organization_members se fera lors de la soumission du formulaire
    localStorage.setItem('validated_org_id', organizationId);
    localStorage.setItem('validated_org_name', organizationName);
    localStorage.setItem('validated_org_code', code);

    setValidatedOrgId(organizationId);
    setValidatedOrgName(organizationName);
    setValidatedOrgCode(code);
    setOrganizationValidated(true);
    setShowOrgCodeDialog(false);

    toast({
      title: "Code validé !",
      description: `Complétez votre profil pour rejoindre ${organizationName}.`,
    });
  };

  const handleOrgCodeSkip = () => {
    setShowOrgCodeDialog(false);
    setOrgDialogDismissed(true);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Step 1: Delete all user data from database using RPC function
      console.log('Step 1: Deleting user data from database...');
      const { data: deleteResult, error: rpcError } = await supabase.rpc('delete_user_account');

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(`Failed to delete user data: ${rpcError.message}`);
      }

      console.log('User data deleted:', deleteResult);

      // Step 2: Delete auth user and storage files using Edge Function
      console.log('Step 2: Deleting auth account...');
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !data?.session) {
        throw new Error('No active session');
      }

      const session = data.session;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to delete auth account');
      }

      console.log('Auth account deleted successfully');

      // Sign out (account is deleted, but let's clean up the local session)
      await supabase.auth.signOut();

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Au revoir !",
      });

      // Redirect to auth page
      navigate('/auth');
    } catch (e: any) {
      console.error('Error deleting account:', e);
      toast({
        title: "Erreur",
        description: e.message ?? "Impossible de supprimer le compte",
        variant: "destructive",
      });
    }
  };

  // Rendu de la page Profil
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{form.full_name || 'Mon profil'}</span>
        </div>
        <div className="w-10 h-10">
          {!roleLoading && role !== 'school' && role !== 'company' && <BurgerMenu />}
        </div>
      </header>

      {/* Main Content */}
      <div className="px-6 py-8 pt-24 md:pt-28 pb-32">
        <div className="w-full md:w-[70%] mx-auto animate-fade-in">
        
        {/* Dialog du code d'organisation pour les étudiants */}
        {role === 'student' && (
          <OrganizationCodeDialog
            open={showOrgCodeDialog}
            onOpenChange={setShowOrgCodeDialog}
            onSuccess={handleOrgCodeSuccess}
            onSkip={handleOrgCodeSkip}
          />
        )}

        {/* Message de blocage si en attente d'approbation */}
        {pendingOrgApproval && (
          <OrganizationPendingApproval organizationName={pendingOrgApproval.organizationName} />
        )}

        {/* Affichage des informations de l'organisation active */}
        {!pendingOrgApproval && activeOrganization && (
          <ActiveOrganizationInfo
            organizationName={activeOrganization.organizationName}
            adminEmail={activeOrganization.adminEmail}
            onLeaveOrganization={handleLeaveOrganization}
            isLeaving={isLeavingOrg}
          />
        )}

        {/* Section de complétion du profil (si profil incomplet et pas en attente) */}
        {isProfileIncomplete && !roleLoading && !pendingOrgApproval && (
          <Card className="mb-8">
            <CardContent className="p-8">
              {role === 'student' ? (
                <StudentProfileForm
                  onComplete={handleProfileCompletion}
                  joinedViaCode={organizationValidated}
                  organizationId={validatedOrgId}
                  organizationName={validatedOrgName}
                  organizationCode={validatedOrgCode}
                />
              ) : (role === 'school' || role === 'company') ? (
                <OrganizationProfileForm
                  onComplete={handleProfileCompletion}
                  organizationType={role as 'school' | 'company'}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Chargement du formulaire...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Section profil normal (grisée uniquement si profil incomplet, pas si en attente) */}
        <div className={isProfileIncomplete ? "opacity-50 pointer-events-none" : ""}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Photo et nom utilisateur */}
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
              <Avatar className="w-16 h-16">
                <AvatarImage src={avatarUrl ?? undefined} alt={form.full_name || form.email || 'Avatar'} />
                <AvatarFallback className="text-lg">
                  {(form.full_name || form.email || 'P').slice(0,1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {form.full_name || 'Nom non renseigné'}
                </h2>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className={`grid w-full ${role === 'school' || role === 'company' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} h-auto sm:h-10`}>
                <TabsTrigger value="general" className="text-sm sm:text-sm py-3 sm:py-2">Informations générales</TabsTrigger>
                {role !== 'school' && role !== 'company' && (
                  <TabsTrigger value="education" className="text-sm sm:text-sm py-3 sm:py-2">Informations scolaires</TabsTrigger>
                )}
                <TabsTrigger value="subscription" className="text-sm sm:text-sm py-3 sm:py-2">Abonnement</TabsTrigger>
              </TabsList>

              {/* Onglet Informations générales */}
              <TabsContent value="general" className="space-y-6 mt-6">
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
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Onglet Informations scolaires - Masqué pour les organisations */}
              {role !== 'school' && role !== 'company' && (
                <TabsContent value="education" className="space-y-6 mt-6">
                  <form onSubmit={handleSave} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <div className="space-y-2">
                        <Label>Code de liaison</Label>
                        <Input value={form.link_code} onChange={(e) => onChange('link_code', e.target.value)} placeholder="Code de liaison" />
                      </div>
                      <div className="space-y-2">
                        <Label>Relation de liaison</Label>
                        <Input value={form.link_relation} onChange={(e) => onChange('link_relation', e.target.value)} placeholder="Type de relation" />
                      </div>
                      <div className="space-y-2">
                        <Label>ENT</Label>
                        <Input value={form.ent} onChange={(e) => onChange('ent', e.target.value)} placeholder="Votre ENT" />
                      </div>
                      <div className="space-y-2">
                        <Label>Niveau IA</Label>
                        <Input value={form.ai_level} onChange={(e) => onChange('ai_level', e.target.value)} placeholder="Votre niveau IA" />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              )}

              {/* Onglet Abonnement */}
              <TabsContent value="subscription" className="space-y-6 mt-6">
                {/* Message pour les membres d'organisation */}
                {activeOrganization ? (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-6">
                      <div className="space-y-3 text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-900">
                          <AlertCircle className="w-5 h-5" />
                          <h3 className="text-lg font-semibold">Abonnement géré par votre organisation</h3>
                        </div>
                        <p className="text-blue-800">
                          Votre abonnement est pris en charge par <strong>{activeOrganization.organizationName}</strong>.
                        </p>
                        <p className="text-sm text-blue-700">
                          Vous bénéficiez des avantages fournis par votre organisation.
                          Pour toute question concernant votre abonnement, veuillez contacter l'administrateur de votre organisation.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <SubscriptionCard />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section Styles d'apprentissage - affichée uniquement si pas complété et pas d'infos ET pas une organisation ET pas en attente d'approbation */}
        {!roleLoading && role !== 'school' && role !== 'company' && !pendingOrgApproval && !form.learning_styles_completed && (!profilesInfos || !Object.values(profilesInfos).some(value => value)) && (
          <Card className="border-border mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Styles d'apprentissage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Remplez le questionnaire de styles d'apprentissage pour personnaliser votre expérience.
              </p>
              <Button
                onClick={() => setShowSurveyDialog(true)}
                variant="outline"
                className="w-full"
              >
                Remplir les styles d'apprentissage
              </Button>
            </CardContent>
          </Card>
        )}



        {/* Section Infos d'apprentissage - cachée pour les organisations */}
        {!roleLoading && role !== 'school' && role !== 'company' && profilesInfos && Object.values(profilesInfos).some(value => value) && (
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

        {/* Section pour refaire les questionnaires - cachée pour les organisations et en attente d'approbation */}
        {!roleLoading && role !== 'school' && role !== 'company' && !pendingOrgApproval && (
          <Card className="border-border mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Questionnaires de personnalisation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Refaites les questionnaires de prédétection de troubles et de styles d'apprentissage pour mettre à jour votre profil.
              </p>
              <Button
                onClick={handleRetakeQuestionnaires}
                variant="outline"
                className="w-full"
              >
                Refaire les questionnaires de prédétection
              </Button>
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

        {/* Section pour changer de type de compte */}
        <Card className="border-amber-200 bg-amber-50/50 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-amber-700">Changer de type de compte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-amber-600">
                Vous vous êtes inscrit avec le mauvais type de compte ? Vous pouvez le changer ici.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={() => setShowRoleChangeDialog(true)}
                  variant="outline"
                  className="flex items-center gap-2 border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Changer de type de compte
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section pour se déconnecter */}
        <Card className="border-red-200 bg-red-50/50 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-red-700">Se déconnecter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                Vous serez redirigé vers la page de connexion après déconnexion.
              </p>
              <div className="flex justify-end">
                <Button
                  onClick={handleLogout}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section pour supprimer le compte */}
        <Card className="border-red-500 bg-red-100/50 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-red-900 flex items-center gap-2">
              <Trash2 className="h-6 w-6" />
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-red-300">
                <h3 className="font-semibold text-red-900 mb-2">
                  Supprimer définitivement mon compte
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Cette action est irréversible. Toutes vos données seront définitivement supprimées,
                  incluant votre profil, vos cours, vos résultats, vos conversations et votre compte d'authentification.
                </p>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    className="flex items-center gap-2 bg-red-700 hover:bg-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </div>
              </div>
            </div>
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

        {/* Dialogue des styles d'apprentissage */}
        <InformationSurveyDialog
          isOpen={showSurveyDialog}
          onClose={() => setShowSurveyDialog(false)}
          onSurveyComplete={() => {
            setShowSurveyDialog(false);
            window.location.reload(); // Recharger pour mettre à jour les données
          }}
          initialQuestionIndex={0}
          initialAnswers={{}}
          onQuestionIndexChange={() => {}}
          onAnswersChange={() => {}}
        />

        {/* Dialogue de suppression de compte */}
        <DeleteAccountDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleDeleteAccount}
          userEmail={form.email}
        />

        {/* Dialogue de changement de rôle */}
        <RoleChangeDialog
          open={showRoleChangeDialog}
          onClose={() => setShowRoleChangeDialog(false)}
          currentRole={role || 'student'}
        />
        </div>
        {/* Fin de la section profil normal */}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-50">
      </div>
    </div>
  );
};

export default Profile;
