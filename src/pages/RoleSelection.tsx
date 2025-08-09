import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Book, 
  GraduationCap, 
  Users, 
  Building2, 
  Briefcase,
  HelpCircle 
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const roles = [
  { id: "student", label: "Élève", icon: Book },
  { id: "teacher", label: "Enseignant", icon: GraduationCap },
  { id: "parent", label: "Parent", icon: Users },
  { id: "school", label: "Établissement scolaire", icon: Building2 },
  { id: "company", label: "Entreprise", icon: Briefcase }
];

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const navigate = useNavigate();

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // Navigate to register with selected role
    navigate("/register", { state: { role: roleId } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-foreground mb-8">
            Sélectionnez votre rôle
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card 
              key={role.id}
              className="cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 border-border"
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <role.icon className="w-12 h-12 text-primary" strokeWidth={1.5} />
                <span className="text-lg font-medium text-foreground">
                  {role.label}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button 
            variant="ghost" 
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Aide
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;