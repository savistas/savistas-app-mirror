import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useExistingSubjects } from "@/hooks/useExistingSubjects";

interface SubjectComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SubjectCombobox({ value, onChange }: SubjectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);
  const { data: existingSubjects = [], isLoading } = useExistingSubjects();

  // Synchroniser inputValue avec value quand il change de l'extérieur
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSelect = (selectedSubject: string) => {
    onChange(selectedSubject);
    setInputValue(selectedSubject);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn(!inputValue && "text-muted-foreground")}>
            {inputValue || "Ex : Mathématiques"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher ou écrire..."
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm">
                Chargement des matières...
              </div>
            ) : (
              <>
                {existingSubjects.length === 0 && !inputValue && (
                  <CommandEmpty>Aucune matière existante.</CommandEmpty>
                )}
                {existingSubjects.length === 0 && inputValue && (
                  <div className="py-6 text-center text-sm">
                    Appuyez sur Entrée pour utiliser "{inputValue}"
                  </div>
                )}
                {existingSubjects.length > 0 && (
                  <CommandGroup heading="Matières existantes">
                    {existingSubjects
                      .filter((subject) =>
                        subject.toLowerCase().includes(inputValue.toLowerCase())
                      )
                      .map((subject) => (
                        <CommandItem
                          key={subject}
                          value={subject}
                          onSelect={() => handleSelect(subject)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === subject ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {subject}
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                {inputValue &&
                  !existingSubjects.some(
                    (subject) => subject.toLowerCase() === inputValue.toLowerCase()
                  ) && (
                    <CommandGroup heading="Nouvelle matière">
                      <CommandItem
                        value={inputValue}
                        onSelect={() => handleSelect(inputValue)}
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        Créer "{inputValue}"
                      </CommandItem>
                    </CommandGroup>
                  )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
