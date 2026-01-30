import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Save, Users, Lock } from "lucide-react";
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  getUserPermissions,
} from "@/shared/permissions";

export default function PermissionsControl() {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const { data: users } = trpc.users.getAll.useQuery();
  const updatePermissionsMutation = trpc.users.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissões atualizadas com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar permissões");
    },
  });

  const selectedUser = users?.find((u) => String(u.id) === selectedUserId);
  const rolePermissions = selectedUser
    ? ROLE_PERMISSIONS[selectedUser.role] || []
    : [];
  const userCustomPermissions = selectedUser?.permissions || [];

  const allPermissions = Object.values(PERMISSIONS);

  // Agrupar permissões por categoria
  const permissionsByCategory = {
    "Usuários": allPermissions.filter((p) => p.startsWith("users.")),
    "Imóveis": allPermissions.filter((p) => p.startsWith("properties.")),
    "Leads": allPermissions.filter((p) => p.startsWith("leads.")),
    "Clientes": allPermissions.filter((p) => p.startsWith("clients.")),
    "Analytics": allPermissions.filter((p) => p.startsWith("analytics.")),
    "Configurações": allPermissions.filter((p) => p.startsWith("settings.")),
    "Blog": allPermissions.filter((p) => p.startsWith("blog.")),
    "Financeiro": allPermissions.filter((p) => p.startsWith("financial.")),
    "Logs": allPermissions.filter((p) => p.startsWith("logs.")),
  };

  const handlePermissionToggle = (permission: string) => {
    if (customPermissions.includes(permission)) {
      setCustomPermissions(customPermissions.filter((p) => p !== permission));
    } else {
      setCustomPermissions([...customPermissions, permission]);
    }
  };

  const handleSave = () => {
    if (!selectedUserId) {
      toast.error("Selecione um usuário");
      return;
    }

    updatePermissionsMutation.mutate({
      userId: Number(selectedUserId),
      permissions: customPermissions,
    });
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users?.find((u) => String(u.id) === userId);
    setCustomPermissions(user?.permissions || []);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Controle de Permissões</h1>
              <p className="text-muted-foreground">
                Gerencie permissões customizadas por usuário
              </p>
            </div>
          </div>
        </div>

        {/* User Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Usuário</CardTitle>
            <CardDescription>
              Escolha o usuário para gerenciar permissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário" />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    <div className="flex items-center gap-2">
                      <span>{user.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedUser && (
          <>
            {/* Role Permissions (Read-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Permissões do Role: {ROLE_LABELS[selectedUser.role]}
                </CardTitle>
                <CardDescription>
                  Estas permissões são herdadas do role e não podem ser removidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rolePermissions.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center space-x-2 p-3 bg-muted rounded-lg"
                    >
                      <Checkbox checked disabled />
                      <Label className="text-sm font-normal">
                        {PERMISSION_LABELS[permission]}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Permissões Customizadas
                </CardTitle>
                <CardDescription>
                  Adicione permissões extras além das do role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(permissionsByCategory).map(
                  ([category, permissions]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        {category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {permissions.map((permission) => {
                          const isRolePermission =
                            rolePermissions.includes(permission);
                          const isCustomPermission =
                            customPermissions.includes(permission);
                          const isChecked =
                            isRolePermission || isCustomPermission;

                          return (
                            <div
                              key={permission}
                              className={`flex items-center space-x-2 p-3 rounded-lg border ${
                                isRolePermission
                                  ? "bg-muted border-muted"
                                  : "bg-background"
                              }`}
                            >
                              <Checkbox
                                id={permission}
                                checked={isChecked}
                                disabled={isRolePermission}
                                onCheckedChange={() =>
                                  handlePermissionToggle(permission)
                                }
                              />
                              <Label
                                htmlFor={permission}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {PERMISSION_LABELS[permission]}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updatePermissionsMutation.isPending}
                size="lg"
              >
                <Save className="h-4 w-4 mr-2" />
                {updatePermissionsMutation.isPending
                  ? "Salvando..."
                  : "Salvar Permissões"}
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
