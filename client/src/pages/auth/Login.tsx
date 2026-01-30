import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Importante para enviar/receber cookies
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Erro ao fazer login");
      }

      // Armazenar token e usuário no localStorage (para compatibilidade)
      if (data.data?.token) {
        localStorage.setItem("leman_token", data.data.token);
      }
      if (data.data?.user) {
        localStorage.setItem("leman_user", JSON.stringify(data.data.user));
      }
      
      toast.success(`Bem-vindo, ${data.data.user.name}!`);
      
      // Navegar para o dashboard
      setTimeout(() => {
        setLocation("/admin");
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao fazer login");
      setIsLoading(false);
    }
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
