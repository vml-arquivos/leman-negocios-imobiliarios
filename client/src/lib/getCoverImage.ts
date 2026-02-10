export function getCoverImage(property: any): string {
  const imgs = property?.images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (typeof first === "string") return first;
    if (first?.url) return first.url;
  }
  // fallback de segurança
  return "/imoveis/padrao.jpg";
}
