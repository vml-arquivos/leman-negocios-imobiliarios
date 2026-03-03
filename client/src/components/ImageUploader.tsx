import { useState, useCallback, useRef } from "react";
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
import { Button } from "@/components/ui/button";
import { Upload, X, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";

export interface ImageFile {
  id: string; // string único para o dnd-kit
  dbId?: number; // id do banco (para imagens já salvas)
  url: string;
  file?: File;
  isPrimary?: boolean;
  displayOrder?: number;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxImages?: number;
}

// ─── Item arrastável individual ───────────────────────────────────────────────
function SortableImageItem({
  image,
  index,
  onRemove,
  onSetPrimary,
}: {
  image: ImageFile;
  index: number;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
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
    zIndex: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 transition-colors ${
        image.isPrimary
          ? "border-yellow-500 ring-2 ring-yellow-500/20"
          : "border-border hover:border-primary/40"
      }`}
    >
      {/* Imagem */}
      <div className="aspect-video bg-muted">
        <img
          src={image.url}
          alt={`Imagem ${index + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {/* Overlay de controles ao hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
        <button
          type="button"
          onClick={() => onSetPrimary(image.id)}
          className={`p-2 rounded-lg transition-colors ${
            image.isPrimary
              ? "bg-yellow-500 hover:bg-yellow-600"
              : "bg-white/20 hover:bg-white/30"
          }`}
          title={image.isPrimary ? "Imagem principal" : "Definir como principal"}
        >
          <Star
            className={`w-5 h-5 ${
              image.isPrimary ? "text-white fill-white" : "text-white"
            }`}
          />
        </button>

        {/* Remover */}
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          title="Remover imagem"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Badge: Principal */}
      {image.isPrimary && (
        <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1 pointer-events-none">
          <Star className="w-3 h-3 fill-white" />
          Principal
        </div>
      )}

      {/* Badge: Número de ordem */}
      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
        #{index + 1}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ImageUploader({
  images,
  onChange,
  maxImages = 20,
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Drag-and-drop de zona de upload ──
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [images]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
      // Limpar input para permitir re-seleção do mesmo arquivo
      e.target.value = "";
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem válida`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máx 10MB)`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      toast.error(`Máximo de ${maxImages} imagens permitidas`);
      return;
    }

    const newImages: ImageFile[] = validFiles.map((file, index) => ({
      id: `new-${Date.now()}-${index}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
      displayOrder: images.length + index,
      isPrimary: images.length === 0 && index === 0,
    }));

    onChange([...images, ...newImages]);
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} imagem(ns) adicionada(s)`);
    }
  };

  const handleRemove = (id: string) => {
    const idx = images.findIndex((img) => img.id === id);
    if (idx === -1) return;

    // Revogar URL de objeto para liberar memória
    if (images[idx].file) {
      URL.revokeObjectURL(images[idx].url);
    }

    const newImages = images.filter((img) => img.id !== id);

    // Se a removida era principal, a primeira vira principal
    if (images[idx].isPrimary && newImages.length > 0) {
      newImages[0] = { ...newImages[0], isPrimary: true };
    }

    onChange(
      newImages.map((img, i) => ({ ...img, displayOrder: i }))
    );
    toast.success("Imagem removida");
  };

  const handleSetPrimary = (id: string) => {
    const updated = images.map((img) => ({
      ...img,
      isPrimary: img.id === id,
    }));
    onChange(updated);
    toast.success("Imagem principal definida");
  };

  // ── Handlers do dnd-kit ──
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex).map((img, i) => ({
      ...img,
      displayOrder: i,
    }));
    onChange(reordered);
  };

  const activeImage = activeId ? images.find((img) => img.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Zona de upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/30"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-base font-medium mb-1">
          Clique para selecionar ou arraste imagens aqui
        </p>
        <p className="text-sm text-muted-foreground">
          Máximo {maxImages} imagens · JPG, PNG, WebP · até 10 MB cada
        </p>
      </div>

      {/* Grid de imagens com drag-and-drop */}
      {images.length > 0 && (
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
              items={images.map((img) => img.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    onRemove={handleRemove}
                    onSetPrimary={handleSetPrimary}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Overlay enquanto arrasta */}
            <DragOverlay>
              {activeImage ? (
                <div className="rounded-lg overflow-hidden border-2 border-primary shadow-2xl rotate-2 opacity-95">
                  <div className="aspect-video bg-muted w-40">
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
      )}
    </div>
  );
}
