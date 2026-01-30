import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Building2, DollarSign, Calendar, TrendingUp, CheckCircle2, Phone, Mail, User, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Taxas de juros anuais dos principais bancos (2026)
const BANK_RATES = {
  caixa: { name: "Caixa Econômica Federal", rate: 10.49, logo: "🏦" },
  itau: { name: "Itaú Unibanco", rate: 10.99, logo: "🏦" },
  bradesco: { name: "Bradesco", rate: 11.29, logo: "🏦" },
  santander: { name: "Santander", rate: 11.49, logo: "🏦" },
  bb: { name: "Banco do Brasil", rate: 10.79, logo: "🏦" },
};

interface SimulationResult {
  bank: string;
  bankName: string;
  rate: number;
  firstInstallment: number;
  lastInstallment: number;
  averageInstallment: number;
  totalAmount: number;
  totalInterest: number;
  installments: Array<{
    month: number;
    installment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export default function FinancingSimulatorNew() {
  // Step 1: Lead Capture
  const [step, setStep] = useState<"lead" | "simulation">("lead");
  const [leadData, setLeadData] = useState({
    name: "",
    email: "",
    phone: "",
    propertyType: "",
    desiredLocation: "",
    estimatedValue: "",
  });

  // Step 2: Simulation
  const [simulationData, setSimulationData] = useState({
    propertyValue: "",
    downPayment: "",
    termYears: "30",
    amortizationSystem: "SAC" as "SAC" | "PRICE",
  });

  const [results, setResults] = useState<SimulationResult[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>("");

  const createSimulationMutation = trpc.financing.createSimulation.useMutation({
    onSuccess: () => {
      toast.success("Simulação salva com sucesso! Em breve entraremos em contato.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar simulação");
    },
  });

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leadData.name || !leadData.email || !leadData.phone) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setStep("simulation");
    toast.success("Dados salvos! Agora faça sua simulação.");
  };

  const calculateSAC = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    const principalPayment = principal / months;
    const installments = [];
    let balance = principal;

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const installment = principalPayment + interest;
      balance -= principalPayment;

      installments.push({
        month,
        installment: Math.round(installment),
        principal: Math.round(principalPayment),
        interest: Math.round(interest),
        balance: Math.round(Math.max(0, balance)),
      });
    }

