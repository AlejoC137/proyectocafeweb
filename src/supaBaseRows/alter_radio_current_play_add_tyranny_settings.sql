-- Migración para añadir ajustes de Control Tiránico a radio_current_play
ALTER TABLE public.radio_current_play 
ADD COLUMN IF NOT EXISTS tyranny_settings jsonb DEFAULT '{
  "lockConsoles": true,
  "forcedTab": "supabase",
  "bannerEnabled": true,
  "bannerContentType": "both",
  "bannerImageUrl": "",
  "bannerTitle": "Proyecto Café Radio",
  "bannerText": "Música curada para el café",
  "showHamburgerMenu": false,
  "allowAdminNav": false
}'::jsonb;

COMMENT ON COLUMN public.radio_current_play.tyranny_settings IS 'Ajustes maestros tiránicos (bloqueo de consolas, banners de inicio con play, menú hamburguesa y navegación)';
