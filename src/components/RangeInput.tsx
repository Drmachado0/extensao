import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface RangeInputProps {
  label: string;
  minVal: number | undefined;
  maxVal: number | undefined;
  onMinChange: (v: number | undefined) => void;
  onMaxChange: (v: number | undefined) => void;
  sliderMin?: number;
  sliderMax?: number;
  step?: number;
  formatLabel?: (v: number) => string;
}

export function RangeInput({ label, minVal, maxVal, onMinChange, onMaxChange, sliderMin = 0, sliderMax = 100000, step = 100 }: RangeInputProps) {
  const handleSlider = (values: number[]) => {
    onMinChange(values[0]);
    onMaxChange(values[1]);
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <Slider
        min={sliderMin}
        max={sliderMax}
        step={step}
        value={[minVal ?? sliderMin, maxVal ?? sliderMax]}
        onValueChange={handleSlider}
        className="my-2"
      />
      <div className="flex items-center gap-2">
        <Input
          type="number"
          placeholder="Min"
          value={minVal ?? ""}
          onChange={e => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm h-8"
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxVal ?? ""}
          onChange={e => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
          className="text-sm h-8"
        />
      </div>
    </div>
  );
}
