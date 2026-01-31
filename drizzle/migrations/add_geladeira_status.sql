-- Adicionar valor "geladeira" ao enum property_status
ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'geladeira';
