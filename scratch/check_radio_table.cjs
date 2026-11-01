const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split(/\r?\n/).forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[k] = v;
  }
});

async function run() {
  const tables = ['radio_current_play', 'userPreferences', 'playlist_radio'];
  for (const t of tables) {
    const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${t}?limit=1`, {
      headers: {
        apikey: env.VITE_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
      }
    });
    console.log(t, res.status);
    if (res.ok) {
      const d = await res.json();
      console.log(t, 'sample keys:', Object.keys(d[0] || {}));
    }
  }
}
run();
