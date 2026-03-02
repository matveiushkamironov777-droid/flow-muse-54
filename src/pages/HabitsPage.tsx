import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Repeat, Plus, Flame, ArrowRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Habit = Tables<"habits">;
type HabitLog = Tables<"habit_logs">;

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

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Repeat className="h-6 w-6" /> Привычки</h1>
          <p className="text-muted-foreground">Триггер → Действие → Награда</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Новая</Button>
      </div>

      {habits.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Создайте первую привычку!</CardContent></Card>
      ) : (
        habits.map((h) => {
          const log = logs.find((l) => l.habit_id === h.id);
          const done = log?.completed ?? false;
          return (
            <Card key={h.id} className={done ? "border-energy-recovery/30" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Checkbox checked={done} onCheckedChange={() => toggleHabit(h)} className="mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>{h.action_text}</div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>🎯 {h.trigger_text}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span>🎁 {h.reward_text}</span>
                    </div>
                    {h.is_replacement && h.old_action && (
                      <div className="text-xs text-destructive/70">Замена: {h.old_action}</div>
                    )}
                  </div>
                  {h.streak_count > 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      <Flame className="h-4 w-4 text-energy-physical" />
                      <span>{h.streak_count}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

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
