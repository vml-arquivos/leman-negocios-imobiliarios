import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

type Row = {
  month: number;
  payment: number;
  interest: number;
  amortization: number;
  balance: number;
};

function brl(n: number) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(2)}%`;
}

/**
 * SAC:
 * amortização constante = PV / n
 * juros do mês = saldo * i
 * parcela = amortização + juros
 */
function buildSAC(principal: number, monthlyRate: number, months: number): Row[] {
  const rows: Row[] = [];
  const amort = principal / months;
  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const payment = amort + interest;
    balance = Math.max(0, balance - amort);
    rows.push({ month: m, payment, interest, amortization: amort, balance });
  }
  return rows;
}

/**
 * PRICE:
 * parcela fixa = PV * [i(1+i)^n] / [(1+i)^n - 1]
 * juros do mês = saldo * i
 * amortização = parcela - juros
 */
function buildPRICE(principal: number, monthlyRate: number, months: number): Row[] {
  const rows: Row[] = [];
  const pow = Math.pow(1 + monthlyRate, months);
  const payment =
    monthlyRate === 0 ? principal / months : (principal * (monthlyRate * pow)) / (pow - 1);

  let balance = principal;

  for (let m = 1; m <= months; m++) {
    const interest = balance * monthlyRate;
    const amort = payment - interest;
    balance = Math.max(0, balance - amort);
    rows.push({ month: m, payment, interest, amortization: amort, balance });
  }

  return rows;
}

function summarize(rows: Row[]) {
  const totalPayment = rows.reduce((acc, r) => acc + r.payment, 0);
  const totalInterest = rows.reduce((acc, r) => acc + r.interest, 0);
  const first = rows[0]?.payment ?? 0;
  const last = rows[rows.length - 1]?.payment ?? 0;
  return { totalPayment, totalInterest, first, last };
}

export default function FinancingComparator() {
  const [propertyValue, setPropertyValue] = useState<number>(600000);
  const [downPayment, setDownPayment] = useState<number>(120000);
  const [termMonths, setTermMonths] = useState<number>(360);
  const [annualRate, setAnnualRate] = useState<number>(10.5);
  const [show, setShow] = useState(false);

  const principal = useMemo(() => Math.max(0, propertyValue - downPayment), [propertyValue, downPayment]);

  const monthlyRate = useMemo(() => {
    // nominal anual -> nominal mensal (UX simples)
    const a = annualRate / 100;
    return a / 12;
  }, [annualRate]);

  const sacRows = useMemo(
    () => (show && principal > 0 && termMonths > 0 ? buildSAC(principal, monthlyRate, termMonths) : []),
    [show, principal, monthlyRate, termMonths]
  );
  const priceRows = useMemo(
    () => (show && principal > 0 && termMonths > 0 ? buildPRICE(principal, monthlyRate, termMonths) : []),
    [show, principal, monthlyRate, termMonths]
  );

  const sacSum = useMemo(() => summarize(sacRows), [sacRows]);
  const priceSum = useMemo(() => summarize(priceRows), [priceRows]);

  const chartData = useMemo(() => {
    if (!show) return [];
    const maxPoints = 120;
    const step = Math.max(1, Math.floor(termMonths / maxPoints));

    const data: any[] = [];
    for (let i = 0; i < termMonths; i += step) {
      const sac = sacRows[i];
      const pri = priceRows[i];
      if (!sac || !pri) continue;
      data.push({
        month: sac.month,
        sac_payment: sac.payment,
        price_payment: pri.payment,
        sac_balance: sac.balance,
        price_balance: pri.balance,
      });
    }

    const lastSac = sacRows[sacRows.length - 1];
    const lastPri = priceRows[priceRows.length - 1];
    if (lastSac && lastPri && data[data.length - 1]?.month !== termMonths) {
      data.push({
        month: termMonths,
        sac_payment: lastSac.payment,
        price_payment: lastPri.payment,
        sac_balance: lastSac.balance,
        price_balance: lastPri.balance,
      });
    }
    return data;
  }, [show, sacRows, priceRows, termMonths]);

  const invalid =
    propertyValue <= 0 ||
    downPayment < 0 ||
    downPayment >= propertyValue ||
    termMonths <= 0 ||
    annualRate < 0;

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Comparador SAC vs PRICE</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Valor do imóvel (R$)</Label>
            <Input type="number" value={propertyValue} onChange={(e) => setPropertyValue(Number(e.target.value))} min={0} />
          </div>

          <div className="space-y-2">
            <Label>Entrada (R$)</Label>
            <Input type="number" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} min={0} />
          </div>

          <div className="space-y-2">
            <Label>Prazo (meses)</Label>
            <Input type="number" value={termMonths} onChange={(e) => setTermMonths(Number(e.target.value))} min={1} />
          </div>

          <div className="space-y-2">
            <Label>Taxa anual (%)</Label>
            <Input type="number" value={annualRate} onChange={(e) => setAnnualRate(Number(e.target.value))} min={0} step={0.01} />
          </div>

          <div className="md:col-span-4 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
            <div className="text-sm">
              <div><span className="text-muted-foreground">Valor financiado: </span><b>{brl(principal)}</b></div>
              <div><span className="text-muted-foreground">Taxa mensal (aprox.): </span><b>{pct(monthlyRate * 100)}</b></div>
            </div>

            <Button onClick={() => setShow(true)} disabled={invalid} className="rounded-2xl">
              Calcular comparativo
            </Button>
          </div>

          {invalid && (
            <div className="md:col-span-4 text-sm text-destructive">
              Ajuste os valores: entrada deve ser menor que o valor do imóvel e prazo/taxa devem ser válidos.
            </div>
          )}
        </CardContent>
      </Card>

      {show && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Resumo — SAC</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>1ª parcela</span><b>{brl(sacSum.first)}</b></div>
                <div className="flex justify-between"><span>Última parcela</span><b>{brl(sacSum.last)}</b></div>
                <div className="flex justify-between"><span>Juros totais</span><b>{brl(sacSum.totalInterest)}</b></div>
                <div className="flex justify-between"><span>Total pago</span><b>{brl(sacSum.totalPayment)}</b></div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader><CardTitle>Resumo — PRICE</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Parcela fixa</span><b>{brl(priceSum.first)}</b></div>
                <div className="flex justify-between"><span>Última parcela</span><b>{brl(priceSum.last)}</b></div>
                <div className="flex justify-between"><span>Juros totais</span><b>{brl(priceSum.totalInterest)}</b></div>
                <div className="flex justify-between"><span>Total pago</span><b>{brl(priceSum.totalPayment)}</b></div>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Comparativo visual</CardTitle></CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => brl(Number(v)).replace("R$", "").trim()} />
                  <Tooltip formatter={(v: any) => brl(Number(v))} labelFormatter={(l) => `Mês ${l}`} />
                  <Legend />
                  <Line type="monotone" dataKey="sac_payment" name="SAC — Parcela" dot={false} />
                  <Line type="monotone" dataKey="price_payment" name="PRICE — Parcela" dot={false} />
                  <Line type="monotone" dataKey="sac_balance" name="SAC — Saldo" dot={false} />
                  <Line type="monotone" dataKey="price_balance" name="PRICE — Saldo" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader><CardTitle>Tabelas completas</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="sac">
                <TabsList className="rounded-2xl">
                  <TabsTrigger value="sac">SAC</TabsTrigger>
                  <TabsTrigger value="price">PRICE</TabsTrigger>
                </TabsList>

                <TabsContent value="sac" className="mt-4">
                  <div className="max-h-[420px] overflow-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Juros</TableHead>
                          <TableHead>Amortização</TableHead>
                          <TableHead>Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sacRows.map((r) => (
                          <TableRow key={r.month}>
                            <TableCell>{r.month}</TableCell>
                            <TableCell>{brl(r.payment)}</TableCell>
                            <TableCell>{brl(r.interest)}</TableCell>
                            <TableCell>{brl(r.amortization)}</TableCell>
                            <TableCell>{brl(r.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="price" className="mt-4">
                  <div className="max-h-[420px] overflow-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Juros</TableHead>
                          <TableHead>Amortização</TableHead>
                          <TableHead>Saldo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {priceRows.map((r) => (
                          <TableRow key={r.month}>
                            <TableCell>{r.month}</TableCell>
                            <TableCell>{brl(r.payment)}</TableCell>
                            <TableCell>{brl(r.interest)}</TableCell>
                            <TableCell>{brl(r.amortization)}</TableCell>
                            <TableCell>{brl(r.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
