-- Migration: Fix site_settings schema to match Drizzle code
-- Date: 2026-01-29

-- Drop existing table
DROP TABLE IF EXISTS site_settings CASCADE;

-- Create new table with correct schema
CREATE TABLE site_settings (
  id SERIAL PRIMARY KEY,
  
  -- Company information
  "companyName" VARCHAR(255),
  "companyDescription" TEXT,
  "companyLogo" VARCHAR(500),
  
  -- Realtor information
  "realtorName" VARCHAR(255),
  "realtorPhoto" VARCHAR(500),
  "realtorBio" TEXT,
  "realtorCreci" VARCHAR(50),
  
  -- Contact information
  phone VARCHAR(20),
  whatsapp VARCHAR(20),
  email VARCHAR(320),
  address TEXT,
  
  -- Social media
  instagram VARCHAR(255),
  facebook VARCHAR(255),
  youtube VARCHAR(255),
  tiktok VARCHAR(255),
  linkedin VARCHAR(255),
  
  -- SEO
  "siteTitle" VARCHAR(255),
  "siteDescription" TEXT,
  "siteKeywords" TEXT,
  "googleAnalyticsId" VARCHAR(100),
  "facebookPixelId" VARCHAR(100),
  
  -- Visual customization
  "themeStyle" VARCHAR(50) DEFAULT 'modern',
  "primaryColor" VARCHAR(7) DEFAULT '#c9a962',
  "secondaryColor" VARCHAR(7) DEFAULT '#2c3e50',
  "accentColor" VARCHAR(7) DEFAULT '#e74c3c',
  "fontFamily" VARCHAR(100) DEFAULT 'Inter',
  "logoPosition" VARCHAR(20) DEFAULT 'left',
  "showBreadcrumbs" BOOLEAN DEFAULT true,
  "enableDarkMode" BOOLEAN DEFAULT false,
  
  -- Timestamps
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO site_settings (
  "companyName",
  "siteTitle",
  "siteDescription",
  email,
  phone,
  whatsapp,
  "primaryColor"
) VALUES (
  'Leman Negócios Imobiliários',
  'Leman - Imóveis em Brasília',
  'Encontre o imóvel dos seus sonhos em Brasília',
  'contato@lemannegocios.com.br',
  '+5561999999999',
  '+5561999999999',
  '#c9a962'
);
