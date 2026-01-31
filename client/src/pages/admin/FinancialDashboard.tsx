import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  User,
  Calendar,
  X,
  Loader2,
  Wallet,
  PiggyBank,
  Receipt,
  CreditCard,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const formatCurrencyShort = (value: number) => {
  if (value >= 100000000) {
    return `R$ ${(value / 100000000).toFixed(1)}M`;
  }
  if (value >= 100000) {
    return `R$ ${(value / 100000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};

const FinancialDashboard: React.FC = () => {
  // Estados de filtros
  const [filterOwnerId, setFilterOwnerId] = useState<string>('all');
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Queries tRPC
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = trpc.financial.getStats.useQuery();
  
  const { data: filteredData, isLoading: filteredLoading, refetch: refetchFiltered } = trpc.financial.getFilteredTransactions.useQuery({
    ownerId: filterOwnerId !== 'all' ? Number(filterOwnerId) : undefined,
    propertyId: filterPropertyId !== 'all' ? Number(filterPropertyId) : undefined,
    type: filterType !== 'all' ? filterType : undefined,
    category: filterCategory !== 'all' ? filterCategory : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: 100,
  });

  const { data: ownersList } = trpc.financial.getOwnersList.useQuery();
  const { data: propertiesList } = trpc.financial.getPropertiesList.useQuery();
  const { data: categoriesList } = trpc.financial.getCategoriesList.useQuery();

  // Estado para relatório detalhado
  const [selectedReportType, setSelectedReportType] = useState<'owner' | 'property' | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const { data: ownerReport, isLoading: ownerReportLoading } = trpc.financial.getOwnerReport.useQuery(
    { ownerId: selectedReportId || 0 },
    { enabled: selectedReportType === 'owner' && !!selectedReportId }
  );

  const { data: propertyReport, isLoading: propertyReportLoading } = trpc.financial.getPropertyReport.useQuery(
    { propertyId: selectedReportId || 0 },
    { enabled: selectedReportType === 'property' && !!selectedReportId }
  );

  const transactions = filteredData?.items || [];
  const summary = filteredData?.summary || {};

  // Verificar se há filtros ativos
  const hasActiveFilters = filterOwnerId !== 'all' || filterPropertyId !== 'all' || 
    filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' ||
    startDate || endDate;

  const activeFiltersCount = [
    filterOwnerId !== 'all',
    filterPropertyId !== 'all',
    filterType !== 'all',
    filterCategory !== 'all',
    filterStatus !== 'all',
    !!startDate,
    !!endDate,
  ].filter(Boolean).length;

  // Limpar filtros
  const clearFilters = () => {
    setFilterOwnerId('all');
    setFilterPropertyId('all');
    setFilterType('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
  };

  // Cores para os gráficos
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Gerar dados de evolução mensal
  const monthlyEvolutionData = useMemo(() => {
    const monthlyData: Record<string, { month: string; receita: number; despesa: number; lucro: number }> = {};
    
    transactions.forEach((t: any) => {
      const date = new Date(t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, receita: 0, despesa: 0, lucro: 0 };
      }
      
      const amount = Number(t.amount) / 100;
      if (t.type === 'revenue' || t.type === 'commission') {
        monthlyData[monthKey].receita += amount;
      } else if (t.type === 'expense') {
        monthlyData[monthKey].despesa += amount;
      }
    });
    
    // Calcular lucro
    Object.values(monthlyData).forEach(m => {
      m.lucro = m.receita - m.despesa;
    });
    
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, data]) => data)
      .slice(-12); // Últimos 12 meses
  }, [transactions]);

  // Funções auxiliares
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: <Clock className="w-3 h-3" />, label: 'Pendente' },
      paid: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: <CheckCircle className="w-3 h-3" />, label: 'Pago' },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: <AlertCircle className="w-3 h-3" />, label: 'Cancelado' },
    };
    return statusMap[status] || statusMap['pending'];
  };

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      revenue: 'Receita',
      expense: 'Despesa',
      transfer: 'Repasse',
      commission: 'Comissão',
    };
    return typeMap[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      revenue: 'text-green-600',
      expense: 'text-red-600',
      transfer: 'text-blue-600',
      commission: 'text-purple-600',
    };
    return colorMap[type] || 'text-gray-600';
  };

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      revenue: <ArrowUpRight className="h-4 w-4 text-green-600" />,
      expense: <ArrowDownLeft className="h-4 w-4 text-red-600" />,
      transfer: <CreditCard className="h-4 w-4 text-blue-600" />,
      commission: <Receipt className="h-4 w-4 text-purple-600" />,
    };
    return iconMap[type] || <DollarSign className="h-4 w-4" />;
  };

  const handleRefresh = async () => {
    await Promise.all([refetchStats(), refetchFiltered()]);
  };

  const handleExport = () => {
    const csv = [
      ['Descrição', 'Tipo', 'Categoria', 'Valor', 'Status', 'Data'],
      ...transactions.map((t: any) => [
        t.description,
        getTypeLabel(t.type),
        t.category || '-',
        formatCurrency(Number(t.amount)),
        t.status,
        new Date(t.createdAt).toLocaleDateString('pt-BR'),
      ]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Preparar dados para gráficos
  const pieChartData = [
    { name: 'Receita', value: (summary.totalRevenue || 0) / 100, fill: '#10b981' },
    { name: 'Despesas', value: (summary.totalExpenses || 0) / 100, fill: '#ef4444' },
    { name: 'Repasses', value: (summary.totalTransfers || 0) / 100, fill: '#3b82f6' },
    { name: 'Comissões', value: (summary.totalCommissions || 0) / 100, fill: '#8b5cf6' },
  ].filter(d => d.value > 0);

  // Calcular lucro líquido
  const netProfit = (summary.totalRevenue || 0) + (summary.totalCommissions || 0) - (summary.totalExpenses || 0) - (summary.totalTransfers || 0);

  if (statsLoading && !statsData) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Inteligência financeira para tomada de decisão</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExport} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros Granulares no Topo */}
      <Card>
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">Filtros Avançados</CardTitle>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFiltersOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por Proprietário */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Proprietário
                  </Label>
                  <Select value={filterOwnerId} onValueChange={setFilterOwnerId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os proprietários</SelectItem>
                      {ownersList?.map((owner: any) => (
                        <SelectItem key={owner.id} value={String(owner.id)}>
                          {owner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Imóvel */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Imóvel
                  </Label>
                  <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os imóveis</SelectItem>
                      {propertiesList?.map((property: any) => (
                        <SelectItem key={property.id} value={String(property.id)}>
                          {property.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Tipo */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Receipt className="h-3 w-3" />
                    Tipo
                  </Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="transfer">Repasse</SelectItem>
                      <SelectItem value="commission">Comissão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Status */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Status
                  </Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Categoria */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    Categoria
                  </Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categoriesList?.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por Data Início */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data Início
                  </Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Filtro por Data Fim */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Data Fim
                  </Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              Receitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              + Comissões: {formatCurrency(summary.totalCommissions || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownLeft className="h-4 w-4 text-red-500" />
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpenses || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Repasses: {formatCurrency(summary.totalTransfers || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {netProfit >= 0 ? (
                <><TrendingUp className="h-3 w-3 text-green-500" /> Positivo</>
              ) : (
                <><TrendingDown className="h-3 w-3 text-red-500" /> Negativo</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <PiggyBank className="h-4 w-4 text-purple-500" />
              Transações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {summary.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              No período selecionado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="by-owner">Por Proprietário</TabsTrigger>
          <TabsTrigger value="by-property">Por Imóvel</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de Evolução Mensal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Evolução do Lucro Líquido
                </CardTitle>
                <CardDescription>Últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyEvolutionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyEvolutionData}>
                      <defs>
                        <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(v) => `R$ ${v.toFixed(0)}`} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                        labelStyle={{ color: 'var(--foreground)' }}
                        contentStyle={{ 
                          backgroundColor: 'var(--background)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="lucro" 
                        name="Lucro Líquido"
                        stroke="#3b82f6" 
                        fillOpacity={1} 
                        fill="url(#colorLucro)" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="receita" 
                        name="Receita"
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="despesa" 
                        name="Despesa"
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Distribuição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PiggyBank className="h-4 w-4" />
                  Distribuição por Tipo
                </CardTitle>
                <CardDescription>Composição das transações</CardDescription>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center">
                      <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Sem dados para exibir</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transações Recentes</CardTitle>
              <CardDescription>
                {transactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 20).map((transaction: any) => {
                        const statusBadge = getStatusBadge(transaction.status);
                        return (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {transaction.description}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getTypeIcon(transaction.type)}
                                <span className={`font-medium ${getTypeColor(transaction.type)}`}>
                                  {getTypeLabel(transaction.type)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {transaction.category || '-'}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(Number(transaction.amount))}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusBadge.bg} ${statusBadge.text} gap-1`}>
                                {statusBadge.icon}
                                {statusBadge.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  {hasActiveFilters && (
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                      Limpar filtros
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Por Proprietário */}
        <TabsContent value="by-owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Relatório por Proprietário
              </CardTitle>
              <CardDescription>
                Selecione um proprietário para ver o extrato detalhado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select 
                  value={selectedReportType === 'owner' ? String(selectedReportId) : ''} 
                  onValueChange={(value) => {
                    setSelectedReportType('owner');
                    setSelectedReportId(Number(value));
                  }}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Selecione um proprietário..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ownersList?.map((owner: any) => (
                      <SelectItem key={owner.id} value={String(owner.id)}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {owner.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {ownerReportLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {ownerReport && (
                  <div className="space-y-4 mt-6">
                    <div className="p-4 bg-muted rounded-lg flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{ownerReport.owner.name}</h3>
                        <p className="text-sm text-muted-foreground">{ownerReport.owner.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Aluguéis Recebidos</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(ownerReport.summary.totalRentReceived)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Comissões</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatCurrency(ownerReport.summary.totalCommissions)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(ownerReport.summary.totalExpenses)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Pendente Repasse</p>
                          <p className="text-xl font-bold text-yellow-600">
                            {formatCurrency(ownerReport.summary.pendingTransfer)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Contratos Ativos: {ownerReport.summary.activeContracts}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {ownerReport.contracts.length > 0 ? (
                              ownerReport.contracts.map((contract: any) => (
                                <div key={contract.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">Contrato #{contract.contractNumber || contract.id}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(contract.startDate).toLocaleDateString('pt-BR')} - {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(contract.rentAmount)}/mês</p>
                                    <Badge className={contract.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                                      {contract.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Nenhum contrato encontrado
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Por Imóvel */}
        <TabsContent value="by-property" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Relatório por Imóvel
              </CardTitle>
              <CardDescription>
                Selecione um imóvel para ver o fluxo financeiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select 
                  value={selectedReportType === 'property' ? String(selectedReportId) : ''} 
                  onValueChange={(value) => {
                    setSelectedReportType('property');
                    setSelectedReportId(Number(value));
                  }}
                >
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Selecione um imóvel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesList?.map((property: any) => (
                      <SelectItem key={property.id} value={String(property.id)}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {property.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {propertyReportLoading && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {propertyReport && (
                  <div className="space-y-4 mt-6">
                    <div className="p-4 bg-muted rounded-lg flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{propertyReport.property.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {propertyReport.property.address}, {propertyReport.property.neighborhood}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Receita Total</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(propertyReport.summary.totalRentReceived)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrency(propertyReport.summary.totalExpenses)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(propertyReport.summary.netProfit)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-xs text-muted-foreground">Taxa Ocupação</p>
                          <p className="text-xl font-bold text-purple-600">
                            {propertyReport.summary.occupancyRate}%
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Histórico de Pagamentos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {propertyReport.payments.length > 0 ? (
                              propertyReport.payments.map((payment: any) => (
                                <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                  <div>
                                    <p className="font-medium">Ref: {payment.referenceMonth}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Vencimento: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(payment.totalAmount)}</p>
                                    <Badge className={
                                      payment.status === 'pago' 
                                        ? 'bg-green-100 text-green-700' 
                                        : payment.status === 'atrasado'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    }>
                                      {payment.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                Nenhum pagamento encontrado
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
