import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnergyBadge } from "@/components/EnergyBadge";
import { KANBAN_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { Columns3, AlertTriangle } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type KanbanStatus = Database["public"]["Enums"]["kanban_status"];

const COLUMNS: KanbanStatus[] = ["inbox", "ready", "doing", "done", "blocked"];

export default function BoardPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wipLimit, setWipLimit] = useState(3);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const [tasksRes, profileRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).in("kanban_status", COLUMNS).order("sort_order"),
      supabase.from("profiles").select("wip_limit").eq("user_id", user.id).single(),
    ]);
    setTasks(tasksRes.data ?? []);
    if (profileRes.data) setWipLimit(profileRes.data.wip_limit);
  };

  useEffect(() => { fetchData(); }, [user]);

  const moveTask = async (taskId: string, newStatus: KanbanStatus) => {
    // Optimistic
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, kanban_status: newStatus } : t));
    await supabase.from("tasks").update({ kanban_status: newStatus }).eq("id", taskId);
  };

  const handleDrop = (e: React.DragEvent, col: KanbanStatus) => {
    e.preventDefault();
    if (draggedId) {
      moveTask(draggedId, col);
      setDraggedId(null);
    }
  };

  const doingCount = tasks.filter((t) => t.kanban_status === "doing").length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Columns3 className="h-6 w-6" /> Канбан</h1>
        <p className="text-muted-foreground">Перетаскивайте задачи между колонками</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.kanban_status === col);
          const isWipExceeded = col === "doing" && doingCount > wipLimit;
          return (
            <div
              key={col}
              className="min-w-[260px] flex-shrink-0 flex flex-col"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, col)}
            >
              <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-md ${isWipExceeded ? "bg-destructive/10" : "bg-muted/50"}`}>
                <span className="text-sm font-semibold">{KANBAN_LABELS[col]}</span>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                {isWipExceeded && <AlertTriangle className="h-4 w-4 text-destructive" />}
              </div>
              <div className="space-y-2 flex-1">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedId(task.id)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="flex flex-wrap gap-1">
                        <EnergyBadge type={task.energy_type} />
                        {task.priority && task.priority !== "medium" && (
                          <Badge variant="outline" className="text-xs">{PRIORITY_LABELS[task.priority]}</Badge>
                        )}
                        {task.duration_estimate && (
                          <Badge variant="outline" className="text-xs">{task.duration_estimate}м</Badge>
                        )}
                      </div>
                      {task.deadline && (
                        <div className="text-xs text-muted-foreground">⏰ {task.deadline}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
