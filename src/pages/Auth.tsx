import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { isAuthError } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { InstallAppButton } from "@/components/InstallAppButton";
import { createPasswordRecoveryClient, passwordRecoveryEnabled, supabase } from "@/integrations/supabase/client";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = isSignUp
      ? await signUp(email.trim(), password, displayName)
      : await signIn(email.trim(), password);
    setLoading(false);
    if (result.error) {
      const code = isAuthError(result.error) ? result.error.code : undefined;
      if (isSignUp && (code === "user_already_exists" || code === "email_exists")) {
        setIsSignUp(false);
        setPassword("");
        toast({ title: "Этот адрес уже зарегистрирован", description: "Войдите в существующий аккаунт." });
      } else if (code === "invalid_credentials") {
        toast({ title: "Не удалось войти", description: "Проверьте email и пароль.", variant: "destructive" });
      } else {
        toast({ title: "Ошибка", description: result.error.message, variant: "destructive" });
      }
    } else if ("session" in result && !result.session) {
      toast({ title: "Проверьте почту для подтверждения регистрации" });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo + brand */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, var(--primary), oklch(0.62 0.18 280))",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 700,
              fontSize: 22,
              boxShadow: "0 4px 12px oklch(0.55 0.16 258 / 0.25)",
              marginBottom: 14,
            }}
          >
            F
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em", marginBottom: 4 }}>Flow OS</div>
          <div style={{ fontSize: 13.5, color: "var(--text-subtle)" }}>
            {isSignUp ? "Создать аккаунт" : "Войти в систему"}
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            boxShadow: "var(--shadow-md)",
            padding: "28px 28px 24px",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {isSignUp && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <Label htmlFor="name" style={{ fontSize: 13, fontWeight: 500 }}>Имя</Label>
                <Input
                  id="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  style={{ height: 38 }}
                />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="email" style={{ fontSize: 13, fontWeight: 500 }}>Email</Label>
              <Input
                id="email"
                type="email"
                  autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{ height: 38 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <Label htmlFor="password" style={{ fontSize: 13, fontWeight: 500 }}>Пароль</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSignUp ? 6 : undefined}
                placeholder={isSignUp ? "Минимум 6 символов" : undefined}
                style={{ height: 38 }}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              style={{ height: 40, fontSize: 14, fontWeight: 500 }}
            >
              {loading ? "Загрузка…" : isSignUp ? "Зарегистрироваться" : "Войти"}
            </Button>
            {passwordRecoveryEnabled && !isSignUp && (
              <Button type="button" variant="link" className="h-auto self-center p-0" onClick={() => setRecoveryOpen(true)}>
                Забыли пароль?
              </Button>
            )}
          </form>

          <div style={{ borderTop: "1px solid var(--border)", marginTop: 20, paddingTop: 16, textAlign: "center" }}>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                fontSize: 13,
                color: "var(--text-subtle)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-subtle)")}
            >
              {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
            </button>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground">Потоковое планирование · Flow OS</p>
          <InstallAppButton />
        </div>
      </div>
      {recoveryOpen && <PasswordRecoveryDialog initialEmail={email} onClose={() => setRecoveryOpen(false)} />}
    </div>
  );
}

function PasswordRecoveryDialog({ initialEmail, onClose }: { initialEmail: string; onClose: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState("");

  const sendLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: new URL("/auth/reset-password", window.location.origin).href,
    });
    setSending(false);
    if (!error || error.code === "user_not_found") {
      setRequested(true);
      return;
    }
    setMessage(error.status === 429
      ? "Слишком много запросов. Попробуйте чуть позже."
      : "Не удалось запросить ссылку. Попробуйте ещё раз.");
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-[calc(100%_-_2rem)] max-w-sm rounded-lg">
        <DialogHeader>
          <DialogTitle>Восстановить пароль</DialogTitle>
          <DialogDescription>
            {requested
              ? "Если аккаунт существует, на его почту придёт ссылка для смены пароля. Проверьте также папку «Спам»."
              : "Введите email, который указали при регистрации."}
          </DialogDescription>
        </DialogHeader>
        {requested ? <Button type="button" onClick={onClose}>Готово</Button> : (
          <form className="space-y-4" onSubmit={sendLink}>
            <div className="space-y-2">
              <Label htmlFor="recovery-email">Email</Label>
              <Input id="recovery-email" type="email" autoComplete="email" required value={email}
                onChange={(event) => setEmail(event.target.value)} />
            </div>
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" className="w-full" disabled={sending}>{sending ? "Отправка…" : "Запросить ссылку"}</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function PasswordReset() {
  const { hash } = useLocation();
  const tokenHash = new URLSearchParams(hash.slice(1)).get("token_hash");
  return <PasswordResetForm key={tokenHash ?? ""} tokenHash={tokenHash} />;
}

function PasswordResetForm({ tokenHash }: { tokenHash: string | null }) {
  const [state, setState] = useState<"ready" | "verified" | "invalid" | "complete">(tokenHash ? "ready" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const recoveryClient = useRef<ReturnType<typeof createPasswordRecoveryClient> | null>(null);

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving || !tokenHash) return;
    if (password !== confirmation) {
      setMessage("Пароли не совпадают.");
      return;
    }
    setSaving(true);
    setMessage("");
    const client = recoveryClient.current ??= createPasswordRecoveryClient();
    if (state === "ready") {
      const { data, error } = await client.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
      if (error || !data.session) {
        setSaving(false);
        if (!error || error.code === "otp_expired" || error.code === "bad_code_verifier") {
          setState("invalid");
        } else {
          setMessage("Не удалось проверить ссылку. Попробуйте ещё раз.");
        }
        return;
      }
      window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
      setState("verified");
    }
    const { error } = await client.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setMessage(error.code === "same_password"
        ? "Выберите пароль, который отличается от прежнего."
        : error.code === "weak_password"
          ? "Выберите более надёжный пароль."
          : "Не удалось сохранить новый пароль. Попробуйте ещё раз.");
      return;
    }
    setPassword("");
    setConfirmation("");
    setState("complete");
    void client.auth.signOut({ scope: "local" });
  };

  const finished = state === "complete" || state === "invalid";
  return (
    <main className="grid min-h-screen place-items-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader><CardTitle>Смена пароля</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {finished ? (
            <>
              <p role="status" className="text-sm text-muted-foreground">
                {state === "complete"
                  ? "Пароль изменён. Войдите с новым паролем."
                  : "Ссылка недействительна или уже использована. Запросите новую на странице входа."}
              </p>
              <Button asChild className="w-full"><Link to="/auth">На страницу входа</Link></Button>
            </>
          ) : (
            <form className="space-y-4" onSubmit={resetPassword}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={6}
                  required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repeat-password">Повторите пароль</Label>
                <Input id="repeat-password" type="password" autoComplete="new-password"
                  required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
              </div>
              {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
              <Button type="submit" className="w-full" disabled={saving}>{saving ? "Сохранение…" : "Сохранить пароль"}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
