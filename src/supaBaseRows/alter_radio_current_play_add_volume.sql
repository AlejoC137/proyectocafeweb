-- Migración para añadir volumen y silencio sincronizado a radio_current_play
ALTER TABLE public.radio_current_play 
ADD COLUMN IF NOT EXISTS volume numeric DEFAULT 0.85,
ADD COLUMN IF NOT EXISTS is_muted boolean DEFAULT false;

COMMENT ON COLUMN public.radio_current_play.volume IS 'Nivel de volumen sincronizado (0.0 a 1.0)';
COMMENT ON COLUMN public.radio_current_play.is_muted IS 'Estado de silencio/mute sincronizado';
