BEGIN;

CREATE TABLE public.kanban_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 60),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, id)
);

CREATE TABLE public.kanban_column_labels (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.kanban_status NOT NULL CHECK (status <> 'archived'),
  title text NOT NULL CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 60),
  PRIMARY KEY (user_id, status)
);

ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_column_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own Kanban columns" ON public.kanban_columns
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own Kanban column labels" ON public.kanban_column_labels
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.kanban_columns, public.kanban_column_labels FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE (title) ON public.kanban_columns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.kanban_column_labels TO authenticated;

ALTER TABLE public.tasks
  ADD COLUMN kanban_column_id uuid,
  ADD CONSTRAINT tasks_kanban_column_fkey
    FOREIGN KEY (user_id, kanban_column_id) REFERENCES public.kanban_columns(user_id, id)
    ON DELETE SET NULL (kanban_column_id),
  ADD CONSTRAINT archived_tasks_have_no_kanban_column
    CHECK (kanban_status <> 'archived' OR kanban_column_id IS NULL);

CREATE INDEX tasks_kanban_column_idx ON public.tasks (user_id, kanban_column_id)
  WHERE kanban_column_id IS NOT NULL;

-- Existing task actions change the workflow status without knowing about custom columns.
CREATE FUNCTION public.clear_custom_kanban_column_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.kanban_status IS DISTINCT FROM OLD.kanban_status THEN
    NEW.kanban_column_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.clear_custom_kanban_column_on_status_change() FROM PUBLIC;

CREATE TRIGGER clear_custom_kanban_column_on_status_change
  BEFORE UPDATE OF kanban_status ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.clear_custom_kanban_column_on_status_change();

COMMIT;
