import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { EnergyBadge } from "@/components/EnergyBadge";
import { KANBAN_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import { toast } from "@/hooks/use-toast";
import { ArrowRightLeft, Columns3, AlertTriangle, Pencil, Plus } from "lucide-react";
import type { Database, Tables } from "@/integrations/supabase/types";
import { TaskEditDrawer } from "@/components/TaskEditDrawer";

type Task = Tables<"tasks">;
type KanbanStatus = Database["public"]["Enums"]["kanban_status"];
type CustomColumn = Tables<"kanban_columns">;
type ColumnLabel = Tables<"kanban_column_labels">;
type BoardColumn = { id: string; title: string; status: KanbanStatus | null };

const COLUMNS: KanbanStatus[] = ["inbox", "ready", "doing", "done", "blocked"];
const COLUMN_NAME_LIMIT = 60;

export default function BoardPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [columnLabels, setColumnLabels] = useState<ColumnLabel[]>([]);
  const [wipLimit, setWipLimit] = useState(3);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [movingTasks, setMovingTasks] = useState<string[]>([]);
  const [columnForm, setColumnForm] = useState<{ column: BoardColumn | null; title: string } | null>(null);
  const [savingColumn, setSavingColumn] = useState(false);
  const [newColumnId, setNewColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    const [tasksRes, profileRes, columnsRes, labelsRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", userId).in("kanban_status", COLUMNS).order("sort_order"),
      supabase.from("profiles").select("wip_limit").eq("user_id", userId).maybeSingle(),
      supabase.from("kanban_columns").select("*").eq("user_id", userId).order("created_at").order("id"),
      supabase.from("kanban_column_labels").select("*").eq("user_id", userId),
    ]);
    setLoading(false);
    const failed = Boolean(tasksRes.error || profileRes.error || columnsRes.error || labelsRes.error);
    setLoadError(failed);
    if (failed) return;
    setTasks(tasksRes.data);
    setCustomColumns(columnsRes.data);
    setColumnLabels(labelsRes.data);
    if (profileRes.data) setWipLimit(profileRes.data.wip_limit);
  }, [userId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!newColumnId) return;
    document.getElementById(`kanban-column-${newColumnId}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
    setNewColumnId(null);
  }, [newColumnId]);

  const columns: BoardColumn[] = [
    ...COLUMNS.map((status) => ({
      id: status,
      title: columnLabels.find((label) => label.status === status)?.title ?? KANBAN_LABELS[status],
      status,
    })),
    ...customColumns.map(({ id, title }) => ({ id, title, status: null })),
  ];

  const moveTask = async (taskId: string, destination: BoardColumn) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!userId || !task || movingTasks.includes(taskId)) return;
    if ((task.kanban_column_id ?? task.kanban_status) === destination.id) return;

    const changes = destination.status
      ? { kanban_status: destination.status, kanban_column_id: null }
      : { kanban_column_id: destination.id };

    setMovingTasks((ids) => [...ids, taskId]);
    const { data, error } = await supabase
      .from("tasks")
      .update(changes)
      .eq("id", taskId)
      .eq("user_id", userId)
      .select("*")
      .single();
    setMovingTasks((ids) => ids.filter((id) => id !== taskId));

    if (error) {
      toast({ title: "Не удалось переместить задачу", description: "Попробуйте ещё раз.", variant: "destructive" });
      return;
    }
    setTasks((items) => items.map((item) => item.id === data.id ? data : item));
  };

  const saveColumn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !columnForm || savingColumn) return;
    const title = columnForm.title.trim();
    if (!title) return;
    const column = columnForm.column;
    setSavingColumn(true);

    if (column?.status) {
      const { data, error } = await supabase
        .from("kanban_column_labels")
        .upsert({ user_id: userId, status: column.status, title }, { onConflict: "user_id,status" })
        .select("*")
        .single();
      setSavingColumn(false);
      if (error) {
        toast({ title: "Не удалось сохранить колонку", description: "Попробуйте ещё раз.", variant: "destructive" });
        return;
      }
      setColumnLabels((labels) => [...labels.filter((label) => label.status !== data.status), data]);
    } else {
      const mutation = column
        ? supabase.from("kanban_columns").update({ title }).eq("id", column.id).eq("user_id", userId)
        : supabase.from("kanban_columns").insert({ title, user_id: userId });
      const { data, error } = await mutation.select("*").single();
      setSavingColumn(false);
      if (error) {
        toast({ title: "Не удалось сохранить колонку", description: "Попробуйте ещё раз.", variant: "destructive" });
        return;
      }
      setCustomColumns((items) => column ? items.map((item) => item.id === data.id ? data : item) : [...items, data]);
      if (!column) setNewColumnId(data.id);
    }
    setColumnForm(null);
  };

  const doingCount = tasks.filter((t) => t.kanban_status === "doing").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Columns3 className="h-6 w-6" /> Канбан</h1>
        <Button
          variant="outline"
          disabled={loading || loadError}
          onClick={() => setColumnForm({ column: null, title: "" })}
        >
          <Plus className="mr-2 h-4 w-4" /> Добавить колонку
        </Button>
      </div>

      {loading && <p role="status" className="text-sm text-muted-foreground">Загрузка канбана…</p>}
      {loadError && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-destructive">Не удалось загрузить канбан.</p>
          <Button variant="outline" size="sm" onClick={() => {
            setLoadError(false);
            setLoading(true);
            void fetchData();
          }}>Повторить</Button>
        </div>
      )}

      {!loading && !loadError && <div className="flex snap-x snap-proximity gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const colTasks = tasks.filter((task) => (task.kanban_column_id ?? task.kanban_status) === column.id);
          const isWipExceeded = column.status === "doing" && doingCount > wipLimit;
          return (
            <div
              key={column.id}
              id={`kanban-column-${column.id}`}
              className="flex w-[min(78vw,18rem)] shrink-0 snap-start flex-col sm:w-[260px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void moveTask(e.dataTransfer.getData("text/plain"), column);
              }}
            >
              <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-md ${isWipExceeded ? "bg-destructive/10" : "bg-muted/50"}`}>
                <h2 className="min-w-0 flex-1 break-words text-sm font-semibold">{column.title}</h2>
                <Badge variant="secondary" className="text-xs">{colTasks.length}</Badge>
                {isWipExceeded && <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" aria-label="Превышен лимит задач в работе" />}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`Переименовать колонку «${column.title}»`}
                  onClick={() => setColumnForm({ column, title: column.title })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 flex-1">
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable={!movingTasks.includes(task.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", task.id);
                    }}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 break-words pt-2 text-sm font-medium">{task.title}</div>
                        <div className="flex shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
                                disabled={movingTasks.includes(task.id)}
                                aria-label={`Переместить задачу «${task.title}»`}>
                                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-[55vh] max-w-[18rem] overflow-y-auto">
                              {columns.filter((destination) => destination.id !== column.id).map((destination) => (
                                <DropdownMenuItem key={destination.id}
                                  className="min-h-10 break-words"
                                  onSelect={() => void moveTask(task.id, destination)}>
                                  {destination.title}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button type="button" variant="ghost" size="icon" className="h-9 w-9"
                            disabled={movingTasks.includes(task.id)}
                            aria-label={`Редактировать задачу «${task.title}»`}
                            onClick={() => setEditingTask(task)}>
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <EnergyBadge type={task.energy_type} />
                        {task.priority && task.priority !== "medium" && (
                          <Badge variant="outline" className="text-xs">{PRIORITY_LABELS[task.priority]}</Badge>
                        )}
                        {task.duration_estimate && (
                          <Badge variant="outline" className="text-xs">{task.duration_estimate}м</Badge>
                        )}
                        {task.tags && task.tags.length > 0 && task.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      {task.deadline && (
                        <div className="text-xs text-muted-foreground">⏰ {task.deadline}</div>
                      )}
                      {task.reward && (
                        <div className="text-xs text-muted-foreground">🏆 {task.reward}</div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>}

      <Dialog open={Boolean(columnForm)} onOpenChange={(open) => {
        if (!open && !savingColumn) setColumnForm(null);
      }}>
        <DialogContent aria-describedby={undefined} className="w-[calc(100%_-_2rem)] max-w-sm rounded-lg">
          <DialogHeader>
            <DialogTitle>{columnForm?.column ? "Переименовать колонку" : "Добавить колонку"}</DialogTitle>
          </DialogHeader>
          {columnForm && (
            <form className="space-y-4" onSubmit={saveColumn}>
              <div className="space-y-2">
                <Label htmlFor="kanban-column-title">Название колонки</Label>
                <Input
                  id="kanban-column-title"
                  value={columnForm.title}
                  onChange={(event) => setColumnForm({ ...columnForm, title: event.target.value })}
                  placeholder="На этой неделе"
                  maxLength={COLUMN_NAME_LIMIT}
                  required
                  disabled={savingColumn}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={!columnForm.title.trim() || savingColumn}>
                  {savingColumn ? "Сохранение…" : "Сохранить"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <TaskEditDrawer
        task={editingTask}
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSaved={fetchData}
      />
    </div>
  );
}
