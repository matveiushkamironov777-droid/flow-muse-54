import { Badge } from "@/components/ui/badge";
import { ENERGY_LABELS } from "@/lib/constants";

const colorMap: Record<string, string> = {
  physical: "bg-energy-physical/15 text-energy-physical border-energy-physical/30",
  mental: "bg-energy-mental/15 text-energy-mental border-energy-mental/30",
  emotional: "bg-energy-emotional/15 text-energy-emotional border-energy-emotional/30",
  spiritual: "bg-energy-spiritual/15 text-energy-spiritual border-energy-spiritual/30",
  recovery: "bg-energy-recovery/15 text-energy-recovery border-energy-recovery/30",
};

export function EnergyBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <Badge variant="outline" className={`text-xs ${colorMap[type] ?? ""}`}>
      {ENERGY_LABELS[type] ?? type}
    </Badge>
  );
}
