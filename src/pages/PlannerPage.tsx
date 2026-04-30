import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarClock, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { EnergyBadge } from "@/components/EnergyBadge";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Cluster = Tables<"clusters">;
type Container = Tables<"containers">;
type Task = Tables<"tasks">;

function dateOffset(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
}

export default function PlannerPage() {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [readyTasks, setReadyTasks] = useState<Task[]>([]);
  const todayBase = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayBase);

  const fetchData = async () => {
    if (!user) return;
    const [cl, co, tk] = await Promise.all([
      supabase.from("clusters").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("containers").select("*").eq("user_id", user.id).eq("date", selectedDate).order("start_time"),
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("kanban_status", "ready").order("sort_order"),
    ]);
    setClusters(cl.data ?? []);
    setContainers(co.data ?? []);
    setReadyTasks(tk.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user, selectedDate]);

  const addContainer = async (cluster: Cluster) => {
    if (!user) return;
    await supabase.from("containers").insert({
      user_id: user.id,
      date: selectedDate,
      start_time: cluster.start_time,
      cluster_id: cluster.id,
    });
    toast({ title: "Контейнер добавлен" });
    fetchData();
  };

  const markDone = async (id: string) => {
    await supabase.from("containers").update({ status: "done" }).eq("id", id);
    fetchData();
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              display: "flex",
              alignItems: "center",
              gap: 10,
              margin: "0 0 4px",
            }}
          >
            <CalendarClock style={{ width: 20, height: 20 }} /> Планер дня
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: 0 }}>
            Контейнеры 45/15 по кластерам энергии · {formatDate(selectedDate)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedDate((d) => dateOffset(d, -1))}
          >
            <ChevronLeft className="h-3 w-3 mr-1" /> Вчера
          </Button>
          <Button
            size="sm"
            variant={selectedDate === todayBase ? "default" : "outline"}
            onClick={() => setSelectedDate(todayBase)}
          >
            Сегодня
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedDate((d) => dateOffset(d, 1))}
          >
            Завтра <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
          <Button size="sm" onClick={() => clusters[0] && addContainer(clusters[0])}>
            <Plus className="h-3 w-3 mr-1" /> Контейнер
          </Button>
        </div>
      </div>

      {/* Energy map strip */}
      {clusters.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
            padding: "14px 14px 12px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            Карта энергии
            <span style={{ fontSize: 12, color: "var(--text-subtle)", fontWeight: 400 }}>Среднесуточная нагрузка по типам</span>
          </div>
          <div style={{ display: "flex", height: 28, borderRadius: "var(--r-sm)", overflow: "hidden", border: "1px solid var(--border)" }}>
            {clusters.map((c) => {
              const [sh, sm] = c.start_time.split(":").map(Number);
              const [eh, em] = c.end_time.split(":").map(Number);
              const dur = (eh * 60 + em) - (sh * 60 + sm);
              return (
                <div
                  key={c.id}
                  style={{
                    flex: dur,
                    background: `var(--energy-${c.energy_type})`,
                    opacity: 0.85,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    color: "white",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "-0.02em",
                    minWidth: 0,
                  }}
                  title={`${c.label}: ${c.start_time}–${c.end_time}`}
                >
                  {c.start_time.slice(0, 5)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 14, alignItems: "flex-start" }}>
        {/* Clusters timeline (left) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {clusters.map((cluster) => {
            const clusterContainers = containers.filter((c) => c.cluster_id === cluster.id);
            return (
              <div
                key={cluster.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderLeft: `3px solid var(--energy-${cluster.energy_type})`,
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-sm)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "12px 14px 6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600 }}>
                    <EnergyBadge type={cluster.energy_type} />
                    <span>{cluster.label}</span>
                    <span style={{ fontSize: 12, color: "var(--text-subtle)", fontWeight: 400, fontFamily: "var(--font-mono)" }}>
                      {cluster.start_time.slice(0, 5)}–{cluster.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => addContainer(cluster)}>
                    <Plus className="h-3 w-3 mr-1" /> Контейнер
                  </Button>
                </div>
                <div style={{ padding: "6px 14px 14px" }}>
                  {clusterContainers.length === 0 ? (
                    <p style={{ fontSize: 12.5, color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>Нет контейнеров</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {clusterContainers.map((co) => (
                        <div
                          key={co.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 12px",
                            borderRadius: "var(--r-md)",
                            background: co.status === "done" ? "var(--energy-recovery-soft)" : "var(--surface-2)",
                            border: `1px solid ${co.status === "done" ? "var(--energy-recovery)" : "var(--border)"}`,
                          }}
                        >
                          <div style={{ width: 52, textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                              {co.start_time.slice(0, 5)}
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--text-subtle)" }}>45 + 15</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                              Свободный контейнер
                            </span>
                          </div>
                          {co.status === "done" ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 500,
                                background: "var(--energy-recovery-soft)",
                                color: "var(--success)",
                              }}
                            >
                              ✓ готово
                            </span>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => markDone(co.id)}>
                              ✓ Готово
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ready tasks rail (right, sticky) */}
        <div style={{ position: "sticky", top: 14 }}>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                padding: "12px 14px 6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>Готовые задачи</span>
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
                {readyTasks.length}
              </span>
            </div>
            <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
              {readyTasks.length === 0 ? (
                <p style={{ fontSize: 12.5, color: "var(--text-subtle)", fontStyle: "italic", margin: 0 }}>
                  Нет задач для планирования
                </p>
              ) : (
                readyTasks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      padding: "8px 10px",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--r-md)",
                      background: "var(--surface-2)",
                      cursor: "grab",
                    }}
                  >
                    <div style={{ fontSize: 12.5, fontWeight: 500, marginBottom: 4 }}>{t.title}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <EnergyBadge type={t.energy_type} />
                      {t.duration_estimate && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "2px 7px",
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 500,
                            background: "var(--surface-3)",
                            color: "var(--text-muted)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {t.duration_estimate}м
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
