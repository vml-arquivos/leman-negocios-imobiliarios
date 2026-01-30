#!/usr/bin/env python3
"""
Script para processar logo da Leman Negócios Imobiliários
Mantém o fundo azul marinho original
"""

from PIL import Image
import os

# Caminhos
input_path = "/home/ubuntu/leman-imoveis-novo/logo-original.jpg"
output_dir = "/home/ubuntu/leman-imoveis-novo/client/public"

# Criar diretório se não existir
os.makedirs(output_dir, exist_ok=True)

print("🎨 Processando logo da Leman Negócios Imobiliários...")
print("📌 Cor do fundo: Azul Marinho (#1a1f3c)")

# Carregar imagem original
img = Image.open(input_path)
print(f"✓ Imagem original carregada: {img.size} pixels")

# Converter para RGB se necessário
if img.mode != 'RGB':
    img = img.convert('RGB')

# Cor do fundo azul marinho (extraída da logo)
AZUL_MARINHO = (26, 31, 60)  # #1a1f3c

# 1. Logo principal (header) - 200px de altura
logo_header = img.copy()
aspect_ratio = logo_header.width / logo_header.height
new_height = 200
new_width = int(new_height * aspect_ratio)
logo_header = logo_header.resize((new_width, new_height), Image.Resampling.LANCZOS)
logo_header.save(f"{output_dir}/logo.png", "PNG", optimize=True)
print(f"✓ Logo header salva: {new_width}x{new_height}px ({output_dir}/logo.png)")

# 2. Logo pequena (mobile) - 120px de altura
logo_small = img.copy()
new_height = 120
new_width = int(new_height * aspect_ratio)
logo_small = logo_small.resize((new_width, new_height), Image.Resampling.LANCZOS)
logo_small.save(f"{output_dir}/logo-small.png", "PNG", optimize=True)
print(f"✓ Logo small salva: {new_width}x{new_height}px ({output_dir}/logo-small.png)")

# 3. Logo grande (institucional) - 400px de altura
logo_large = img.copy()
new_height = 400
new_width = int(new_height * aspect_ratio)
logo_large = logo_large.resize((new_width, new_height), Image.Resampling.LANCZOS)
logo_large.save(f"{output_dir}/logo-large.png", "PNG", optimize=True)
print(f"✓ Logo large salva: {new_width}x{new_height}px ({output_dir}/logo-large.png)")

# 4. Favicon - 32x32 com padding
favicon_size = 32
favicon = Image.new('RGB', (favicon_size, favicon_size), AZUL_MARINHO)
logo_fav = img.copy()
logo_fav.thumbnail((28, 28), Image.Resampling.LANCZOS)
x = (favicon_size - logo_fav.width) // 2
y = (favicon_size - logo_fav.height) // 2
favicon.paste(logo_fav, (x, y))
favicon.save(f"{output_dir}/favicon.ico", "ICO")
print(f"✓ Favicon salvo: 32x32 ({output_dir}/favicon.ico)")

# 5. Apple touch icon - 180x180
apple_size = 180
apple_icon = Image.new('RGB', (apple_size, apple_size), AZUL_MARINHO)
logo_apple = img.copy()
logo_apple.thumbnail((160, 160), Image.Resampling.LANCZOS)
x = (apple_size - logo_apple.width) // 2
y = (apple_size - logo_apple.height) // 2
apple_icon.paste(logo_apple, (x, y))
apple_icon.save(f"{output_dir}/apple-touch-icon.png", "PNG", optimize=True)
print(f"✓ Apple touch icon salvo: 180x180 ({output_dir}/apple-touch-icon.png)")

# 6. PWA icon - 512x512
pwa_size = 512
pwa_icon = Image.new('RGB', (pwa_size, pwa_size), AZUL_MARINHO)
logo_pwa = img.copy()
logo_pwa.thumbnail((450, 450), Image.Resampling.LANCZOS)
x = (pwa_size - logo_pwa.width) // 2
y = (pwa_size - logo_pwa.height) // 2
pwa_icon.paste(logo_pwa, (x, y))
pwa_icon.save(f"{output_dir}/icon-512.png", "PNG", optimize=True)
print(f"✓ PWA icon salvo: 512x512 ({output_dir}/icon-512.png)")

# 7. Open Graph image (redes sociais) - 1200x630
og_width, og_height = 1200, 630
og_img = Image.new('RGB', (og_width, og_height), AZUL_MARINHO)
logo_og = img.copy()
logo_og.thumbnail((500, 400), Image.Resampling.LANCZOS)
x = (og_width - logo_og.width) // 2
y = (og_height - logo_og.height) // 2
og_img.paste(logo_og, (x, y))
og_img.save(f"{output_dir}/og-image.jpg", "JPEG", quality=90, optimize=True)
print(f"✓ Open Graph image salva: 1200x630 ({output_dir}/og-image.jpg)")

# 8. Logo para header com fundo transparente (apenas a logo)
# Criar versão com fundo azul marinho para o header
logo_header_bg = Image.new('RGB', (new_width + 20, 200 + 20), AZUL_MARINHO)
logo_h = img.copy()
logo_h = logo_h.resize((int(200 * aspect_ratio), 200), Image.Resampling.LANCZOS)
logo_header_bg.paste(logo_h, (10, 10))
logo_header_bg.save(f"{output_dir}/logo-header.png", "PNG", optimize=True)
print(f"✓ Logo header com padding salva: ({output_dir}/logo-header.png)")

print("\n✅ Todas as versões da logo foram geradas com sucesso!")
print(f"📁 Arquivos salvos em: {output_dir}")
print(f"🎨 Cor do fundo: Azul Marinho RGB{AZUL_MARINHO} = #1a1f3c")
print(f"🎨 Cor dourada da logo: #c9a962 (aproximado)")
