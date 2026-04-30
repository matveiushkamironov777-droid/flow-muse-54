import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Settings, Plus, Trash2, Save, LogOut } from "lucide-react";
import { DEFAULT_CLUSTERS, ENERGY_LABELS } from "@/lib/constants";
import { EnergyBadge } from "@/components/EnergyBadge";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Cluster = Tables<"clusters">;

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        padding: "14px 14px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span>
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [wipLimit, setWipLimit] = useState(3);
  const [workDuration, setWorkDuration] = useState(45);
  const [restDuration, setRestDuration] = useState(15);

  const fetchData = async () => {
    if (!user) return;
    const [p, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("clusters").select("*").eq("user_id", user.id).order("sort_order"),
    ]);
    if (p.data) {
      setProfile(p.data);
      setWipLimit(p.data.wip_limit);
      setWorkDuration(p.data.work_duration);
      setRestDuration(p.data.rest_duration);
    }
    setClusters(c.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ wip_limit: wipLimit, work_duration: workDuration, rest_duration: restDuration }).eq("user_id", user.id);
    toast({ title: "Настройки сохранены" });
  };

  const seedClusters = async () => {
    if (!user) return;
    for (const c of DEFAULT_CLUSTERS) {
      await supabase.from("clusters").insert({ ...c, user_id: user.id, scope: "daily" });
    }
    toast({ title: "Кластеры по умолчанию созданы" });
    fetchData();
  };

  const deleteCluster = async (id: string) => {
    await supabase.from("clusters").delete().eq("id", id);
    fetchData();
  };

  const settingField = (label: string, value: number, min: number, max: number, onChange: (v: number) => void, hint?: string) => (
    <div
      style={{
        padding: "10px 12px",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-md)",
        background: "var(--surface-2)",
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "var(--text-subtle)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        style={{ height: 34, fontFamily: "var(--font-mono)", fontWeight: 600 }}
      />
      {hint && <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 4 }}>{hint}</div>}
    </div>
  );

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", display: "flex", alignItems: "center", gap: 10, margin: "0 0 4px" }}>
          <Settings style={{ width: 20, height: 20 }} /> Настройки
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: 0 }}>Профиль, кластеры энергии, аккаунт</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Profile */}
        <SectionCard>
          <SectionHeader title="Профиль" />
          <div style={{ padding: "6px 14px 14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
              {settingField("WIP лимит", wipLimit, 1, 10, setWipLimit, "макс. задач в работе")}
              {settingField("Работа (мин)", workDuration, 15, 90, setWorkDuration, "длит. контейнера")}
              {settingField("Отдых (мин)", restDuration, 5, 30, setRestDuration, "перерыв")}
            </div>
            <Button size="sm" onClick={saveProfile}>
              <Save className="h-3 w-3 mr-1" /> Сохранить
            </Button>
          </div>
        </SectionCard>

        {/* Energy clusters */}
        <SectionCard>
          <SectionHeader
            title="Кластеры энергии"
            action={
              clusters.length === 0 ? (
                <Button size="sm" variant="outline" onClick={seedClusters}>
                  <Plus className="h-3 w-3 mr-1" /> Загрузить по умолчанию
                </Button>
              ) : (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-subtle)",
                    background: "var(--surface-3)",
                    padding: "1px 6px",
                    borderRadius: 999,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {clusters.length}
                </span>
              )
            }
          />
          <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {clusters.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                Нет кластеров. Загрузите по умолчанию или создайте свои.
              </p>
            ) : (
              clusters.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderLeft: `3px solid var(--energy-${c.energy_type})`,
                    borderRadius: "var(--r-md)",
                    background: "var(--surface-2)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.label}</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-subtle)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      {c.start_time.slice(0, 5)} – {c.end_time.slice(0, 5)}
                    </div>
                  </div>
                  <EnergyBadge type={c.energy_type} />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteCluster(c.id)}
                    style={{ color: "var(--danger)", width: 30, height: 30 }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        {/* Account */}
        <SectionCard>
          <SectionHeader title="Аккаунт" />
          <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Email", value: user?.email ?? "—" },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-md)",
                  background: "var(--surface-2)",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    color: "var(--text-subtle)",
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
            <div style={{ marginTop: 4 }}>
              <Button variant="outline" onClick={signOut} style={{ gap: 6 }}>
                <LogOut className="h-3.5 w-3.5" /> Выйти
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
