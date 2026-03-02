import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, Save } from "lucide-react";

export default function DailyReviewPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [answers, setAnswers] = useState({ flow: "", leak: "", improvement: "" });
  const [existingId, setExistingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("reviews").select("*").eq("user_id", user.id).eq("review_type", "daily").eq("date", today).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id);
          const a = data.answers as any;
          setAnswers({ flow: a?.flow ?? "", leak: a?.leak ?? "", improvement: a?.improvement ?? "" });
        }
      });
  }, [user]);

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-6 w-6" /> Дневной обзор</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Что продвинуло поток?</Label>
            <Textarea value={answers.flow} onChange={(e) => setAnswers({ ...answers, flow: e.target.value })} placeholder="Что сегодня двигало дело вперёд..." />
          </div>
          <div>
            <Label>Что утекало энергию?</Label>
            <Textarea value={answers.leak} onChange={(e) => setAnswers({ ...answers, leak: e.target.value })} placeholder="Что забирало силы..." />
          </div>
          <div>
            <Label>Какое 1 улучшение на завтра?</Label>
            <Textarea value={answers.improvement} onChange={(e) => setAnswers({ ...answers, improvement: e.target.value })} placeholder="Одно конкретное улучшение..." />
          </div>
          <Button onClick={save}><Save className="h-4 w-4 mr-1" /> Сохранить</Button>
        </CardContent>
      </Card>
    </div>
  );
}
