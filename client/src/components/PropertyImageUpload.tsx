import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Upload, X, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PropertyImageUploadProps {
  propertyId: number;
  onUploadComplete?: () => void;
}

export default function PropertyImageUpload({ propertyId, onUploadComplete }: PropertyImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: images, isLoading } = trpc.propertyImages.list.useQuery({ propertyId });
  
  const uploadFileMutation = trpc.propertyImages.uploadFile.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
    },
    onError: (error) => {
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    },
  });

  const deleteMutation = trpc.propertyImages.delete.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem removida com sucesso!");
    },
  });

  const setMainMutation = trpc.propertyImages.setMain.useMutation({
    onSuccess: () => {
      utils.propertyImages.list.invalidate({ propertyId });
      toast.success("Imagem principal definida!");
    },
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = files.length;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        
        // Validar tipo de arquivo
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} não é uma imagem válida`);
          continue;
        }

        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} é muito grande (máximo 5MB)`);
          continue;
        }

        // Converter arquivo para base64
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload via tRPC mutation
        await uploadFileMutation.mutateAsync({
          propertyId,
          filename: file.name,
          contentType: file.type,
          fileData,
          isMain: images?.length === 0 && i === 0, // Primeira imagem é principal
        });

        setUploadProgress(((i + 1) / totalFiles) * 100);
      }

      toast.success(`${totalFiles} ${totalFiles === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`);

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast.error("Erro ao fazer upload das imagens");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (imageId: number) => {
    if (!confirm("Tem certeza que deseja remover esta imagem?")) return;
    await deleteMutation.mutateAsync({ propertyId, imageId });
  };

  const handleSetMain = async (imageId: number) => {
    await setMainMutation.mutateAsync({ imageId, propertyId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
        <div className="p-8">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={uploading}
          />
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center ${uploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              {uploading ? (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-primary" />
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {uploading ? "Enviando imagens..." : "Clique para fazer upload"}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              ou arraste e solte suas imagens aqui
              <br />
              <span className="text-xs">PNG, JPG, WEBP até 5MB cada</span>
            </p>
            {uploading && (
              <div className="w-full max-w-xs mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            )}
          </label>
        </div>
      </Card>

      {/* Images Grid */}
      {images && images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.caption || "Imagem do imóvel"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback para imagem quebrada
                    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=Imagem+não+encontrada';
                  }}
                />
                
                {/* Badge de imagem principal */}
                {image.is_main && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Principal
                  </div>
                )}
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant={image.is_main ? "default" : "secondary"}
                    onClick={() => handleSetMain(image.id)}
                    disabled={setMainMutation.isPending}
                    title="Definir como principal"
                  >
                    <Star className={`h-4 w-4 ${image.is_main ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(image.id)}
                    disabled={deleteMutation.isPending}
                    title="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma imagem adicionada ainda.</p>
          <p className="text-sm">Clique no botão acima para fazer upload.</p>
        </div>
      )}
    </div>
  );
}
