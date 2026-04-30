import { ENERGY_LABELS } from "@/lib/constants";

type EnergyType = "physical" | "mental" | "emotional" | "spiritual" | "recovery";

export function EnergyBadge({ type }: { type: string | null }) {
  if (!type) return null;
  return (
    <span className={`e-badge e-${type}`}>
      <span className="dot" />
      {ENERGY_LABELS[type] ?? type}
    </span>
  );
}
