import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Phone, Mail, Link, Unlink } from "lucide-react";
import { toast } from "sonner";

function parsePerfil(notes: string | null | undefined): string {
  const m = (notes ?? "").match(/PERFIL_OWNER=(\w+)/);
  return m ? m[1] : "";
}
function mergePerfil(notes: string, perfil: string): string {
  const cleaned = notes.replace(/PERFIL_OWNER=\w+/g, "").trim();
  if (!perfil) return cleaned;
  return cleaned ? `${cleaned}\nPERFIL_OWNER=${perfil}` : `PERFIL_OWNER=${perfil}`;
}

const emptyForm = {
  name: "", cpfCnpj: "", email: "", phone: "", whatsapp: "",
  address: "", city: "", state: "DF", zipCode: "",
  bankName: "", bankAgency: "", bankAccount: "", pixKey: "",
  notes: "", perfil: "",
};

export default function PropertyOwners() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [linkedTab, setLinkedTab] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const utils = trpc.useUtils();

  const { data: owners, isLoading } = trpc.owners.list.useQuery();

  const createOwner = trpc.owners.create.useMutation({
    onSuccess: () => { toast.success("Proprietário cadastrado!"); setIsDialogOpen(false); setFormData(emptyForm); utils.owners.list.invalidate(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const updateOwner = trpc.owners.update.useMutation({
    onSuccess: () => { toast.success("Proprietário atualizado!"); setIsDialogOpen(false); setFormData(emptyForm); setEditingOwner(null); utils.owners.list.invalidate(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const deleteOwner = trpc.owners.delete.useMutation({
    onSuccess: () => { toast.success("Proprietário removido!"); utils.owners.list.invalidate(); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });
  const assignOwner = trpc.properties.assignOwner.useMutation({
    onSuccess: () => { utils.properties.listAdmin.invalidate(); toast.success("Vínculo atualizado!"); },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const linkedProps = trpc.properties.listAdmin.useQuery(
    { ownerId: linkedTab } as any, { enabled: linkedTab !== null }
  );
  const freeProps = trpc.properties.listAdmin.useQuery(
    { ownerId: null } as any, { enabled: linkedTab !== null }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const notes = mergePerfil(formData.notes, formData.perfil);
    const payload = {
      name: formData.name,
      cpfCnpj: formData.cpfCnpj || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      whatsapp: formData.whatsapp || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      bankName: formData.bankName || undefined,
      bankAgency: formData.bankAgency || undefined,
      bankAccount: formData.bankAccount || undefined,
      pixKey: formData.pixKey || undefined,
      notes: notes || undefined,
    };
    if (editingOwner) updateOwner.mutate({ id: editingOwner.id, data: payload });
    else createOwner.mutate(payload);
  };

  const handleEdit = (owner: any) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name ?? "", cpfCnpj: owner.cpfCnpj ?? "",
      email: owner.email ?? "", phone: owner.phone ?? "", whatsapp: owner.whatsapp ?? "",
      address: owner.address ?? "", city: owner.city ?? "", state: owner.state ?? "DF",
      zipCode: owner.zipCode ?? "", bankName: owner.bankName ?? "",
      bankAgency: owner.bankAgency ?? "", bankAccount: owner.bankAccount ?? "",
      pixKey: owner.pixKey ?? "",
      notes: (owner.notes ?? "").replace(/PERFIL_OWNER=\w+/g, "").trim(),
      perfil: parsePerfil(owner.notes),
    });
    setIsDialogOpen(true);
  };

  const perfilLabel: Record<string, string> = { venda: "Venda", locacao: "Locação", ambos: "Venda + Locação", investidor: "Investidor" };
  const filtered = (owners ?? []).filter((o: any) =>
    (o.name ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.email ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.phone ?? "").includes(searchTerm)
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proprietários</h1>
          <p className="text-muted-foreground">Gerencie os proprietários de imóveis</p>
        </div>
        <Button onClick={() => { setEditingOwner(null); setFormData(emptyForm); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Novo Proprietário
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead><TableHead>Perfil</TableHead>
              <TableHead>Telefone</TableHead><TableHead>Email</TableHead>
              <TableHead>Imóveis</TableHead><TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum proprietário encontrado</TableCell></TableRow>
            ) : filtered.map((owner: any) => (
              <TableRow key={owner.id}>
                <TableCell className="font-medium">{owner.name}</TableCell>
                <TableCell>
                  {parsePerfil(owner.notes)
                    ? <Badge variant="secondary">{perfilLabel[parsePerfil(owner.notes)] ?? parsePerfil(owner.notes)}</Badge>
                    : <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>{owner.phone ? <a href={`tel:${owner.phone}`} className="flex items-center gap-1 text-sm hover:text-primary"><Phone className="h-3 w-3" />{owner.phone}</a> : "—"}</TableCell>
                <TableCell>{owner.email ? <a href={`mailto:${owner.email}`} className="flex items-center gap-1 text-sm hover:text-primary"><Mail className="h-3 w-3" />{owner.email}</a> : "—"}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setLinkedTab(linkedTab === owner.id ? null : owner.id)}>
                    <Link className="h-4 w-4 mr-1" />Imóveis
                  </Button>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(owner)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { if (confirm("Remover proprietário?")) deleteOwner.mutate({ id: owner.id }); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {linkedTab !== null && (
        <div className="rounded-md border border-border p-4 space-y-4">
          <h3 className="font-semibold">Imóveis de {(owners ?? []).find((o: any) => o.id === linkedTab)?.name ?? "..."}</h3>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Vinculados</p>
            {(linkedProps.data ?? []).length === 0
              ? <p className="text-sm text-muted-foreground">Nenhum imóvel vinculado.</p>
              : (linkedProps.data ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm">{p.title} <span className="text-muted-foreground">({p.referenceCode ?? `#${p.id}`})</span></span>
                  <Button variant="ghost" size="sm" onClick={() => assignOwner.mutate({ propertyId: p.id, ownerId: null })}>
                    <Unlink className="h-4 w-4 mr-1" />Desvincular
                  </Button>
                </div>
              ))}
          </div>
          <Separator />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sem proprietário (vincular)</p>
            {(freeProps.data ?? []).length === 0
              ? <p className="text-sm text-muted-foreground">Nenhum imóvel disponível.</p>
              : (freeProps.data ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-1 border-b border-border last:border-0">
                  <span className="text-sm">{p.title} <span className="text-muted-foreground">({p.referenceCode ?? `#${p.id}`})</span></span>
                  <Button variant="ghost" size="sm" onClick={() => assignOwner.mutate({ propertyId: p.id, ownerId: linkedTab })}>
                    <Link className="h-4 w-4 mr-1" />Vincular
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOwner ? "Editar Proprietário" : "Novo Proprietário"}</DialogTitle>
            <DialogDescription>Preencha os dados do proprietário</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Perfil do Proprietário *</Label>
              <Select value={formData.perfil} onValueChange={(v) => setFormData({ ...formData, perfil: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="venda">Venda</SelectItem>
                  <SelectItem value="locacao">Locação</SelectItem>
                  <SelectItem value="ambos">Venda + Locação</SelectItem>
                  <SelectItem value="investidor">Investidor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="cpfCnpj">CPF/CNPJ</Label><Input id="cpfCnpj" value={formData.cpfCnpj} onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })} /></div>
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="phone">Telefone</Label><Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} /></div>
            </div>
            <Separator />
            <div><Label htmlFor="address">Endereço</Label><Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1"><Label htmlFor="city">Cidade</Label><Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} /></div>
              <div><Label htmlFor="state">UF</Label><Input id="state" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} maxLength={2} /></div>
              <div><Label htmlFor="zipCode">CEP</Label><Input id="zipCode" value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} /></div>
            </div>
            <Separator />
            <p className="text-sm font-medium">Dados Bancários</p>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="bankName">Banco</Label><Input id="bankName" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} /></div>
              <div><Label htmlFor="pixKey">Chave PIX</Label><Input id="pixKey" value={formData.pixKey} onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="bankAgency">Agência</Label><Input id="bankAgency" value={formData.bankAgency} onChange={(e) => setFormData({ ...formData, bankAgency: e.target.value })} /></div>
              <div><Label htmlFor="bankAccount">Conta</Label><Input id="bankAccount" value={formData.bankAccount} onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })} /></div>
            </div>
            <Separator />
            <div><Label htmlFor="notes">Observações</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={!formData.name || !formData.perfil || createOwner.isPending || updateOwner.isPending}>
                {editingOwner ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
