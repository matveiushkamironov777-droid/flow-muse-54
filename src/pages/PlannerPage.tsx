import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ENERGY_LABELS } from "@/lib/constants";
import { CalendarClock, Plus } from "lucide-react";
import { EnergyBadge } from "@/components/EnergyBadge";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Cluster = Tables<"clusters">;
type Container = Tables<"containers">;
type Task = Tables<"tasks">;

export default function PlannerPage() {
  const { user } = useAuth();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [readyTasks, setReadyTasks] = useState<Task[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    if (!user) return;
    const [cl, co, tk] = await Promise.all([
      supabase.from("clusters").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("containers").select("*").eq("user_id", user.id).eq("date", today).order("start_time"),
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("kanban_status", "ready").order("sort_order"),
    ]);
    setClusters(cl.data ?? []);
    setContainers(co.data ?? []);
    setReadyTasks(tk.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addContainer = async (cluster: Cluster) => {
    if (!user) return;
    await supabase.from("containers").insert({
      user_id: user.id,
      date: today,
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarClock className="h-6 w-6" /> Планер дня</h1>
        <p className="text-muted-foreground">Контейнеры 45/15 по кластерам энергии</p>
      </div>

      {/* Energy map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Карта энергии</CardTitle>
        </CardHeader>
        <CardContent>
          {clusters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет кластеров. Настройте в «Настройках».</p>
          ) : (
            <div className="flex gap-1 h-8 rounded-md overflow-hidden">
              {clusters.map((c) => {
                const colorMap: Record<string, string> = {
                  physical: "bg-energy-physical",
                  mental: "bg-energy-mental",
                  emotional: "bg-energy-emotional",
                  spiritual: "bg-energy-spiritual",
                  recovery: "bg-energy-recovery",
                };
                return (
                  <div key={c.id} className={`flex-1 ${colorMap[c.energy_type]} flex items-center justify-center`} title={`${c.label}: ${c.start_time}-${c.end_time}`}>
                    <span className="text-xs text-white font-medium truncate px-1">{c.start_time.slice(0, 5)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-3">
        {clusters.map((cluster) => {
          const clusterContainers = containers.filter((c) => c.cluster_id === cluster.id);
          return (
            <Card key={cluster.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <EnergyBadge type={cluster.energy_type} />
                    {cluster.label}
                    <span className="text-xs text-muted-foreground">{cluster.start_time.slice(0,5)}–{cluster.end_time.slice(0,5)}</span>
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => addContainer(cluster)}>
                    <Plus className="h-3 w-3 mr-1" /> Контейнер
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {clusterContainers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Нет контейнеров</p>
                ) : (
                  <div className="space-y-2">
                    {clusterContainers.map((co) => (
                      <div key={co.id} className={`flex items-center justify-between p-2 rounded-md border ${co.status === "done" ? "bg-energy-recovery/10 border-energy-recovery/30" : "bg-muted/30"}`}>
                        <div className="text-sm">
                          <span className="font-medium">{co.start_time.slice(0, 5)}</span>
                          <span className="text-xs text-muted-foreground ml-2">45м работа + 15м отдых</span>
                        </div>
                        {co.status !== "done" && (
                          <Button size="sm" variant="ghost" onClick={() => markDone(co.id)}>✓ Готово</Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ready tasks */}
      {readyTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Задачи для планирования</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {readyTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <span className="text-sm">{t.title}</span>
                  <div className="flex items-center gap-2">
                    {t.duration_estimate && <span className="text-xs text-muted-foreground">{t.duration_estimate}м</span>}
                    <EnergyBadge type={t.energy_type} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
