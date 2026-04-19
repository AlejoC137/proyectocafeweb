import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  const { id } = req.query;

  // Si no hay id, redirige al inicio
  if (!id) {
    return res.redirect(302, "/");
  }

  // IMPORTANTE: En el entorno Node.js de Vercel, se usa process.env, no import.meta.env
  // Asegúrate de que estas variables estén configuradas en los Settings de tu proyecto en Vercel
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Variables de Supabase (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY) no encontradas en el entorno del servidor API. Redirigiendo directo.");
    // Redirección directa como de costumbre si no está configurado el servidor en Vercel
    return res.redirect(302, `/inscripcion/${id}`);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    let resolveId = id;
    if (id.length < 36) {
      const { data: allIds } = await supabase.from("Agenda").select('_id');
      const match = allIds?.find(e => e._id.startsWith(id));
      if (match) resolveId = match._id;
    }

    const { data: evento, error } = await supabase
      .from("Agenda")
      .select("nombreES, bannerIMG, decripcion")
      .eq("_id", resolveId)
      .single();

    if (error || !evento) {
      return res.redirect(302, `/inscripcion/${id}`);
    }

    const title = evento.nombreES || "Inscripción de Evento";
    const description = (evento.decripcion && evento.decripcion.length > 0) ? evento.decripcion : "Te invitamos a este gran evento.";
    
    // Si no tiene imagen asignada, usa un logo/imagen vacía.
    const imageUrl = evento.bannerIMG || "https://proyectocafeweb.vercel.app/android-chrome-512x512.png"; // Usa una imagen genérica real si la tienes

    // Construimos la vista para el Robot de WhatsApp
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>

          <!-- Open Graph / Social Meta Tags -->
          <meta property="og:title" content="🎟️ ${title}" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${imageUrl}" />
          <!-- Recomienda a WhatsApp que muestre una tarjeta grande -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta property="og:type" content="website" />
          
          <!-- Redirección para humanos y robots ignorantes de JS -->
          <meta http-equiv="refresh" content="0; url=/inscripcion/${id}">
          
          <!-- Redirección ultra rápida vía JavaScript -->
          <script>
            window.location.replace("/inscripcion/${id}");
          </script>
      </head>
      <body style="background-color: #fafafa; font-family: sans-serif; text-align: center; padding-top: 50px;">
          <p>Cargando información del evento...</p>
          <a href="/inscripcion/${id}" style="color: #ff6600; text-decoration: none; font-weight: bold;">
            Haz clic aquí si no eres redirigido automáticamente
          </a>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    // Memoria caché para que el enlace comparta muy rápido y Vercel no sufra
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    return res.status(200).send(html);

  } catch (err) {
    console.error("Error grave en api/share:", err);
    return res.redirect(302, `/inscripcion/${id}`);
  }
}
