import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, DollarSign, Home, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RentalAgreement {
  id: number;
  propertyId: number;
  propertyTitle: string;
  tenantName: string;
  landlordName: string;
  rentAmount: number;
  startDate: string;
  endDate?: string;
  status: 'ativo' | 'encerrado' | 'suspenso';
  condoFee?: number;
  iptu?: number;
}

interface RentalProperty {
  id: number;
  title: string;
  address: string;
  rentPrice: number;
  occupancy: 'occupied' | 'vacant' | 'maintenance';
  landlord: string;
  tenant?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
}

export default function Rentals() {
  const [activeTab, setActiveTab] = useState<'agreements' | 'properties'>('agreements');
  const [agreements, setAgreements] = useState<RentalAgreement[]>([]);
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Dados de exemplo
  const mockAgreements: RentalAgreement[] = [
    {
      id: 1,
      propertyId: 1,
      propertyTitle: 'Apartamento 201 - Rua das Flores',
      tenantName: 'João Silva',
      landlordName: 'Maria Santos',
      rentAmount: 250000,
      startDate: '2023-01-15',
      endDate: '2025-01-15',
      status: 'ativo',
      condoFee: 50000,
      iptu: 15000,
    },
    {
      id: 2,
      propertyId: 2,
      propertyTitle: 'Casa 3 - Condomínio Residencial',
      tenantName: 'Pedro Costa',
      landlordName: 'Ana Oliveira',
      rentAmount: 350000,
      startDate: '2023-06-01',
      status: 'ativo',
      condoFee: 80000,
    },
  ];

  const mockProperties: RentalProperty[] = [
    {
      id: 1,
      title: 'Apartamento 201 - Rua das Flores',
      address: 'Rua das Flores, 123 - Apt 201',
      rentPrice: 250000,
      occupancy: 'occupied',
      landlord: 'Maria Santos',
      tenant: 'João Silva',
      lastPaymentDate: '2024-01-05',
      nextPaymentDate: '2024-02-05',
    },
    {
      id: 2,
      title: 'Casa 3 - Condomínio Residencial',
      address: 'Condomínio Residencial, Lote 3',
      rentPrice: 350000,
      occupancy: 'occupied',
      landlord: 'Ana Oliveira',
      tenant: 'Pedro Costa',
      lastPaymentDate: '2024-01-10',
      nextPaymentDate: '2024-02-10',
    },
    {
      id: 3,
      title: 'Apartamento 501 - Av. Principal',
      address: 'Av. Principal, 500 - Apt 501',
      rentPrice: 300000,
      occupancy: 'vacant',
      landlord: 'Carlos Mendes',
    },
  ];

  React.useEffect(() => {
    setAgreements(mockAgreements);
    setProperties(mockProperties);
  }, []);

  const filteredAgreements = agreements.filter((agreement) => {
    const matchesSearch =
      agreement.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agreement.tenantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agreement.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      ativo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ativo' },
      encerrado: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Encerrado' },
      suspenso: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspenso' },
    };
    return statusMap[status] || statusMap['ativo'];
  };

  const getOccupancyBadge = (occupancy: string) => {
    const occupancyMap: Record<string, { bg: string; text: string; label: string }> = {
      occupied: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ocupado' },
      vacant: { bg: 'bg-red-100', text: 'text-red-800', label: 'Vago' },
      maintenance: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Manutenção' },
    };
    return occupancyMap[occupancy] || occupancyMap['vacant'];
  };

  const totalMonthlyRent = agreements
    .filter((a) => a.status === 'ativo')
    .reduce((sum, a) => sum + a.rentAmount, 0);

  const activeAgreements = agreements.filter((a) => a.status === 'ativo').length;

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">Gestão de Aluguéis</h1>
        <p className="text-gray-600 mt-2">Gerencie contratos de aluguel e propriedades alugadas</p>
      </div>

      {/* Cartões de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Contratos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgreements}</div>
            <p className="text-xs text-gray-500 mt-1">Contratos em vigência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Renda Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {(totalMonthlyRent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">Receita de aluguéis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Propriedades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length}</div>
            <p className="text-xs text-gray-500 mt-1">Total de imóveis</p>
          </CardContent>
        </Card>
      </div>

      {/* Abas */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('agreements')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agreements'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Contratos de Aluguel
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'properties'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Propriedades
          </button>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'agreements' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Contratos de Aluguel</CardTitle>
                <CardDescription>Gerencie todos os contratos de aluguel</CardDescription>
              </div>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Novo Contrato
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Input
                placeholder="Buscar por propriedade ou inquilino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="encerrado">Encerrado</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4">Propriedade</th>
                    <th className="text-left py-3 px-4">Inquilino</th>
                    <th className="text-left py-3 px-4">Proprietário</th>
                    <th className="text-right py-3 px-4">Aluguel</th>
                    <th className="text-left py-3 px-4">Período</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgreements.length > 0 ? (
                    filteredAgreements.map((agreement) => {
                      const badge = getStatusBadge(agreement.status);
                      return (
                        <tr key={agreement.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{agreement.propertyTitle}</td>
                          <td className="py-3 px-4">{agreement.tenantName}</td>
                          <td className="py-3 px-4">{agreement.landlordName}</td>
                          <td className="py-3 px-4 text-right font-medium">
                            R$ {(agreement.rentAmount / 100).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {new Date(agreement.startDate).toLocaleDateString('pt-BR')} até{' '}
                            {agreement.endDate ? new Date(agreement.endDate).toLocaleDateString('pt-BR') : 'Indeterminado'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button className="p-1 hover:bg-gray-200 rounded">
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-200 rounded">
                                <Edit2 className="w-4 h-4 text-blue-600" />
                              </button>
                              <button className="p-1 hover:bg-gray-200 rounded">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-gray-500">
                        Nenhum contrato encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'properties' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Propriedades para Aluguel</CardTitle>
                <CardDescription>Gerencie as propriedades alugadas</CardDescription>
              </div>
              <Button onClick={() => setShowModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nova Propriedade
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtro */}
            <div className="mb-6">
              <Input
                placeholder="Buscar por propriedade ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Grid de Propriedades */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.length > 0 ? (
                filteredProperties.map((property) => {
                  const occupancyBadge = getOccupancyBadge(property.occupancy);
                  return (
                    <Card key={property.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base">{property.title}</CardTitle>
                            <CardDescription className="text-xs mt-1">{property.address}</CardDescription>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${occupancyBadge.bg} ${occupancyBadge.text}`}>
                            {occupancyBadge.label}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>R$ {(property.rentPrice / 100).toLocaleString('pt-BR')}/mês</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>{property.landlord}</span>
                        </div>
                        {property.tenant && (
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="w-4 h-4 text-gray-500" />
                            <span>{property.tenant}</span>
                          </div>
                        )}
                        {property.nextPaymentDate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>Próximo: {new Date(property.nextPaymentDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button variant="outline" size="sm" className="flex-1">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Detalhes
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  Nenhuma propriedade encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
