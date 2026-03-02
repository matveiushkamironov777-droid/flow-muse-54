import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Flow Planning OS</CardTitle>
          <CardDescription>{isSignUp ? "Создать аккаунт" : "Войти в систему"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : isSignUp ? "Зарегистрироваться" : "Войти"}
            </Button>
          </form>
          <button
            className="w-full text-center text-sm text-muted-foreground mt-4 hover:underline"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Уже есть аккаунт? Войти" : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
