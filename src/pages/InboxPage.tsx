import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnergyBadge } from "@/components/EnergyBadge";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, X, Inbox } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

export default function InboxPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase.from("tasks").select("*").eq("user_id", user.id).eq("kanban_status", "inbox").order("created_at", { ascending: false });
    setTasks(data ?? []);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const updateMission = async (id: string, field: string, value: boolean) => {
    await supabase.from("tasks").update({ [field]: value } as any).eq("id", id);
    fetchTasks();
  };

  const moveToReady = async (id: string) => {
    await supabase.from("tasks").update({ kanban_status: "ready" as any }).eq("id", id);
    toast({ title: "Перемещено в «Готово к работе»" });
    fetchTasks();
  };

  const reject = async (id: string) => {
    await supabase.from("tasks").update({ kanban_status: "archived" as any }).eq("id", id);
    toast({ title: "Отклонено" });
    fetchTasks();
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Inbox className="h-6 w-6" /> Входящие</h1>
        <p className="text-muted-foreground">Сортировка задач через фильтр миссии</p>
      </div>

      {tasks.length === 0 ? (
        <Card><CardContent className="pt-6 text-center text-muted-foreground">Все задачи рассортированы!</CardContent></Card>
      ) : (
        tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
                <EnergyBadge type={task.energy_type} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
              <div className="space-y-2 bg-muted/50 p-3 rounded-md">
                <p className="text-xs font-medium text-muted-foreground uppercase">Фильтр миссии</p>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={task.mission_aligned ?? false} onCheckedChange={(v) => updateMission(task.id, "mission_aligned", !!v)} />
                  Соответствует миссии/ценностям?
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={task.necessary_now ?? false} onCheckedChange={(v) => updateMission(task.id, "necessary_now", !!v)} />
                  Необходимо сейчас?
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={task.has_resources ?? false} onCheckedChange={(v) => updateMission(task.id, "has_resources", !!v)} />
                  Есть ресурсы/время?
                </label>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => moveToReady(task.id)}>
                  <ArrowRight className="h-4 w-4 mr-1" /> В работу
                </Button>
                <Button size="sm" variant="outline" onClick={() => reject(task.id)}>
                  <X className="h-4 w-4 mr-1" /> Отклонить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
