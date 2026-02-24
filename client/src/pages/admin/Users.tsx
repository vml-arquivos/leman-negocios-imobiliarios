import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, Edit, Trash2, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Users() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "gerente" | "corretor" | "atendente" | "user",
    phone: "",
  });

  const utils = trpc.useUtils();
  const { data: users, isLoading, error } = trpc.users.list.useQuery();

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      utils.users.list.invalidate();
      setIsDialogOpen(false);
      setFormData({ name: "", email: "", password: "", role: "user", phone: "" });
    },
    onError: (err) => {
      toast.error(`Erro ao criar usuário: ${err.message}`);
    },
  });

  const filteredUsers = users?.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createMutation.mutate(formData);
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-slate-600 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 gap-2" onClick={() => setIsDialogOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Falha ao carregar usuários: {error.message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>{users?.length || 0} usuários cadastrados</CardDescription>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Carregando...</div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || "—"}</TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role === "admin" ? "Administrador" : user.role === "gerente" ? "Gerente" : user.role === "corretor" ? "Corretor" : "Usuário"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-500">
              {searchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="u-name">Nome *</Label>
              <Input id="u-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required minLength={2} />
            </div>
            <div>
              <Label htmlFor="u-email">Email *</Label>
              <Input id="u-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div>
              <Label htmlFor="u-password">Senha * (mín. 8 caracteres)</Label>
              <Input id="u-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
            </div>
            <div>
              <Label htmlFor="u-role">Função</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v as typeof formData.role })}>
                <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="corretor">Corretor</SelectItem>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="u-phone">Telefone (opcional)</Label>
              <Input id="u-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Usuário
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
