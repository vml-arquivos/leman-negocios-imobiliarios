import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, X, Star, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface PropertyImageUploadProps {
  propertyId: number;
  onUploadComplete?: () => void;
}

export default function PropertyImageUpload({ propertyId, onUploadComplete }: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragSrcId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: images, isLoading } = trpc.propertyImages.list.useQuery({ propertyId });

  const uploadFileMutation = trpc.propertyImages.uploadFile.useMutation({
    onSuccess: () => { utils.propertyImages.list.invalidate({ propertyId }); onUploadComplete?.(); },
    onError: (e) => toast.error(`Erro ao enviar imagem: ${e.message}`),
  });

  const deleteMutation = trpc.propertyImages.delete.useMutation({
    onSuccess: () => { utils.propertyImages.list.invalidate({ propertyId }); toast.success("Imagem removida!"); },
  });

  const setMainMutation = trpc.propertyImages.setMain.useMutation({
    onSuccess: () => { utils.propertyImages.list.invalidate({ propertyId }); toast.success("Imagem principal definida!"); },
  });

  const reorderMutation = trpc.propertyImages.reorder.useMutation({
    onSuccess: () => utils.propertyImages.list.invalidate({ propertyId }),
    onError: () => toast.error("Erro ao reordenar imagens"),
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const total = files.length;
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const allowedMimes = ["image/png","image/jpeg","image/webp","image/tiff","application/tiff"];
        const allowedExts = [".png",".jpg",".jpeg",".webp",".tif",".tiff"];
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
          toast.error(`${file.name}: tipo invalido (PNG, JPG, WebP, TIFF)`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: maximo 5MB`); continue; }
        const fileData = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        await uploadFileMutation.mutateAsync({
          propertyId, filename: file.name,
          contentType: file.type || "image/jpeg",
          fileData,
          isMain: (!images || images.length === 0) && i === 0,
        });
        setUploadProgress(Math.round(((i + 1) / total) * 100));
      }
      toast.success(`${total} imagem(ns) enviada(s)!`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag-and-drop reorder handlers
  const handleDragStart = (e: React.DragEvent, id: number) => {
    dragSrcId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    setDragOverId(null);
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId || !images) return;
    const ids = (images as any[]).map((img) => img.id);
    const si = ids.indexOf(srcId);
    const ti = ids.indexOf(targetId);
    if (si === -1 || ti === -1) return;
    const newIds = [...ids];
    newIds.splice(si, 1);
    newIds.splice(ti, 0, srcId);
    reorderMutation.mutate({ propertyId, orderedIds: newIds });
  };
  const handleDragEnd = () => { dragSrcId.current = null; setDragOverId(null); };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFileSelect(e.dataTransfer.files); }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Enviando... {uploadProgress}%</p>
            <div className="w-48 bg-muted rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Clique para selecionar imagens ou arraste aqui</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WebP, TIFF — maximo 5MB por arquivo</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/tiff,.tif,.tiff,.png,.jpg,.jpeg,.webp"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Image grid with drag-and-drop reorder */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : images && images.length > 0 ? (
        <div>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <GripVertical className="h-3 w-3" /> Arraste para reordenar · Estrela define imagem principal
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {(images as any[]).map((image) => (
              <div
                key={image.id}
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
                onDragOver={(e) => handleDragOver(e, image.id)}
                onDrop={(e) => handleDrop(e, image.id)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                  image.is_main
                    ? "border-primary shadow-md"
                    : dragOverId === image.id
                    ? "border-primary/60 scale-105"
                    : "border-transparent hover:border-border"
                }`}
              >
                <div className="aspect-[4/3] bg-muted">
                  <img
                    src={image.url}
                    alt={image.caption || `Imagem ${image.id}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>
                {/* Drag handle indicator */}
                <div className="absolute top-1 left-1 bg-black/50 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-3 w-3 text-white" />
                </div>
                {/* Principal badge */}
                {image.is_main && (
                  <div className="absolute top-1 right-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                    Principal
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.is_main && (
                    <button
                      onClick={() => setMainMutation.mutate({ imageId: image.id, propertyId })}
                      disabled={setMainMutation.isPending}
                      title="Definir como principal"
                      className="bg-yellow-400 hover:bg-yellow-500 text-black p-1.5 rounded-full transition-colors"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Remover esta imagem?")) {
                        deleteMutation.mutate({ imageId: image.id, propertyId });
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    title="Remover imagem"
                    className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhuma imagem cadastrada ainda.
        </p>
      )}
    </div>
  );
}
