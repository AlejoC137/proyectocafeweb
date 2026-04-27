import { createClient } from "@supabase/supabase-js";

// Acceder a las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error de configuración de Supabase:');
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Configurada' : '❌ Faltante');
  console.error('\n📝 Asegúrate de que el archivo .env contenga:');
  console.error('VITE_SUPABASE_URL=tu_url_de_supabase');
  console.error('VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase');
  
  throw new Error('Variables de entorno de Supabase no configuradas. Revisa tu archivo .env');
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log de configuración exitosa (solo en desarrollo)
if (import.meta.env.DEV) {
}

export default supabase;
