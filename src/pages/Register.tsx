import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedRole = location.state?.role || "";
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    city: "",
    password: "",
    role: selectedRole,
    educationLevel: "",
    classes: "",
    subjects: "",
    profilePhoto: null as File | null,
    linkCode: "",
    linkRelation: "",
    ent: "",
    aiLevel: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally handle the registration
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background py-8 px-6">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">
              Créer un compte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="belgium">Belgique</SelectItem>
                      <SelectItem value="switzerland">Suisse</SelectItem>
                      <SelectItem value="canada">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Ville/Code postal</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Élève</SelectItem>
                      <SelectItem value="teacher">Enseignant</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="school">Établissement scolaire</SelectItem>
                      <SelectItem value="company">Entreprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Niveau d'enseignement</Label>
                  <Select value={formData.educationLevel} onValueChange={(value) => setFormData({...formData, educationLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primaire">Primaire</SelectItem>
                      <SelectItem value="college">Collège</SelectItem>
                      <SelectItem value="lycee">Lycée</SelectItem>
                      <SelectItem value="superieur">Supérieur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classes">Classe(s)</Label>
                  <Input
                    id="classes"
                    placeholder="Ex: Première S"
                    value={formData.classes}
                    onChange={(e) => setFormData({...formData, classes: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subjects">Matière(s)</Label>
                  <Input
                    id="subjects"
                    placeholder="Ex: Mathématiques, Physique"
                    value={formData.subjects}
                    onChange={(e) => setFormData({...formData, subjects: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms" className="text-sm">
                    J'accepte les conditions d'utilisation
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="privacy" />
                  <Label htmlFor="privacy" className="text-sm">
                    J'accepte la politique de confidentialité
                  </Label>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
              >
                Créer un compte
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;