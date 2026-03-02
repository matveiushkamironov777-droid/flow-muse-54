import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ENERGY_LABELS } from "@/lib/constants";
import { ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const ENERGY_CHART_COLORS: Record<string, string> = {
  physical: "#f97316",
  mental: "#3b82f6",
  emotional: "#ec4899",
  spiritual: "#8b5cf6",
  recovery: "#22c55e",
};

export default function WeeklyReviewPage() {
  const { user } = useAuth();
  const [energyData, setEnergyData] = useState<{ name: string; count: number; color: string }[]>([]);
  const [containerStats, setContainerStats] = useState({ planned: 0, done: 0 });

  useEffect(() => {
    if (!user) return;
    // Get tasks completed this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    Promise.all([
      supabase.from("tasks").select("energy_type").eq("user_id", user.id).eq("kanban_status", "done"),
      supabase.from("containers").select("status").eq("user_id", user.id).gte("date", weekAgo.toISOString().split("T")[0]),
    ]).then(([tasksRes, containersRes]) => {
      const tasks = tasksRes.data ?? [];
      const counts: Record<string, number> = {};
      tasks.forEach((t) => {
        const et = t.energy_type ?? "mental";
        counts[et] = (counts[et] || 0) + 1;
      });
      setEnergyData(Object.entries(counts).map(([k, v]) => ({
        name: ENERGY_LABELS[k] ?? k,
        count: v,
        color: ENERGY_CHART_COLORS[k] ?? "#888",
      })));

      const containers = containersRes.data ?? [];
      setContainerStats({
        planned: containers.length,
        done: containers.filter((c) => c.status === "done").length,
      });
    });
  }, [user]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Недельный обзор</h1>
        <p className="text-muted-foreground">Аналитика за неделю</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Контейнеры: план vs факт</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div><div className="text-3xl font-bold">{containerStats.planned}</div><div className="text-xs text-muted-foreground">Запланировано</div></div>
              <div><div className="text-3xl font-bold text-energy-recovery">{containerStats.done}</div><div className="text-xs text-muted-foreground">Завершено</div></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Задачи по энергии</CardTitle></CardHeader>
          <CardContent>
            {energyData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">Нет данных</p>
            ) : (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={energyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {energyData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
