import { createClient } from "@supabase/supabase-js";

// Acceder a las variables de entorno de Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Verificar si las variables se cargan correctamente
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;