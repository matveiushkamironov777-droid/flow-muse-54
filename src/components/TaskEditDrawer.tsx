import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Trash2, X } from "lucide-react";
import { KANBAN_LABELS, PRIORITY_LABELS, ENERGY_LABELS } from "@/lib/constants";
import type { Tables, Database } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;
type KanbanStatus = Database["public"]["Enums"]["kanban_status"];
type EnergyType = Database["public"]["Enums"]["energy_type"];
type Priority = Database["public"]["Enums"]["task_priority"];

interface Props {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const KANBAN_OPTIONS: KanbanStatus[] = ["inbox", "ready", "doing", "done", "blocked", "archived"];
const ENERGY_OPTIONS: EnergyType[] = ["physical", "mental", "emotional", "spiritual", "recovery"];
const PRIORITY_OPTIONS: Priority[] = ["low", "medium", "high", "urgent"];

export function TaskEditDrawer({ task, open, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<KanbanStatus>("inbox");
  const [priority, setPriority] = useState<Priority | "">("");
  const [energyType, setEnergyType] = useState<EnergyType | "">("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [duration, setDuration] = useState("");
  const [reward, setReward] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.kanban_status);
    setPriority(task.priority ?? "");
    setEnergyType(task.energy_type ?? "");
    setStartDate(task.start_date ?? "");
    setDeadline(task.deadline ?? "");
    setDuration(task.duration_estimate ? String(task.duration_estimate) : "");
    setReward(task.reward ?? "");
    setTags(task.tags ?? []);
    setTagInput("");
  }, [task]);

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const save = async () => {
    if (!task || !title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("tasks").update({
      title: title.trim(),
      description: description || null,
      kanban_status: status,
      priority: priority || null,
      energy_type: energyType || null,
      start_date: startDate || null,
      deadline: deadline || null,
      duration_estimate: duration ? parseInt(duration, 10) : null,
      reward: reward || null,
      tags,
    }).eq("id", task.id);
    setSaving(false);
    if (error) {
      toast({ title: "Ошибка сохранения", variant: "destructive" });
      return;
    }
    toast({ title: "Задача сохранена" });
    onSaved();
    onClose();
  };

  const deleteTask = async () => {
    if (!task) return;
    await supabase.from("tasks").delete().eq("id", task.id);
    toast({ title: "Задача удалена" });
    onSaved();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Редактировать задачу</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Описание / Комментарии</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Заметки, контекст..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Статус</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as KanbanStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KANBAN_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{KANBAN_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Приоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger><SelectValue placeholder="Не задан" /></SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{PRIORITY_LABELS[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Тип энергии</Label>
            <Select value={energyType} onValueChange={(v) => setEnergyType(v as EnergyType)}>
              <SelectTrigger><SelectValue placeholder="Не задан" /></SelectTrigger>
              <SelectContent>
                {ENERGY_OPTIONS.map((e) => (
                  <SelectItem key={e} value={e}>{ENERGY_LABELS[e]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Дата начала</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>Дедлайн</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Оценка времени (мин)</Label>
            <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="45" />
          </div>

          <div>
            <Label>Теги</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Введите тег и нажмите Enter"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>+</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Награда</Label>
            <Input value={reward} onChange={(e) => setReward(e.target.value)} placeholder="Что получу после выполнения..." />
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2">
          <Button variant="destructive" size="sm" onClick={deleteTask}>
            <Trash2 className="h-4 w-4 mr-1" /> Удалить
          </Button>
          <Button onClick={save} disabled={saving || !title.trim()}>
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
