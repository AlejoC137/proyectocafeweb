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
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/userPreferences?select=*&limit=3`;
  const res = await fetch(url, {
    headers: {
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log('userPreferences sample:', data);
}
run();
