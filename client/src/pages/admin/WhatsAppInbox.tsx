import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Phone, User, RefreshCw, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function priorityColor(score: number | null) {
  if (!score) return "secondary";
  if (score >= 80) return "destructive";
  if (score >= 60) return "default";
  if (score >= 40) return "outline";
  return "secondary";
}

function priorityLabel(score: number | null) {
  if (!score) return "Novo";
  if (score >= 80) return "Urgente";
  if (score >= 60) return "Alta";
  if (score >= 40) return "Média";
  return "Baixa";
}

export default function WhatsAppInbox() {
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  const { data: conversations = [], refetch: refetchConversations, isLoading } =
    trpc.whatsappInbox.listConversations.useQuery({ limit: 50 }, { refetchInterval: 30_000 });

  const { data: thread = [], refetch: refetchThread } =
    trpc.whatsappInbox.getThread.useQuery(
      { phone: selectedPhone!, limit: 100 },
      { enabled: !!selectedPhone, refetchInterval: 15_000 }
    );

  const markProcessed = trpc.whatsappInbox.markProcessed.useMutation({
    onSuccess: () => { refetchThread(); refetchConversations(); },
  });

  const selectedConv = conversations.find((c: any) => c.phone === selectedPhone);

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden rounded-lg border border-white/10">
      {/* Sidebar — lista de conversas */}
      <div className="w-80 flex-shrink-0 border-r border-white/10 flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-400" />
            <h2 className="font-semibold text-sm">WhatsApp Inbox</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => refetchConversations()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {isLoading && (
            <p className="p-4 text-sm text-white/50">Carregando conversas…</p>
          )}
          {!isLoading && conversations.length === 0 && (
            <p className="p-4 text-sm text-white/50">Nenhuma mensagem recebida ainda.</p>
          )}
          {conversations.map((conv: any) => (
            <button
              key={conv.phone}
              className={`w-full text-left p-3 hover:bg-white/5 transition-colors border-b border-white/5 ${
                selectedPhone === conv.phone ? "bg-white/10" : ""
              }`}
              onClick={() => setSelectedPhone(conv.phone)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.lead_name || conv.phone}
                    </p>
                    <p className="text-xs text-white/50 truncate">{conv.phone}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {Number(conv.pending_count) > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                      {conv.pending_count}
                    </Badge>
                  )}
                  <Badge variant={priorityColor(conv.lead_score) as any} className="text-xs">
                    {priorityLabel(conv.lead_score)}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1 truncate">{conv.last_message}</p>
              <p className="text-xs text-white/30 mt-0.5">
                {conv.last_at
                  ? formatDistanceToNow(new Date(conv.last_at), { addSuffix: true, locale: ptBR })
                  : ""}
              </p>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 flex flex-col">
        {!selectedPhone ? (
          <div className="flex-1 flex items-center justify-center text-white/30">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header da conversa */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-500/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {selectedConv?.lead_name || selectedPhone}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-white/50">
                    <Phone className="h-3 w-3" />
                    {selectedPhone}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedConv?.lead_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() =>
                      window.open(`/admin/clients?leadId=${selectedConv.lead_id}`, "_blank")
                    }
                  >
                    Ver no CRM
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    window.open(`https://wa.me/${selectedPhone.replace(/\D/g, "")}`, "_blank")
                  }
                >
                  Abrir WhatsApp
                </Button>
              </div>
            </div>

            {/* Thread de mensagens */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {thread.length === 0 && (
                  <p className="text-sm text-white/40 text-center py-8">
                    Nenhuma mensagem nesta conversa.
                  </p>
                )}
                {thread.map((msg: any) => (
                  <div key={msg.id} className="flex gap-2 items-start">
                    <div className="flex-1 bg-white/5 rounded-lg p-3 border border-white/10">
                      <p className="text-sm">{msg.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-white/30">
                          {msg.created_at
                            ? formatDistanceToNow(new Date(msg.created_at), {
                                addSuffix: true,
                                locale: ptBR,
                              })
                            : ""}
                        </p>
                        {!msg.processed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-white/40 hover:text-green-400"
                            title="Marcar como processado"
                            onClick={() => markProcessed.mutate({ messageId: msg.id })}
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {msg.processed && (
                          <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </div>
    </div>
  );
}
