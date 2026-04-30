import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Repeat, Plus, Flame, ArrowRight, Clock, Gift } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;

const HEATMAP_COLORS = ["physical", "mental", "emotional", "spiritual", "recovery"];

export default function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    trigger_text: "", action_text: "", reward_text: "",
    is_replacement: false, old_trigger: "", old_action: "",
  });
  const today = new Date().toISOString().split("T")[0];

  const fetchData = async () => {
    if (!user) return;
    const [h, l] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).eq("active", true).order("created_at"),
      supabase.from("habit_logs").select("*").eq("user_id", user.id).eq("date", today),
    ]);
    setHabits(h.data ?? []);
    setLogs(l.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;
    const existing = logs.find((l) => l.habit_id === habit.id);
    if (existing) {
      await supabase.from("habit_logs").update({ completed: !existing.completed }).eq("id", existing.id);
    } else {
      await supabase.from("habit_logs").insert({ habit_id: habit.id, user_id: user.id, date: today, completed: true });
    }
    fetchData();
  };

  const createHabit = async () => {
    if (!user || !form.action_text.trim()) return;
    await supabase.from("habits").insert({
      user_id: user.id,
      trigger_text: form.trigger_text,
      action_text: form.action_text,
      reward_text: form.reward_text,
      is_replacement: form.is_replacement,
      old_trigger: form.is_replacement ? form.old_trigger : null,
      old_action: form.is_replacement ? form.old_action : null,
    });
    setForm({ trigger_text: "", action_text: "", reward_text: "", is_replacement: false, old_trigger: "", old_action: "" });
    setShowCreate(false);
    toast({ title: "Привычка создана" });
    fetchData();
  };

  const doneToday = logs.filter((l) => l.completed).length;
  const maxStreak = habits.reduce((m, h) => Math.max(m, h.streak_count ?? 0), 0);
  const bestHabit = habits.find((h) => h.streak_count === maxStreak);

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", display: "flex", alignItems: "center", gap: 10, margin: "0 0 4px" }}>
            <Repeat style={{ width: 20, height: 20 }} /> Привычки
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: 0 }}>
            Триггер → Действие → Награда · {doneToday}/{habits.length} сегодня
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-1" /> Новая
        </Button>
      </div>

      {/* Streak heatmap card */}
      {habits.length > 0 && (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
            padding: "14px",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "center", marginBottom: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "var(--energy-physical-soft)",
                color: "var(--energy-physical)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Flame style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-subtle)", marginBottom: 4 }}>
                Серия привычек
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>
                {maxStreak > 0 ? `${maxStreak} дней без срыва` : "Начните сегодня!"}
              </div>
              {bestHabit && maxStreak > 0 && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                  {bestHabit.action_text} — самая стабильная привычка
                </div>
              )}
            </div>
          </div>
          {/* 28-day heatmap */}
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const filled = habits.some((h) => (h.streak_count ?? 0) > 28 - i - 1);
              const colorKey = HEATMAP_COLORS[i % HEATMAP_COLORS.length];
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 18,
                    borderRadius: 3,
                    background: filled ? `var(--energy-${colorKey})` : "var(--surface-3)",
                    opacity: filled ? 0.7 : 1,
                  }}
                  title={`день ${28 - i}`}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: "var(--text-subtle)" }}>
            <span>4 нед. назад</span>
            <span>сегодня</span>
          </div>
        </div>
      )}

      {/* Habits list */}
      {habits.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            padding: "32px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          Создайте первую привычку!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {habits.map((h) => {
            const log = logs.find((l) => l.habit_id === h.id);
            const done = log?.completed ?? false;
            return (
              <div
                key={h.id}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${done ? "var(--success)" : "var(--border)"}`,
                  borderRadius: "var(--r-lg)",
                  boxShadow: "var(--shadow-sm)",
                  padding: "12px 14px",
                  opacity: done ? 0.95 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => toggleHabit(h)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `1.5px solid ${done ? "var(--success)" : "var(--border-strong)"}`,
                      background: done ? "var(--success)" : "transparent",
                      display: "grid",
                      placeItems: "center",
                      color: "white",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  >
                    {done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        textDecoration: done ? "line-through" : "none",
                        color: done ? "var(--text-muted)" : "var(--text)",
                      }}
                    >
                      {h.action_text}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12, color: "var(--text-subtle)", flexWrap: "wrap" }}>
                      <Clock style={{ width: 11, height: 11 }} />
                      <span>{h.trigger_text}</span>
                      <ArrowRight style={{ width: 11, height: 11 }} />
                      <Gift style={{ width: 11, height: 11 }} />
                      <span>{h.reward_text}</span>
                    </div>
                    {h.is_replacement && h.old_action && (
                      <div style={{ fontSize: 11.5, marginTop: 4, color: "var(--danger)", opacity: 0.8 }}>
                        <span style={{ textDecoration: "line-through" }}>{h.old_action}</span> → заменено
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      color: (h.streak_count ?? 0) >= 30 ? "var(--energy-physical)" : "var(--text-muted)",
                    }}
                  >
                    <Flame style={{ width: 14, height: 14 }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600 }}>
                      {h.streak_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новая привычка</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Триггер (когда?)</Label><Input value={form.trigger_text} onChange={(e) => setForm({ ...form, trigger_text: e.target.value })} placeholder="После завтрака..." /></div>
            <div><Label>Действие</Label><Input value={form.action_text} onChange={(e) => setForm({ ...form, action_text: e.target.value })} placeholder="Медитация 10 минут" /></div>
            <div><Label>Награда</Label><Input value={form.reward_text} onChange={(e) => setForm({ ...form, reward_text: e.target.value })} placeholder="Чашка чая" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_replacement} onCheckedChange={(v) => setForm({ ...form, is_replacement: v })} />
              <Label>Замена старой привычки</Label>
            </div>
            {form.is_replacement && (
              <>
                <div><Label>Старый триггер</Label><Input value={form.old_trigger} onChange={(e) => setForm({ ...form, old_trigger: e.target.value })} /></div>
                <div><Label>Старое действие</Label><Input value={form.old_action} onChange={(e) => setForm({ ...form, old_action: e.target.value })} /></div>
              </>
            )}
          </div>
          <DialogFooter><Button onClick={createHabit} disabled={!form.action_text.trim()}>Создать</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
