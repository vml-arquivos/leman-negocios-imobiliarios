import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, ExternalLink, MessageSquare, Phone, Mail, Building, Zap } from "lucide-react";
import { toast } from "sonner";

interface NextActionCardProps {
  leadId: number;
}

const urgencyVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  baixa: "secondary",
  media: "outline",
  alta: "default",
  urgente: "destructive",
};

const urgencyLabel: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const channelIcon: Record<string, React.ElementType> = {
  whatsapp: MessageSquare,
  email: Mail,
  phone: Phone,
  visit: Building,
  internal: Zap,
};

export default function NextActionCard({ leadId }: NextActionCardProps) {
  const { data, isLoading, error } = trpc.leads.nextAction.useQuery(
    { leadId },
    { enabled: !!leadId }
  );

  if (isLoading) {
    return (
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const Icon = channelIcon[data.channel] ?? Zap;

  const copyMessage = () => {
    if (data.message) {
      navigator.clipboard.writeText(data.message);
      toast.success("Mensagem copiada!");
    }
  };

  const openWhatsApp = () => {
    if (data.whatsappUrl) {
      window.open(data.whatsappUrl, "_blank");
    }
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-orange-400" />
          Próxima Ação
        </CardTitle>
        <Badge variant={urgencyVariant[data.urgency]}>
          {urgencyLabel[data.urgency]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2">
          <Icon className="h-4 w-4 mt-0.5 text-white/60 flex-shrink-0" />
          <p className="text-sm font-medium">{data.action}</p>
        </div>

        {data.message && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <p className="text-xs text-white/60 mb-1">Mensagem sugerida:</p>
            <p className="text-sm text-white/80 leading-relaxed">{data.message}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {data.message && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-white/10 hover:bg-white/10"
              onClick={copyMessage}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar mensagem
            </Button>
          )}
          {data.whatsappUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
              onClick={openWhatsApp}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Abrir WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
