import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Upload, X, Star, Loader2, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PropertyImageUploadProps {
  propertyId: number;
  onUploadComplete?: () => void;
}

// ─── Item arrastável individual ───────────────────────────────────────────────
function SortableImageItem({
  image,
  index,
  onSetMain,
  onDelete,
  isSettingMain,
  isDeleting,
}: {
  image: any;
  index: number;
  onSetMain: (imageId: number) => void;
  onDelete: (imageId: number) => void;
  isSettingMain: boolean;
  isDeleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
        image.is_main
          ? "border-primary shadow-md ring-2 ring-primary/20"
          : "border-transparent hover:border-border"
      }`}
    >
      {/* Imagem */}
      <div className="aspect-[4/3] bg-muted">
        <img
          src={image.url}
          alt={image.caption || `Imagem ${index + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Overlay de controles ao hover */}
      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Alça de arrastar */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-lg cursor-grab active:cursor-grabbing touch-none"
          title="Arrastar para reordenar"
        >
          <GripVertical className="w-5 h-5 text-white" />
        </button>

        {/* Definir como principal */}
        {!image.is_main && (
          <button
            type="button"
            onClick={() => onSetMain(image.id)}
            disabled={isSettingMain}
            title="Definir como principal"
            className="p-2 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-colors disabled:opacity-50"
          >
            <Star className="w-5 h-5 text-black" />
          </button>
        )}

        {/* Remover */}
        <button
          type="button"
          onClick={() => {
            if (confirm("Remover esta imagem?")) {
              onDelete(image.id);
            }
          }}
          disabled={isDeleting}
          title="Remover imagem"
          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Badge: Principal */}
      {image.is_main && (
        <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 pointer-events-none">
          <Star className="w-3 h-3 fill-current" />
          Principal
        </div>
      )}

      {/* Badge: Número de ordem */}
      <div className="absolute top-1.5 right-1.5 bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded pointer-events-none">
        #{index + 1}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function PropertyImageUpload({
  propertyId,
  onUploadComplete,
}: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: images, isLoading } = trpc.propertyImages.list.useQuery({ propertyId });

  const uploadFileMutation = trpc.propertyImages.uploadFile.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      onUploadComplete?.();
    },
    onError: (e) => toast.error(`Erro ao enviar imagem: ${e.message}`),
  });

  const deleteMutation = trpc.propertyImages.delete.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem removida!");
    },
  });

  const setMainMutation = trpc.propertyImages.setMain.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem principal definida!");
    },
  });

  const reorderMutation = trpc.propertyImages.reorder.useMutation({
    onSuccess: () => utils.propertyImages.list.invalidate({ propertyId }),
    onError: () => toast.error("Erro ao reordenar imagens"),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const total = files.length;
      const currentImages = images as any[] | undefined;
      for (let i = 0; i < total; i++) {
        const file = files[i];
        const allowedMimes = [
          "image/png", "image/jpeg", "image/webp",
          "image/tiff", "application/tiff",
        ];
        const allowedExts = [".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"];
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!allowedMimes.includes(file.type) && !allowedExts.includes(ext)) {
          toast.error(`${file.name}: tipo inválido (PNG, JPG, WebP, TIFF)`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name}: máximo 5 MB`);
          continue;
        }
        const fileData = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        await uploadFileMutation.mutateAsync({
          propertyId,
          filename: file.name,
          contentType: file.type || "image/jpeg",
          fileData,
          isMain: (!currentImages || currentImages.length === 0) && i === 0,
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

  // ── Handlers do dnd-kit ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !images) return;

    const imgList = images as any[];
    const oldIndex = imgList.findIndex((img) => img.id === active.id);
    const newIndex = imgList.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(imgList, oldIndex, newIndex);
    reorderMutation.mutate({
      propertyId,
      orderedIds: reordered.map((img) => img.id),
    });
  };

  const activeImage = activeId && images
    ? (images as any[]).find((img) => img.id === activeId)
    : null;

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Enviando... {uploadProgress}%
            </p>
            <div className="w-48 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              Clique para selecionar imagens ou arraste aqui
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WebP, TIFF — máximo 5 MB por arquivo
            </p>
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

      {/* Grid de imagens com drag-and-drop */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : images && (images as any[]).length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-1.5">
            <GripVertical className="h-4 w-4" />
            Arraste pelo ícone <GripVertical className="h-3 w-3 inline" /> para reordenar ·
            Estrela define a imagem principal (capa do card)
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={(images as any[]).map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(images as any[]).map((image, index) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    onSetMain={(imageId) =>
                      setMainMutation.mutate({ imageId, propertyId })
                    }
                    onDelete={(imageId) =>
                      deleteMutation.mutate({ imageId, propertyId })
                    }
                    isSettingMain={setMainMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Overlay enquanto arrasta */}
            <DragOverlay>
              {activeImage ? (
                <div className="rounded-lg overflow-hidden border-2 border-primary shadow-2xl rotate-2 opacity-95">
                  <div className="aspect-[4/3] bg-muted w-36">
                    <img
                      src={activeImage.url}
                      alt="Arrastando"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          Nenhuma imagem cadastrada ainda.
        </p>
      )}
    </div>
  );
}
