import React, { useEffect, useState, useMemo } from 'react';
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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

  // Funções auxiliares
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock className="w-4 h-4" /> },
      paid: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle className="w-4 h-4" /> },
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
  const chartData = [
    { name: 'Receita', value: (summary.totalRevenue || 0) / 100, fill: '#10b981' },
    { name: 'Despesas', value: (summary.totalExpenses || 0) / 100, fill: '#ef4444' },
    { name: 'Repasses', value: (summary.totalTransfers || 0) / 100, fill: '#3b82f6' },
    { name: 'Comissões', value: (summary.totalCommissions || 0) / 100, fill: '#8b5cf6' },
  ];

  if (statsLoading && !statsData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças da imobiliária</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filtros Avançados</SheetTitle>
                <SheetDescription>
                  Filtre as transações por proprietário, imóvel, tipo e mais
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Proprietário</Label>
                  <Select value={filterOwnerId} onValueChange={setFilterOwnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os proprietários" />
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

                <div className="space-y-2">
                  <Label>Imóvel</Label>
                  <Select value={filterPropertyId} onValueChange={setFilterPropertyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os imóveis" />
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

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os tipos" />
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

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categoriesList?.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={clearFilters} className="flex-1">
                    Limpar
                  </Button>
                  <Button onClick={() => setIsFilterSheetOpen(false)} className="flex-1">
                    Aplicar
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={handleRefresh} disabled={filteredLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${filteredLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros Ativos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros ativos:</span>
          {filterOwnerId !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ownersList?.find((o: any) => o.id === Number(filterOwnerId))?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterOwnerId('all')} />
            </Badge>
          )}
          {filterPropertyId !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {propertiesList?.find((p: any) => p.id === Number(filterPropertyId))?.title}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterPropertyId('all')} />
            </Badge>
          )}
          {filterType !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {getTypeLabel(filterType)}
              <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterType('all')} />
            </Badge>
          )}
          {(startDate || endDate) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setStartDate(''); setEndDate(''); }} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar todos
          </Button>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-green-600">
                {formatCurrency(hasActiveFilters ? (summary.totalRevenue || 0) : (statsData?.totalRevenue || 0))}
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-red-600">
                {formatCurrency(hasActiveFilters ? (summary.totalExpenses || 0) : (statsData?.totalExpenses || 0))}
              </div>
              <TrendingDown className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Repasses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {formatCurrency(hasActiveFilters ? (summary.totalTransfers || 0) : (statsData?.totalRepasses || 0))}
              </div>
              <ArrowDownLeft className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
              Lucro Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className={`text-xl md:text-2xl font-bold ${
                (statsData?.netProfit || 0) > 0 ? 'text-indigo-600' : 'text-red-600'
              }`}>
                {formatCurrency(statsData?.netProfit || 0)}
              </div>
              <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
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
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatCurrency(value * 100)}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Comparativo</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value * 100)} />
                      <Bar dataKey="value" fill="#8884d8">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle>Transações ({transactions.length})</CardTitle>
              <CardDescription>
                Lista de transações com os filtros aplicados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                        <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                        <th className="px-4 py-3 text-right font-semibold">Valor</th>
                        <th className="px-4 py-3 text-left font-semibold">Status</th>
                        <th className="px-4 py-3 text-left font-semibold">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction: any) => {
                        const statusBadge = getStatusBadge(transaction.status);
                        return (
                          <tr key={transaction.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3 font-medium">{transaction.description}</td>
                            <td className="px-4 py-3">
                              <span className={`font-semibold ${getTypeColor(transaction.type)}`}>
                                {getTypeLabel(transaction.type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{transaction.category || '-'}</td>
                            <td className="px-4 py-3 text-right font-semibold">
                              {formatCurrency(Number(transaction.amount))}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
                                {statusBadge.icon}
                                {transaction.status === 'pending' ? 'Pendente' : transaction.status === 'paid' ? 'Pago' : 'Cancelado'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Por Proprietário */}
        <TabsContent value="by-owner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatório por Proprietário</CardTitle>
              <CardDescription>
                Selecione um proprietário para ver o relatório detalhado
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
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Selecione um proprietário" />
                  </SelectTrigger>
                  <SelectContent>
                    {ownersList?.map((owner: any) => (
                      <SelectItem key={owner.id} value={String(owner.id)}>
                        {owner.name}
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
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold text-lg">{ownerReport.owner.name}</h3>
                      <p className="text-sm text-muted-foreground">{ownerReport.owner.email}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Aluguéis Recebidos</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(ownerReport.summary.totalRentReceived)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Comissões</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(ownerReport.summary.totalCommissions)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(ownerReport.summary.totalExpenses)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Pendente Repasse</p>
                          <p className="text-lg font-bold text-yellow-600">
                            {formatCurrency(ownerReport.summary.pendingTransfer)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Contratos Ativos: {ownerReport.summary.activeContracts}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-2">
                            {ownerReport.contracts.map((contract: any) => (
                              <div key={contract.id} className="flex items-center justify-between p-3 bg-muted rounded">
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
                            ))}
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
              <CardTitle>Relatório por Imóvel</CardTitle>
              <CardDescription>
                Selecione um imóvel para ver o relatório detalhado
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
                  <SelectTrigger className="w-full md:w-[300px]">
                    <SelectValue placeholder="Selecione um imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertiesList?.map((property: any) => (
                      <SelectItem key={property.id} value={String(property.id)}>
                        {property.title}
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
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold text-lg">{propertyReport.property.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {propertyReport.property.neighborhood}, {propertyReport.property.city}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Receita Total</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(propertyReport.summary.totalRentReceived)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Despesas</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(propertyReport.summary.totalExpenses)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Comissões</p>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(propertyReport.summary.totalCommissions)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                          <p className={`text-lg font-bold ${propertyReport.summary.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(propertyReport.summary.netProfit)}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          Taxa de Ocupação: {propertyReport.summary.occupancyRate}%
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="w-full h-4 bg-gray-200 rounded-full">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${propertyReport.summary.occupancyRate}%` }}
                          />
                        </div>
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
