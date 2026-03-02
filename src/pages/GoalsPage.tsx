import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Target, Plus, ChevronDown, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Goal = Tables<"goals">;
type Milestone = Tables<"milestones">;
type Task = Tables<"tasks">;

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", outcome_criteria: "", target_date: "" });
  const [showDecompose, setShowDecompose] = useState<string | null>(null);
  const [milestoneTitles, setMilestoneTitles] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [g, m, t] = await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("milestones").select("*").eq("user_id", user.id).order("sort_order"),
      supabase.from("tasks").select("*").eq("user_id", user.id).not("milestone_id", "is", null),
    ]);
    setGoals(g.data ?? []);
    setMilestones(m.data ?? []);
    setTasks(t.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const createGoal = async () => {
    if (!user || !newGoal.title.trim()) return;
    await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoal.title.trim(),
      description: newGoal.description || null,
      outcome_criteria: newGoal.outcome_criteria || null,
      target_date: newGoal.target_date || null,
    });
    setNewGoal({ title: "", description: "", outcome_criteria: "", target_date: "" });
    setShowCreate(false);
    toast({ title: "Цель создана" });
    fetchData();
  };

  const decompose = async () => {
    if (!user || !showDecompose || !milestoneTitles.trim()) return;
    const titles = milestoneTitles.split("\n").filter((t) => t.trim());
    for (let i = 0; i < titles.length; i++) {
      await supabase.from("milestones").insert({
        user_id: user.id,
        goal_id: showDecompose,
        title: titles[i].trim(),
        sort_order: i,
      });
    }
    setMilestoneTitles("");
    setShowDecompose(null);
    toast({ title: "Вехи добавлены" });
    fetchData();
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const goalMilestones = (goalId: string) => milestones.filter((m) => m.goal_id === goalId);
  const milestoneTasks = (msId: string) => tasks.filter((t) => t.milestone_id === msId);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-6 w-6" /> Цели</h1>
          <p className="text-muted-foreground">Декомпозиция целей на вехи и задачи</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Новая цель</Button>
      </div>

      {goals.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Создайте первую цель!</CardContent></Card>
      ) : (
        goals.map((goal) => {
          const ms = goalMilestones(goal.id);
          const isOpen = expanded.has(goal.id);
          const completedMs = ms.filter((m) => m.status === "done").length;
          return (
            <Card key={goal.id}>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(goal.id)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {goal.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {ms.length > 0 && (
                      <span className="text-xs text-muted-foreground">{completedMs}/{ms.length} вех</span>
                    )}
                    {goal.target_date && <span className="text-xs text-muted-foreground">📅 {goal.target_date}</span>}
                  </div>
                </div>
              </CardHeader>
              {isOpen && (
                <CardContent className="space-y-3">
                  {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                  {goal.outcome_criteria && (
                    <div className="text-xs bg-muted/50 p-2 rounded-md">
                      <span className="font-medium">Критерий:</span> {goal.outcome_criteria}
                    </div>
                  )}
                  {ms.length > 0 && (
                    <div className="space-y-2 pl-4 border-l-2 border-muted">
                      {ms.map((m) => {
                        const mTasks = milestoneTasks(m.id);
                        return (
                          <div key={m.id}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${m.status === "done" ? "line-through text-muted-foreground" : "font-medium"}`}>{m.title}</span>
                              {mTasks.length > 0 && <span className="text-xs text-muted-foreground">({mTasks.length} задач)</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setShowDecompose(goal.id); setMilestoneTitles(""); }}>
                    <Plus className="h-3 w-3 mr-1" /> Добавить вехи
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {/* Create goal dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Новая цель</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Название</Label><Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} /></div>
            <div><Label>Описание</Label><Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} /></div>
            <div><Label>Критерий результата</Label><Input value={newGoal.outcome_criteria} onChange={(e) => setNewGoal({ ...newGoal, outcome_criteria: e.target.value })} /></div>
            <div><Label>Целевая дата</Label><Input type="date" value={newGoal.target_date} onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button onClick={createGoal} disabled={!newGoal.title.trim()}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decompose dialog */}
      <Dialog open={!!showDecompose} onOpenChange={() => setShowDecompose(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Декомпозиция: добавить вехи</DialogTitle></DialogHeader>
          <div>
            <Label>Вехи (по одной на строку)</Label>
            <Textarea rows={6} value={milestoneTitles} onChange={(e) => setMilestoneTitles(e.target.value)} placeholder={"Веха 1\nВеха 2\nВеха 3"} />
          </div>
          <DialogFooter>
            <Button onClick={decompose} disabled={!milestoneTitles.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
