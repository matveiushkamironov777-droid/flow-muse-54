import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Save, Settings2, X } from "lucide-react";

const SECTION_CONFIG = [
  { key: "mood", label: "Оценка дня", defaultOn: true },
  { key: "flow", label: "Что продвинуло поток?", defaultOn: true },
  { key: "leak", label: "Что утекало энергию?", defaultOn: true },
  { key: "gratitude", label: "Благодарность", defaultOn: false },
  { key: "wins", label: "Победы дня", defaultOn: false },
  { key: "improvement", label: "Какое 1 улучшение на завтра?", defaultOn: true },
];

const STORAGE_KEY = "daily_review_sections";

const MOOD_OPTIONS = [
  { value: "1", emoji: "😫", label: "Тяжело" },
  { value: "2", emoji: "😕", label: "Сложно" },
  { value: "3", emoji: "😐", label: "Нормально" },
  { value: "4", emoji: "🙂", label: "Хорошо" },
  { value: "5", emoji: "😊", label: "Отлично" },
];

type Answers = Record<string, string>;

function loadSections(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return Object.fromEntries(SECTION_CONFIG.map((s) => [s.key, s.defaultOn]));
}

export default function DailyReviewPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [answers, setAnswers] = useState<Answers>({});
  const [existingId, setExistingId] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>(loadSections);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("reviews").select("*").eq("user_id", user.id).eq("review_type", "daily").eq("date", today).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          setAnswers((data.answers as Answers) ?? {});
        }
      });
  }, [user]);

  const set = (key: string, value: string) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const toggleSection = (key: string) => {
    setSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const save = async () => {
    if (!user) return;
    if (existingId) {
      await supabase.from("reviews").update({ answers: answers as any }).eq("id", existingId);
    } else {
      const { data } = await supabase.from("reviews").insert({
        user_id: user.id, review_type: "daily", date: today, answers: answers as any,
      }).select().single();
      if (data) setExistingId(data.id);
    }
    toast({ title: "Обзор сохранён" });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Дневной обзор</h1>
          <p className="text-muted-foreground">{today}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSettings((v) => !v)}>
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      {showSettings && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Настройка секций</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowSettings(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            {SECTION_CONFIG.map((s) => (
              <label key={s.key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!sections[s.key]}
                  onChange={() => toggleSection(s.key)}
                  className="accent-primary"
                />
                <span className="text-sm">{s.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6 space-y-5">
          {sections.mood && (
            <div>
              <Label>Оценка дня</Label>
              <div className="flex gap-2 mt-1">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    title={m.label}
                    onClick={() => set("mood", m.value)}
                    className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${answers.mood === m.value ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"}`}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {sections.flow && (
            <div>
              <Label>Что продвинуло поток?</Label>
              <Textarea value={answers.flow ?? ""} onChange={(e) => set("flow", e.target.value)} placeholder="Что сегодня двигало дело вперёд..." />
            </div>
          )}

          {sections.leak && (
            <div>
              <Label>Что утекало энергию?</Label>
              <Textarea value={answers.leak ?? ""} onChange={(e) => set("leak", e.target.value)} placeholder="Что забирало силы..." />
            </div>
          )}

          {sections.gratitude && (
            <div>
              <Label>Благодарность</Label>
              <Textarea value={answers.gratitude ?? ""} onChange={(e) => set("gratitude", e.target.value)} placeholder="3 вещи, за которые я благодарен сегодня..." />
            </div>
          )}

          {sections.wins && (
            <div>
              <Label>Победы дня</Label>
              <Textarea value={answers.wins ?? ""} onChange={(e) => set("wins", e.target.value)} placeholder="Что получилось хорошо..." />
            </div>
          )}

          {sections.improvement && (
            <div>
              <Label>Какое 1 улучшение на завтра?</Label>
              <Textarea value={answers.improvement ?? ""} onChange={(e) => set("improvement", e.target.value)} placeholder="Одно конкретное улучшение..." />
            </div>
          )}

          <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Сохранить</Button>
        </CardContent>
      </Card>
    </div>
  );
}
