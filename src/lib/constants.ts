export const ENERGY_LABELS: Record<string, string> = {
  physical: "Физическая",
  mental: "Ментальная",
  emotional: "Эмоциональная",
  spiritual: "Духовная",
  recovery: "Восстановление",
};

export const ENERGY_COLORS: Record<string, string> = {
  physical: "bg-energy-physical",
  mental: "bg-energy-mental",
  emotional: "bg-energy-emotional",
  spiritual: "bg-energy-spiritual",
  recovery: "bg-energy-recovery",
};

export const ENERGY_TEXT_COLORS: Record<string, string> = {
  physical: "text-energy-physical",
  mental: "text-energy-mental",
  emotional: "text-energy-emotional",
  spiritual: "text-energy-spiritual",
  recovery: "text-energy-recovery",
};

export const KANBAN_LABELS: Record<string, string> = {
  inbox: "Входящие",
  ready: "Готово к работе",
  doing: "В работе",
  done: "Сделано",
  blocked: "Заблокировано",
  archived: "Архив",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  urgent: "Срочный",
};

export const DEFAULT_CLUSTERS = [
  { label: "Личное / Физическая", energy_type: "physical" as const, start_time: "06:00", end_time: "10:00", sort_order: 0 },
  { label: "Бизнес / Аналитика", energy_type: "mental" as const, start_time: "10:00", end_time: "13:00", sort_order: 1 },
  { label: "Обед + Отдых", energy_type: "recovery" as const, start_time: "13:00", end_time: "15:00", sort_order: 2 },
  { label: "Социальное", energy_type: "spiritual" as const, start_time: "15:00", end_time: "18:00", sort_order: 3 },
  { label: "Семья / Друзья", energy_type: "emotional" as const, start_time: "18:00", end_time: "21:30", sort_order: 4 },
  { label: "Подготовка ко сну", energy_type: "recovery" as const, start_time: "21:30", end_time: "22:00", sort_order: 5 },
];
