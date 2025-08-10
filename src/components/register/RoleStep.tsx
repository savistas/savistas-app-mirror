import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Book, 
  GraduationCap, 
  Users, 
  Building2, 
  Briefcase 
} from "lucide-react";

const roles = [
  { id: "student", label: "Élève", icon: Book, available: true },
  { id: "teacher", label: "Enseignant", icon: GraduationCap, available: false },
  { id: "parent", label: "Parent", icon: Users, available: false },
  { id: "school", label: "Établissement scolaire", icon: Building2, available: false },
  { id: "company", label: "Entreprise", icon: Briefcase, available: false }
];

interface RoleStepProps {
  selectedRole: string;
  onRoleSelect: (roleId: string) => void;
}

export const RoleStep = ({ selectedRole, onRoleSelect }: RoleStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Sélectionnez votre rôle
        </h2>
        <p className="text-muted-foreground">
          Choisissez le rôle qui vous correspond le mieux
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {roles.map((role) => {
          if (!role.available) {
            return (
              <Tooltip key={role.id}>
                <TooltipTrigger asChild>
                  <Card className="cursor-not-allowed opacity-60 border-border">
                    <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                      <role.icon className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-lg font-medium text-muted-foreground">
                        {role.label}
                      </span>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fonctionnalité à venir</p>
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Card 
              key={role.id}
              className={`cursor-pointer rounded-xl hover-scale transition-all duration-300 hover:shadow-lg hover:scale-105 border-2 ${
                selectedRole === role.id 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              onClick={() => onRoleSelect(role.id)}
            >
              <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
                <role.icon 
                  className={`w-12 h-12 ${
                    selectedRole === role.id ? 'text-primary' : 'text-foreground'
                  }`} 
                  strokeWidth={1.5} 
                />
                <span className={`text-lg font-medium ${
                  selectedRole === role.id ? 'text-primary' : 'text-foreground'
                }`}>
                  {role.label}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};