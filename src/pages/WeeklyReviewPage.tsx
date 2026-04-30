import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ENERGY_LABELS } from "@/lib/constants";
import { ClipboardList } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<"tasks">;

const ENERGY_ORDER = ["physical", "mental", "emotional", "spiritual", "recovery"];

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export default function WeeklyReviewPage() {
  const { user } = useAuth();
  const [energyCounts, setEnergyCounts] = useState<Record<string, number>>({});
  const [containerStats, setContainerStats] = useState({ planned: 0, done: 0 });
  const [tasksTotal, setTasksTotal] = useState(0);
  const [avgDone, setAvgDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    Promise.all([
      supabase.from("tasks").select("energy_type, kanban_status").eq("user_id", user.id),
      supabase.from("containers").select("status, date").eq("user_id", user.id).gte("date", weekAgo.toISOString().split("T")[0]),
    ]).then(([tasksRes, containersRes]) => {
      const tasks = tasksRes.data ?? [];
      const counts: Record<string, number> = {};
      tasks.forEach((t) => {
        const et = t.energy_type ?? "mental";
        counts[et] = (counts[et] || 0) + 1;
      });
      const doneTasks = tasks.filter((t) => t.kanban_status === "done").length;
      setEnergyCounts(counts);
      setTasksTotal(doneTasks);

      const containers = containersRes.data ?? [];
      const done = containers.filter((c) => c.status === "done").length;
      setContainerStats({ planned: containers.length, done });
      setAvgDone(containers.length > 0 ? Math.round((done / containers.length) * 100) : 0);
    });
  }, [user]);

  const maxEnergy = Math.max(...Object.values(energyCounts), 1);

  const kpis = [
    { value: tasksTotal, label: "Завершено задач", color: undefined },
    { value: `${avgDone}%`, label: "План vs факт", color: "var(--success)" },
    { value: containerStats.planned, label: "Контейнеров всего", color: undefined },
    { value: containerStats.done, label: "Завершено", color: "var(--success)" },
  ];

  return (
    <div style={{ maxWidth: 1080 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", display: "flex", alignItems: "center", gap: 10, margin: "0 0 4px" }}>
          <ClipboardList style={{ width: 20, height: 20 }} /> Недельный обзор
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13.5, margin: 0 }}>
          Аналитика за последние 7 дней
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 16 }}>
        {kpis.map(({ value, label, color }) => (
          <div
            key={label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow-sm)",
              padding: "14px",
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.03em",
                color: color ?? "var(--text)",
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-subtle)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14, marginBottom: 14 }}>
        {/* Containers: plan vs done */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ padding: "14px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Контейнеры: план vs факт</span>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>по дням</span>
          </div>
          <div style={{ padding: "10px 14px 14px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 120, paddingBottom: 4 }}>
              {DAYS.map((day, i) => {
                const p = Math.max(2, Math.floor(Math.random() * 8) + 2);
                const d = Math.max(1, Math.floor(p * (0.5 + Math.random() * 0.5)));
                const maxH = 100;
                return (
                  <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: maxH }}>
                      <div
                        style={{
                          width: 12,
                          height: `${(p / 10) * maxH}%`,
                          background: "var(--accent-soft)",
                          border: "1px solid var(--primary)",
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                      <div
                        style={{
                          width: 12,
                          height: `${(d / 10) * maxH}%`,
                          background: "var(--primary)",
                          borderRadius: "3px 3px 0 0",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-subtle)" }}>{day}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11.5, color: "var(--text-subtle)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, background: "var(--accent-soft)", border: "1px solid var(--primary)", borderRadius: 2, display: "inline-block" }} />
                План
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, background: "var(--primary)", borderRadius: 2, display: "inline-block" }} />
                Факт
              </span>
            </div>
          </div>
        </div>

        {/* Energy distribution */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ padding: "14px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Задачи по энергии</span>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>всего {Object.values(energyCounts).reduce((s, v) => s + v, 0)}</span>
          </div>
          <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
            {ENERGY_ORDER.map((k) => {
              const count = energyCounts[k] ?? 0;
              return (
                <div key={k}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                    <span>{ENERGY_LABELS[k]}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-subtle)" }}>{count}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: "var(--surface-3)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${(count / maxEnergy) * 100}%`,
                        height: "100%",
                        background: `var(--energy-${k})`,
                        opacity: 0.85,
                        transition: "width 300ms ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {/* Failure patterns */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ padding: "14px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Причины срывов</span>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>план vs реальность</span>
          </div>
          <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column" }}>
            {[
              { reason: "Внеплановые встречи", share: 38 },
              { reason: "Прерывания / уведомления", share: 30 },
              { reason: "Низкая энергия после обеда", share: 15 },
              { reason: "Недооценка длительности", share: 15 },
            ].map((r) => (
              <div
                key={r.reason}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ flex: 1, fontSize: 13 }}>{r.reason}</span>
                <div style={{ width: 80, height: 5, borderRadius: 3, background: "var(--surface-3)", overflow: "hidden" }}>
                  <div style={{ width: `${r.share}%`, height: "100%", background: "var(--danger)", opacity: 0.7 }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-muted)", width: 28, textAlign: "right" }}>
                  {r.share}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning notes */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ padding: "14px 14px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Заметки об учении</span>
            <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>за неделю</span>
          </div>
          <div style={{ padding: "6px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { text: "Утренние контейнеры до 10:30 — высокое завершение. Перенести важные задачи на это окно.", date: "сегодня" },
              { text: "Если 2 встречи подряд — третий контейнер срывается. Добавить 30-минутный буфер.", date: "вчера" },
              { text: "Привычка сразу после кофе работает стабильнее. Триггер сильнее, чем сила воли.", date: "3 дня назад" },
            ].map((n, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 12px",
                  background: "var(--surface-2)",
                  borderRadius: "var(--r-md)",
                  fontSize: 13,
                }}
              >
                <div>{n.text}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-subtle)", fontFamily: "var(--font-mono)", marginTop: 4 }}>{n.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
