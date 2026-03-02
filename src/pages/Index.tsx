import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnergyBadge } from "@/components/EnergyBadge";
import { KANBAN_LABELS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Clock, Zap } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;

export default function Index() {
  const { user } = useAuth();
  const [doingTasks, setDoingTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [quickTitle, setQuickTitle] = useState("");
  const [stats, setStats] = useState({ planned: 0, done: 0 });
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    if (!user) return;
    const [tasksRes, habitsRes, logsRes, containersRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("kanban_status", "doing"),
      supabase.from("habits").select("*").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("containers").select("*").eq("user_id", user.id).eq("date", today),
    ]);
    setDoingTasks(tasksRes.data ?? []);
    setHabits(habitsRes.data ?? []);
    setHabitLogs(logsRes.data ?? []);
    const containers = containersRes.data ?? [];
    setStats({
      planned: containers.length,
      done: containers.filter((c) => c.status === "done").length,
    });
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !user) return;
    await supabase.from("tasks").insert({ title: quickTitle.trim(), user_id: user.id });
    setQuickTitle("");
    toast({ title: "Добавлено во Входящие" });
  };

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const existing = habitLogs.find((l) => l.habit_id === habit.id);
    if (existing) {
      await supabase.from("habit_logs").update({ completed: !existing.completed }).eq("id", existing.id);
    } else {
      await supabase.from("habit_logs").insert({ habit_id: habit.id, user_id: user.id, date: today, completed: true });
    }
    fetchData();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <p className="text-muted-foreground">Потоковое планирование на сегодня</p>
      </div>

      {/* Quick capture */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Быстрый захват
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input placeholder="Новая задача..." value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} />
            <Button type="submit" size="sm" disabled={!quickTitle.trim()}>Добавить</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* In progress */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" /> В работе
            </CardTitle>
          </CardHeader>
          <CardContent>
            {doingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет активных задач</p>
            ) : (
              <div className="space-y-2">
                {doingTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <span className="text-sm font-medium">{t.title}</span>
                    <div className="flex items-center gap-2">
                      {t.duration_estimate && <span className="text-xs text-muted-foreground">{t.duration_estimate}м</span>}
                      <EnergyBadge type={t.energy_type} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Статистика дня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.planned}</div>
                <div className="text-xs text-muted-foreground">Контейнеров</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.done}</div>
                <div className="text-xs text-muted-foreground">Завершено</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Привычки на сегодня
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет привычек. Создайте в разделе «Привычки».</p>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => {
                  const log = habitLogs.find((l) => l.habit_id === h.id);
                  const done = log?.completed ?? false;
                  return (
                    <button
                      key={h.id}
                      onClick={() => toggleHabit(h)}
                      className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${done ? "bg-energy-recovery/10" : "bg-muted/50 hover:bg-muted"}`}
                    >
                      <CheckCircle2 className={`h-5 w-5 shrink-0 ${done ? "text-energy-recovery" : "text-muted-foreground"}`} />
                      <div>
                        <div className={`text-sm font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{h.action_text}</div>
                        <div className="text-xs text-muted-foreground">{h.trigger_text} → {h.reward_text}</div>
                      </div>
                      {h.streak_count > 0 && <span className="ml-auto text-xs text-muted-foreground">🔥 {h.streak_count}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
