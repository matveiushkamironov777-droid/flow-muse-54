import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Settings, Plus, Trash2, Save } from "lucide-react";
import { DEFAULT_CLUSTERS, ENERGY_LABELS } from "@/lib/constants";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Cluster = Tables<"clusters">;
type EnergyType = Database["public"]["Enums"]["energy_type"];

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [wipLimit, setWipLimit] = useState(3);
  const [workDuration, setWorkDuration] = useState(45);
  const [restDuration, setRestDuration] = useState(15);

  const fetchData = async () => {
    if (!user) return;
    const [p, c] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("clusters").select("*").eq("user_id", user.id).order("sort_order"),
    ]);
    if (p.data) {
      setProfile(p.data);
      setWipLimit(p.data.wip_limit);
      setWorkDuration(p.data.work_duration);
      setRestDuration(p.data.rest_duration);
    }
    setClusters(c.data ?? []);
  };

  useEffect(() => { fetchData(); }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ wip_limit: wipLimit, work_duration: workDuration, rest_duration: restDuration }).eq("user_id", user.id);
    toast({ title: "Настройки сохранены" });
  };

  const seedClusters = async () => {
    if (!user) return;
    for (const c of DEFAULT_CLUSTERS) {
      await supabase.from("clusters").insert({ ...c, user_id: user.id, scope: "daily" });
    }
    toast({ title: "Кластеры по умолчанию созданы" });
    fetchData();
  };

  const deleteCluster = async (id: string) => {
    await supabase.from("clusters").delete().eq("id", id);
    fetchData();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="h-6 w-6" /> Настройки</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Профиль</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>WIP лимит</Label>
              <Input type="number" min={1} max={10} value={wipLimit} onChange={(e) => setWipLimit(+e.target.value)} />
            </div>
            <div>
              <Label>Работа (мин)</Label>
              <Input type="number" min={15} max={90} value={workDuration} onChange={(e) => setWorkDuration(+e.target.value)} />
            </div>
            <div>
              <Label>Отдых (мин)</Label>
              <Input type="number" min={5} max={30} value={restDuration} onChange={(e) => setRestDuration(+e.target.value)} />
            </div>
          </div>
          <Button onClick={saveProfile}><Save className="h-4 w-4 mr-1" /> Сохранить</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Кластеры энергии</CardTitle>
            {clusters.length === 0 && (
              <Button size="sm" variant="outline" onClick={seedClusters}>
                <Plus className="h-3 w-3 mr-1" /> Загрузить по умолчанию
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {clusters.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет кластеров. Загрузите по умолчанию или создайте свои.</p>
          ) : (
            <div className="space-y-2">
              {clusters.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{c.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{c.start_time.slice(0,5)}–{c.end_time.slice(0,5)}</span>
                  </div>
                  <span className="text-xs">{ENERGY_LABELS[c.energy_type]}</span>
                  <Button size="icon" variant="ghost" onClick={() => deleteCluster(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
