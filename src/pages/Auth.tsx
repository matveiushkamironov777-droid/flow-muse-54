import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password, displayName)
      : await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else if (isSignUp) {
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Минимум 6 символов"
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

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--text-subtle)" }}>
          Потоковое планирование · Flow OS
        </p>
      </div>
    </div>
  );
}
