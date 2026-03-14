-- Migración de rutas de archivos a GitHub
-- Versión: 1.0.0
-- Fecha: 2026-03-13

-- Base URL para archivos RAW en GitHub
-- Repositorio: reneleyvaolace/velvetsynccatalog
-- Rama: main

UPDATE device_catalog
SET 
  image_url = 'https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs/img/VS_' || id || '.jpg',
  qr_code_url = 'https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs/qr/QR_' || id || '.png',
  ficha_tecnica_url = 'https://raw.githubusercontent.com/reneleyvaolace/velvetsynccatalog/main/documentacion/docs/pdf/FICHA_' || id || '_PREMIUM.pdf'
WHERE id IS NOT NULL;
