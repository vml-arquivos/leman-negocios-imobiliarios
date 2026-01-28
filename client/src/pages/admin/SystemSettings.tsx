import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Save, Bell, Zap, Database, Mail } from "lucide-react";

export default function SystemSettings() {
  const { data: settings, isLoading } = trpc.systemSettings.getAll.useQuery();
  const updateMutation = trpc.systemSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar configurações");
    },
  });

  const [formData, setFormData] = useState({
    enableNotifications: settings?.enable_notifications ?? true,
    enableAiFeatures: settings?.enable_ai_features ?? true,
    contactEmail: settings?.contact_email || "contato@lemannegocios.com.br",
    contactPhone: settings?.contact_phone || "(61) 99868-7245",
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure as notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Notificações</Label>
              <p className="text-sm text-muted-foreground">
                Receba notificações de novos leads e interações
              </p>
            </div>
            <Switch
              checked={formData.enableNotifications}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Inteligência Artificial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Inteligência Artificial
          </CardTitle>
          <CardDescription>
            Configure os recursos de IA do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Habilitar Recursos de IA</Label>
              <p className="text-sm text-muted-foreground">
                Ative sugestões inteligentes, análise de leads e chatbot
              </p>
            </div>
            <Switch
              checked={formData.enableAiFeatures}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, enableAiFeatures: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Informações de Contato
          </CardTitle>
          <CardDescription>
            Configure os dados de contato exibidos no site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Email de Contato</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
              placeholder="contato@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactPhone">Telefone de Contato</Label>
            <Input
              id="contactPhone"
              type="tel"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              placeholder="(00) 00000-0000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Database Info (Read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Informações do Banco de Dados
          </CardTitle>
          <CardDescription>
            Informações sobre o banco de dados (somente leitura)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo:</p>
              <p className="font-medium">PostgreSQL (Supabase)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status:</p>
              <p className="font-medium text-green-600">Conectado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
