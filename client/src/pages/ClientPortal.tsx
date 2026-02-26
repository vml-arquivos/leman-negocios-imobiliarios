import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Building2, FileText, CreditCard, LogOut, Download, ExternalLink, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─── helpers ────────────────────────────────────────────────
function fmtBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}
function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pendente:  { label: "Pendente",  variant: "secondary" },
    pago:      { label: "Pago",      variant: "default" },
    vencido:   { label: "Vencido",   variant: "destructive" },
    cancelado: { label: "Cancelado", variant: "outline" },
  };
  const m = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

// ─── Login Form ──────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: (token: string, name: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState("");

  const loginMutation = trpc.clientPortal.login.useMutation({
    onSuccess: (data) => onSuccess(data.token, data.name || "Cliente"),
    onError: (e) => setError(e.message),
  });

  function formatCpf(v: string) {
    return v.replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .slice(0, 14);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Portal do Cliente</CardTitle>
          <CardDescription>
            Acesse seus contratos, boletos e extrato de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                maxLength={14}
              />
            </div>
            <div>
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => loginMutation.mutate({ cpf, birthDate })}
              disabled={loginMutation.isPending || !cpf || !birthDate}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Problemas de acesso? Entre em contato com a imobiliária.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────
function Dashboard({ token, name, onLogout }: { token: string; name: string; onLogout: () => void }) {
  const { data, isLoading, error } = trpc.clientPortal.dashboard.useQuery({ token });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar dados: {error.message}</AlertDescription>
      </Alert>
    );
  }

  const contracts = data?.contracts ?? [];
  const transactions = data?.transactions ?? [];

  const pendentes = transactions.filter((t: any) => t.status === "pendente");
  const pagos = transactions.filter((t: any) => t.status === "pago");
  const vencidos = transactions.filter((t: any) => t.status === "vencido");

  return (
    <div className="py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Olá, {name}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu portal</p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendentes.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{pagos.length}</p>
                <p className="text-sm text-muted-foreground">Pagos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{vencidos.length}</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contratos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Meus Contratos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum contrato encontrado.</p>
          ) : (
            <div className="space-y-3">
              {contracts.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Contrato #{c.id} — {c.tipo}</p>
                    <p className="text-sm text-muted-foreground">
                      Início: {fmtDate(c.data_inicio)} {c.data_fim ? `· Fim: ${fmtDate(c.data_fim)}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Valor: {fmtBRL(c.valor_total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                    {c.documento_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={c.documento_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Extrato de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma transação encontrada.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{t.descricao || `Parcela #${t.id}`}</p>
                    <p className="text-xs text-muted-foreground">
                      Vencimento: {fmtDate(t.data_vencimento)}
                      {t.data_pagamento ? ` · Pago em: ${fmtDate(t.data_pagamento)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{fmtBRL(t.valor)}</span>
                    {statusBadge(t.status)}
                    {t.boleto_url && t.status === "pendente" && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={t.boleto_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Boleto
                        </a>
                      </Button>
                    )}
                    {t.pix_qrcode && t.status === "pendente" && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={t.pix_qrcode} target="_blank" rel="noopener noreferrer">
                          PIX
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function ClientPortal() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("portal_token"));
  const [name, setName] = useState<string>(() => localStorage.getItem("portal_name") || "Cliente");

  function handleLogin(t: string, n: string) {
    localStorage.setItem("portal_token", t);
    localStorage.setItem("portal_name", n);
    setToken(t);
    setName(n);
  }

  function handleLogout() {
    localStorage.removeItem("portal_token");
    localStorage.removeItem("portal_name");
    setToken(null);
    setName("Cliente");
  }

  return (
    <>
      <Helmet>
        <title>Portal do Cliente - Leman Negócios Imobiliários</title>
        <meta name="description" content="Acesse seus contratos, boletos e extrato de pagamentos." />
      </Helmet>
      <Header />
      <div className="container">
        {token ? (
          <Dashboard token={token} name={name} onLogout={handleLogout} />
        ) : (
          <LoginForm onSuccess={handleLogin} />
        )}
      </div>
      <Footer />
    </>
  );
}
