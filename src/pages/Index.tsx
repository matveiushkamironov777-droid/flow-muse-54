import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnergyBadge } from "@/components/EnergyBadge";
import { ENERGY_LABELS, KANBAN_LABELS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Plus, CheckCircle2, Clock, Zap } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;
type Cluster = Tables<"clusters">;

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export default function Index() {
  const { user } = useAuth();
  const [doingTasks, setDoingTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [quickTitle, setQuickTitle] = useState("");
  const [stats, setStats] = useState({ planned: 0, done: 0, wip: 0, wipLimit: 3 });
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const fetchData = async () => {
    if (!user) return;
    const [tasksRes, habitsRes, logsRes, containersRes, clustersRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).eq("kanban_status", "doing"),
      supabase.from("habits").select("*").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("containers").select("*").eq("user_id", user.id).eq("date", today),
      supabase.from("clusters").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("profiles").select("wip_limit").eq("user_id", user.id).single(),
    ]);
    setDoingTasks(tasksRes.data ?? []);
    setHabits(habitsRes.data ?? []);
    setHabitLogs(logsRes.data ?? []);
    setClusters(clustersRes.data ?? []);
    const containers = containersRes.data ?? [];
    const wipLimit = profileRes.data?.wip_limit ?? 3;
    setStats({
      planned: containers.length,
      done: containers.filter((c) => c.status === "done").length,
      wip: (tasksRes.data ?? []).length,
      wipLimit,
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

  const markTaskDone = async (taskId: string) => {
    await supabase.from("tasks").update({ kanban_status: "done" } as any).eq("id", taskId);
    toast({ title: "Задача завершена" });
    fetchData();
  };

  // Timeline strip: total duration for proportional flex widths
  const totalMinutes = clusters.reduce((sum, c) => {
    return sum + timeToMinutes(c.end_time) - timeToMinutes(c.start_time);
  }, 0) || 1;

  const habitsDone = habitLogs.filter((l) => l.completed).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.015em" }}>Дашборд</h1>
        <p className="text-muted-foreground text-[13.5px]">
          {new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })} · Потоковое планирование
        </p>
      </div>

      {/* Energy timeline strip */}
      {clusters.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" /> Сегодня
              <span className="ml-auto font-mono text-xs text-muted-foreground">{nowStr}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div
              style={{
                display: "flex",
                height: 36,
                borderRadius: "var(--r-sm)",
                overflow: "hidden",
                border: "1px solid var(--border)",
              }}
            >
              {clusters.map((c) => {
                const dur = timeToMinutes(c.end_time) - timeToMinutes(c.start_time);
                return (
                  <div
                    key={c.id}
                    style={{
                      flex: dur / totalMinutes,
                      background: `var(--energy-${c.energy_type})`,
                      opacity: 0.85,
                      position: "relative",
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      paddingLeft: 6,
                    }}
                    title={`${c.label}: ${c.start_time}–${c.end_time}`}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: "white",
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.start_time.slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 10 }}>
              {Object.entries(ENERGY_LABELS).map(([k, v]) => (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-subtle)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: `var(--energy-${k})`, display: "inline-block" }} />
                  {v}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats + In progress */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* In progress */}
        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4" /> В работе
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  WIP {stats.wip}/{stats.wipLimit}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {doingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Нет активных задач</p>
              ) : (
                <div className="space-y-2">
                  {doingTasks.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--r-md)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: 13.5 }}>{t.title}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
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
                      <Button size="sm" variant="outline" onClick={() => markTaskDone(t.id)}>
                        ✓ Готово
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Day stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Статистика дня
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: stats.planned, label: "Контейнеров" },
                { value: stats.done, label: "Завершено", accent: "var(--success)" },
                { value: `${stats.wip}/${stats.wipLimit}`, label: "WIP / лимит" },
                { value: habitsDone, label: "Привычек", accent: habitsDone > 0 ? "var(--energy-recovery)" : undefined },
              ].map(({ value, label, accent }) => (
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
                      fontSize: 22,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "-0.03em",
                      color: accent ?? "var(--text)",
                    }}
                  >
                    {value}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-subtle)" }}>{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Привычки на сегодня
            <span className="ml-auto text-xs text-muted-foreground font-normal">
              {habitsDone}/{habits.length}
            </span>
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
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: "var(--r-md)",
                      textAlign: "left",
                      background: done ? "var(--energy-recovery-soft)" : "var(--surface-2)",
                      border: `1px solid ${done ? "var(--energy-recovery)" : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all 100ms ease",
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: `1.5px solid ${done ? "var(--success)" : "var(--border-strong)"}`,
                        background: done ? "var(--success)" : "transparent",
                        display: "grid",
                        placeItems: "center",
                        color: "white",
                        flexShrink: 0,
                      }}
                    >
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 500,
                          textDecoration: done ? "line-through" : "none",
                          color: done ? "var(--text-muted)" : "var(--text)",
                        }}
                      >
                        {h.action_text}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-subtle)", marginTop: 2 }}>
                        {h.trigger_text} → {h.reward_text}
                      </div>
                    </div>
                    {h.streak_count > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--energy-physical)", marginLeft: "auto" }}>
                        🔥 {h.streak_count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick capture */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Быстрый захват
            <span className="ml-auto text-xs text-muted-foreground font-normal">в Входящие</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="flex gap-2">
            <Input
              placeholder="Записать новую задачу… (Enter)"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
            />
            <Button type="submit" disabled={!quickTitle.trim()}>Добавить</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
