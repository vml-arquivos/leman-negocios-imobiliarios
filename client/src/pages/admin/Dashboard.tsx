import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  Users,
  Flame,
  Snowflake,
  Activity,
  ArrowRight,
  MapPin,
  Phone,
} from "lucide-react";
import { Link } from "wouter";

type AnyRecord = Record<string, any>;

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatDateTime(value: unknown) {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function pickPhone(lead: AnyRecord) {
  return lead.telefone || lead.phone || lead.whatsapp || "—";
}

function pickStage(lead: AnyRecord) {
  return lead.stage || lead.status || "—";
}

function stageBadgeVariant(stage: string) {
  const s = String(stage).toLowerCase();
  if (s.includes("quente") || s.includes("hot")) return "default";
  if (s.includes("morno")) return "secondary";
  if (s.includes("frio")) return "outline";
  return "secondary";
}

export default function Dashboard() {
  const { data: properties } = trpc.properties.list.useQuery();
  const { data: leads } = trpc.leads.list.useQuery();
  const { data: inactiveLeads } = trpc.leads.getInactiveHotLeads.useQuery();

  const props = (properties as AnyRecord[] | undefined) ?? [];
  const leadsArr = (leads as AnyRecord[] | undefined) ?? [];

  // KPIs
  const totalProperties = props.length;
  const activeProperties = props.filter((p) => String(p.status) === "disponivel").length;

  const totalLeads = leadsArr.length;
  const hotLeads = leadsArr.filter((l) => String(pickStage(l)).toLowerCase() === "quente").length;
  const inactiveHot = (inactiveLeads as AnyRecord[] | undefined)?.length ?? 0;

  // Trend: leads per day (last 14 days)
  const now = new Date();
  const daysBack = 14;
  const start = new Date(now);
  start.setDate(now.getDate() - (daysBack - 1));
  start.setHours(0, 0, 0, 0);

  const dayBuckets = new Map<string, { day: string; total: number; hot: number }>();
  for (let i = 0; i < daysBack; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    dayBuckets.set(key, { day: formatDayLabel(d), total: 0, hot: 0 });
  }

  for (const lead of leadsArr) {
    const d = toDate(lead.created_at ?? lead.createdAt ?? lead.createdAt);
    if (!d) continue;
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
    const bucket = dayBuckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (String(pickStage(lead)).toLowerCase() === "quente") bucket.hot += 1;
  }

  const leadsTrend = Array.from(dayBuckets.values());

  // Top neighborhoods (simple)
  const neighborhoodCount = new Map<string, number>();
  for (const p of props) {
    const n = String(p.neighborhood || "").trim();
    if (!n) continue;
    neighborhoodCount.set(n, (neighborhoodCount.get(n) || 0) + 1);
  }
  const topNeighborhoods = Array.from(neighborhoodCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  // Recent leads
  const recentLeads = [...leadsArr]
    .sort((a, b) => {
      const da = toDate(a.created_at ?? a.createdAt)?.getTime() ?? 0;
      const db = toDate(b.created_at ?? b.createdAt)?.getTime() ?? 0;
      return db - da;
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
            Visão Geral
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Métricas do funil, estoque de imóveis e performance do atendimento.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/properties/new">
            <Button className="bg-orange-500 hover:bg-orange-400 text-black">
              Cadastrar imóvel <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/admin/leads">
            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white">
              Ver leads
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70 font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-300" />
              Imóveis cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{totalProperties}</div>
            <div className="text-xs text-white/60 mt-1">
              {activeProperties} disponíveis na vitrine
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70 font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-300" />
              Leads totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{totalLeads}</div>
            <div className="text-xs text-white/60 mt-1">Entradas acumuladas</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70 font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-pink-300" />
              Leads quentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{hotLeads}</div>
            <div className="text-xs text-white/60 mt-1">Alta intenção (quente)</div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70 font-medium flex items-center gap-2">
              <Snowflake className="h-4 w-4 text-blue-300" />
              Quentes sem contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-white">{inactiveHot}</div>
            <div className="text-xs text-white/60 mt-1">Sem interação recente</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10 xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-300" />
              Entrada de leads (14 dias)
            </CardTitle>
            <p className="text-sm text-white/60">
              Total de leads por dia e recorte de leads quentes.
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              className="h-[260px] w-full"
              config={{
                total: { label: "Leads", color: "hsl(var(--chart-1))" },
                hot: { label: "Quentes", color: "hsl(var(--chart-3))" },
              }}
            >
              <ResponsiveContainer>
                <AreaChart data={leadsTrend} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.18} strokeWidth={2} />
                  <Area type="monotone" dataKey="hot" stroke="var(--color-hot)" fill="var(--color-hot)" fillOpacity={0.14} strokeWidth={2} />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-300" />
              Bairros com mais imóveis
            </CardTitle>
            <p className="text-sm text-white/60">Top 6 por estoque cadastrado.</p>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer
              className="h-[260px] w-full"
              config={{ count: { label: "Imóveis", color: "hsl(var(--chart-2))" } }}
            >
              <ResponsiveContainer>
                <BarChart data={topNeighborhoods} margin={{ left: 8, right: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={44}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }} axisLine={false} tickLine={false} width={28} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-300" />
            Leads recentes
          </CardTitle>
          <p className="text-sm text-white/60">
            Últimas entradas para priorizar atendimento e follow-up.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-hidden rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/10">
                  <TableHead className="text-white/60">Lead</TableHead>
                  <TableHead className="text-white/60">Telefone</TableHead>
                  <TableHead className="text-white/60">Qualificação</TableHead>
                  <TableHead className="text-white/60">Criado</TableHead>
                  <TableHead className="text-white/60 text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLeads.length === 0 ? (
                  <TableRow className="border-white/10">
                    <TableCell colSpan={5} className="text-white/60 py-8 text-center">
                      Nenhum lead encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLeads.map((lead) => {
                    const stage = String(pickStage(lead));
                    return (
                      <TableRow key={String(lead.id)} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white">
                          <div className="font-medium">{lead.name || "Sem nome"}</div>
                          <div className="text-xs text-white/50">{lead.email || "—"}</div>
                        </TableCell>
                        <TableCell className="text-white/80">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-white/40" />
                            {pickPhone(lead)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={stageBadgeVariant(stage)} className="bg-white/10 text-white border-white/10">
                            {stage}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/70">{formatDateTime(lead.created_at ?? lead.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Link href="/admin/leads">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/10 bg-transparent hover:bg-white/5 text-white"
                            >
                              Abrir
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
