

# Flow Planning OS (Потоковое планирование)

Полноценная система потокового планирования — React + Vite + Tailwind + Supabase.

---

## Phase 1: Foundation & Data Layer

### Database Schema (Supabase/PostgreSQL)
Set up all core tables with RLS policies:
- **profiles** — user settings (WIP limit, container durations, timezone)
- **goals** — title, description, target date, outcome criteria, status
- **milestones** — belongs to goal, order, status
- **tasks** — title, description, energy type, priority, deadline, duration estimate, context fields (place, resources, circumstances), mission direction, happiness component, kanban status (inbox/ready/doing/done/blocked/archived), belongs to milestone (optional)
- **clusters** — time ranges with energy type labels, day/week scope, user-customizable
- **containers** — date, start time, linked tasks, status (planned/done)
- **habits** — trigger, action, reward, frequency, replacement mapping, streak count
- **habit_logs** — daily completion tracking
- **reviews** — type (daily/weekly), date, structured answers (JSON)
- **learning_notes** — linked to task/goal, reason for failure, reflection text

Seed demo data: 6 default energy clusters, demo goal "Изучить язык" with milestones and tasks, sample habits.

### Auth
Simple Supabase Auth (email + password) with profile auto-creation.

---

## Phase 2: Core UI & Navigation

### Layout
- **Sidebar navigation** (collapsible on mobile) with Russian labels and icons
- **Global quick-add** (hotkey "N") — modal that creates task in Inbox with minimal fields
- Routes: `/`, `/inbox`, `/board`, `/planner`, `/goals`, `/habits`, `/reviews/daily`, `/reviews/weekly`, `/settings`

### Design System
- Clean minimalist UI, mobile-first
- Consistent icon set (Lucide)
- Muted color palette with energy-type color coding (5 colors for 5 energy types)
- Tooltips as assistant hints throughout

---

## Phase 3: Dashboard (/)

- **Сегодня** — today's planned containers on a mini-timeline
- **Сейчас** — current/next container with active task
- **Быстрый захват** — inline quick-add form
- **В работе** — cards currently in "Doing" column
- **Привычки** — today's habit checklist
- **Статистика дня** — containers planned vs done, energy balance

---

## Phase 4: Inbox & Mission Filter (/inbox)

- List of all Inbox tasks with bulk triage actions
- **Mission filter checklist** per task:
  - Соответствует миссии/ценностям?
  - Необходимо сейчас?
  - Есть ресурсы/время?
- Pass → move to "Ready"; Fail → move to "Backlog/Rejected"
- Tag tasks with mission direction and happiness component labels

---

## Phase 5: Kanban Board (/board)

- Drag-and-drop columns: Входящие → Готово к работе → В работе → Сделано (+ Заблокировано, Архив)
- **WIP limit** on "В работе" (configurable, visual warning when exceeded)
- Card displays: title, duration, energy type badge, cluster, container, context flags, priority, deadline
- Optimistic UI updates on drag

---

## Phase 6: Day Planner (/planner)

- **Timeline view** showing the day divided into clusters (color-coded by energy type)
- Drag tasks into **containers** (45min work + 15min rest blocks)
- Auto-split: tasks >45min get split across multiple containers
- Visual rules enforcement: no work >45min without break
- Micro-break indicators between tasks
- **Energy Map view**: visual heatmap of energy types across the day
- Energy mismatch warnings when task type doesn't match cluster energy

---

## Phase 7: Goals & Decomposition (/goals)

- Goal list with progress indicators
- **Decomposition wizard**:
  1. Input big goal with outcome criteria
  2. Split into milestones/parts
  3. Define order of milestones
  4. Generate tasks with suggested durations and energy types
- Goal → Milestones → Tasks tree view
- Progress tracking by milestone completion

---

## Phase 8: Habits Engine (/habits)

- Daily habit tracker with checkboxes
- Each habit shows: trigger → action → reward chain
- **Streak counter** with visual indicator
- Reward confirmation prompt on completion
- **Replacement plan**: map old habit trigger → new action + reward
- Adherence tracking over time

---

## Phase 9: Reviews (/reviews/daily, /reviews/weekly)

### Daily Review
- "Что продвинуло поток?" (What moved the flow?)
- "Что утекало энергию?" (What leaked energy?)
- "Какое 1 улучшение на завтра?" (What 1 improvement tomorrow?)

### Weekly Review
- Summaries by goals, energy types, clusters
- Context failure analysis
- Simple charts (Recharts):
  - Completed tasks by energy type
  - Planned vs done containers
  - WIP violations count
  - Common failure reasons

### Plan vs Reality
- When marking task as failed/rolled-over, prompt: "Что пошло не так?"
- Save as Learning Note linked to task/goal

---

## Phase 10: Settings (/settings)

- **Clusters editor**: customize time ranges, labels, energy types per day/week
- **Energy types**: manage the 5 default types + custom
- **WIP limit** configuration
- **Container durations**: work/rest segment lengths
- **Profile**: email, timezone

---

## Phase 11: Context-Aware Planning

- Context profile per task: resources, optimal time, optimal place, circumstances (tags), external forces
- Context checklist component reusable in task editing
- Context failure tracking in reviews

---

## UX Principles
- Every core concept one click from dashboard
- Default flow: Захват → Сортировка → Контейнеры → Выполнение → Обзор
- Assistant hints as tooltips (not walls of text)
- Optimistic UI for all CRUD operations
- Mobile-first responsive design
- All UI text in Russian

