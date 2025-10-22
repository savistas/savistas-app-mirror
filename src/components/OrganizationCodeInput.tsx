import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizationCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange: (
    isValid: boolean,
    orgId: string | null,
    orgName: string | null
  ) => void;
}

export const OrganizationCodeInput = ({
  value,
  onChange,
  onValidationChange,
}: OrganizationCodeInputProps) => {
  const [verifying, setVerifying] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!value) return;

    setVerifying(true);
    setIsValid(null);

    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, organization_code')
      .eq('organization_code', value.toUpperCase())
      .single();

    setVerifying(false);

    if (data && !error) {
      setIsValid(true);
      setOrgName(data.name);
      onValidationChange(true, data.id, data.name);
    } else {
      setIsValid(false);
      setOrgName(null);
      onValidationChange(false, null, null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value.toUpperCase());
              setIsValid(null);
            }}
            placeholder="ORG-ABC123"
            className={`
              ${isValid === true ? 'border-green-500 bg-green-50' : ''}
              ${isValid === false ? 'border-red-500' : ''}
            `}
            disabled={verifying || isValid === true}
          />
          {isValid === true && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />
          )}
        </div>
        <Button
          type="button"
          onClick={handleVerify}
          disabled={!value || verifying || isValid === true}
          variant={isValid === true ? 'default' : 'outline'}
          className={isValid === true ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {verifying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isValid === true ? 'Validé' : 'Vérifier'}
        </Button>
      </div>

      {isValid === true && orgName && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="w-4 h-4" />
          Organisation trouvée : {orgName}
        </p>
      )}

      {isValid === false && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          Ce code d'organisation n'existe pas
        </p>
      )}
    </div>
  );
};