    return installments;
  };

  const calculatePRICE = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    const installment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const installments = [];
    let balance = principal;

    for (let month = 1; month <= months; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = installment - interest;
      balance -= principalPayment;

      installments.push({
        month,
        installment: Math.round(installment),
        principal: Math.round(principalPayment),
        interest: Math.round(interest),
        balance: Math.round(Math.max(0, balance)),
      });
    }

    return installments;
  };

  const handleSimulate = () => {
    const propertyValue = parseFloat(simulationData.propertyValue);
    const downPayment = parseFloat(simulationData.downPayment);
    const termYears = parseInt(simulationData.termYears);

    if (!propertyValue || !downPayment || !termYears) {
      toast.error("Por favor, preencha todos os campos da simulação");
      return;
    }

    if (downPayment >= propertyValue) {
      toast.error("O valor da entrada deve ser menor que o valor do imóvel");
      return;
    }

    const financedAmount = propertyValue - downPayment;
    const termMonths = termYears * 12;

    const simulationResults: SimulationResult[] = Object.entries(BANK_RATES).map(([key, bank]) => {
      const installments = simulationData.amortizationSystem === "SAC"
        ? calculateSAC(financedAmount, bank.rate, termMonths)
        : calculatePRICE(financedAmount, bank.rate, termMonths);

      const totalAmount = installments.reduce((sum, inst) => sum + inst.installment, 0);
      const totalInterest = totalAmount - financedAmount;
      const averageInstallment = totalAmount / termMonths;

      return {
        bank: key,
        bankName: bank.name,
        rate: bank.rate,
        firstInstallment: installments[0].installment,
        lastInstallment: installments[installments.length - 1].installment,
        averageInstallment: Math.round(averageInstallment),
        totalAmount: Math.round(totalAmount),
        totalInterest: Math.round(totalInterest),
        installments,
      };
    });

    setResults(simulationResults.sort((a, b) => a.firstInstallment - b.firstInstallment));
    toast.success("Simulação realizada com sucesso!");
  };

  const handleSaveSimulation = async (bankKey: string) => {
    const result = results.find(r => r.bank === bankKey);
    if (!result) return;

    const propertyValue = Math.round(parseFloat(simulationData.propertyValue) * 100);
    const downPayment = Math.round(parseFloat(simulationData.downPayment) * 100);
    const estimatedValue = leadData.estimatedValue ? Math.round(parseFloat(leadData.estimatedValue) * 100) : null;

    await createSimulationMutation.mutateAsync({
      // Lead data
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      propertyType: leadData.propertyType || null,
      desiredLocation: leadData.desiredLocation || null,
      estimatedValue,
      
      // Simulation data
      propertyValue,
      downPayment,
      financedAmount: propertyValue - downPayment,
      termMonths: parseInt(simulationData.termYears) * 12,
      amortizationSystem: simulationData.amortizationSystem,
      selectedBank: result.bankName,
      interestRate: result.rate.toString(),
      
      // Results
      firstInstallment: result.firstInstallment * 100,
      lastInstallment: result.lastInstallment * 100,
      averageInstallment: result.averageInstallment * 100,
      totalAmount: result.totalAmount * 100,
      totalInterest: result.totalInterest * 100,
    });

    setSelectedBank(bankKey);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <Calculator className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Simulador de Financiamento Imobiliário
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Simule seu financiamento com as taxas dos principais bancos e descubra a melhor opção para você
          </p>
        </div>

        {step === "lead" ? (
          // STEP 1: Lead Capture Form
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-amber-600" />
                Seus Dados
              </CardTitle>
              <CardDescription>
                Para começar a simulação, precisamos de algumas informações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={leadData.name}
                        onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={leadData.email}
                        onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone/WhatsApp *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="phone"
                        placeholder="(61) 99999-9999"
                        value={leadData.phone}
                        onChange={(e) => setLeadData({ ...leadData, phone: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="propertyType">Tipo de Imóvel Desejado</Label>
                    <Select
                      value={leadData.propertyType}
                      onValueChange={(value) => setLeadData({ ...leadData, propertyType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="casa">Casa</SelectItem>
                        <SelectItem value="apartamento">Apartamento</SelectItem>
                        <SelectItem value="cobertura">Cobertura</SelectItem>
                        <SelectItem value="terreno">Terreno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Localidade Preferida</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Select
                        value={leadData.desiredLocation}
                        onValueChange={(value) => setLeadData({ ...leadData, desiredLocation: value })}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Vicente Pires">Vicente Pires</SelectItem>
                          <SelectItem value="Águas Claras">Águas Claras</SelectItem>
                          <SelectItem value="Park Way">Park Way</SelectItem>
                          <SelectItem value="Arniqueiras">Arniqueiras</SelectItem>
                          <SelectItem value="Sudoeste">Sudoeste</SelectItem>
                          <SelectItem value="Guará">Guará</SelectItem>
                          <SelectItem value="Taguatinga">Taguatinga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Valor Estimado do Imóvel</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <Input
                        id="estimatedValue"
                        type="number"
                        placeholder="500000"
                        value={leadData.estimatedValue}
                        onChange={(e) => setLeadData({ ...leadData, estimatedValue: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" size="lg">
                  Continuar para Simulação
                  <Calculator className="ml-2 w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          // STEP 2: Simulation
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-600" />
                  Dados do Financiamento
                </CardTitle>
                <CardDescription>
                  Informe os valores para calcular as parcelas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="propertyValue">Valor do Imóvel</Label>
                    <Input
                      id="propertyValue"
                      type="number"
                      placeholder="500000"
                      value={simulationData.propertyValue}
                      onChange={(e) => setSimulationData({ ...simulationData, propertyValue: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="downPayment">Valor da Entrada</Label>
                    <Input
                      id="downPayment"
                      type="number"
                      placeholder="100000"
                      value={simulationData.downPayment}
                      onChange={(e) => setSimulationData({ ...simulationData, downPayment: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="termYears">Prazo (anos)</Label>
                    <Select
                      value={simulationData.termYears}
                      onValueChange={(value) => setSimulationData({ ...simulationData, termYears: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 anos</SelectItem>
                        <SelectItem value="15">15 anos</SelectItem>
                        <SelectItem value="20">20 anos</SelectItem>
                        <SelectItem value="25">25 anos</SelectItem>
                        <SelectItem value="30">30 anos</SelectItem>
                        <SelectItem value="35">35 anos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="system">Sistema</Label>
                    <Select
                      value={simulationData.amortizationSystem}
                      onValueChange={(value: "SAC" | "PRICE") => setSimulationData({ ...simulationData, amortizationSystem: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAC">SAC (parcelas decrescentes)</SelectItem>
                        <SelectItem value="PRICE">PRICE (parcelas fixas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSimulate} className="w-full mt-6 bg-amber-600 hover:bg-amber-700" size="lg">
                  <Calculator className="mr-2 w-4 h-4" />
                  Simular Financiamento
                </Button>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((result) => (
                  <Card key={result.bank} className={`relative ${selectedBank === result.bank ? "ring-2 ring-amber-500" : ""}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-lg">{BANK_RATES[result.bank as keyof typeof BANK_RATES].logo} {result.bankName}</span>
                        {selectedBank === result.bank && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </CardTitle>
                      <CardDescription>Taxa: {result.rate}% ao ano</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-600">
                          {simulationData.amortizationSystem === "SAC" ? "Primeira Parcela" : "Parcela Fixa"}
                        </p>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(result.firstInstallment)}
                        </p>
                      </div>

                      {simulationData.amortizationSystem === "SAC" && (
                        <div>
                          <p className="text-sm text-slate-600">Última Parcela</p>
                          <p className="text-lg font-semibold">
                            {formatCurrency(result.lastInstallment)}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Parcela Média:</span>
                          <span className="font-semibold">{formatCurrency(result.averageInstallment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total a Pagar:</span>
                          <span className="font-semibold">{formatCurrency(result.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Total de Juros:</span>
                          <span className="font-semibold text-red-600">{formatCurrency(result.totalInterest)}</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleSaveSimulation(result.bank)}
                        className="w-full"
                        variant={selectedBank === result.bank ? "default" : "outline"}
                        disabled={createSimulationMutation.isLoading}
                      >
                        {selectedBank === result.bank ? "Simulação Salva" : "Escolher Este Banco"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
