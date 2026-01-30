import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Usar mutation do tRPC em vez de fetch REST
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      // Armazenar token e usuário no localStorage (para compatibilidade)
      if (data.token) {
        localStorage.setItem("leman_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("leman_user", JSON.stringify(data.user));
      }

      toast.success(`Bem-vindo, ${data.user.name}!`);

      // Usar navegação SPA em vez de hard reload
      setLocation("/admin");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error(error.message || "Erro ao fazer login");
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Leman</CardTitle>
          <CardDescription className="text-center">
            Negócios Imobiliários
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <CardTitle className="text-xl font-semibold">Entrar</CardTitle>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
            <div className="text-sm text-slate-600">
              <p className="font-semibold mb-1">Credenciais de acesso:</p>
              <p>Email: evandro@lemannegocios.com.br</p>
              <p>Senha: admin123</p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
