import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface ChipInputProps {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}

export function ChipInput({ value, onChange, placeholder }: ChipInputProps) {
  const [input, setInput] = useState("");

  const addChip = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip();
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeChip = (chip: string) => {
    onChange(value.filter(v => v !== chip));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map(chip => (
          <Badge key={chip} variant="secondary" className="gap-1 text-xs">
            {chip}
            <button type="button" onClick={() => removeChip(chip)} className="hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addChip}
        placeholder={placeholder || "Digite e pressione Enter"}
        className="text-sm"
      />
    </div>
  );
}
