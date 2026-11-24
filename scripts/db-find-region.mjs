/**
 * Mencari region pooler yang benar untuk project Supabase ini.
 * Pooler menjawab "tenant/user ... not found" kalau region salah.
 *
 * Jalankan: SUPABASE_DB_PASSWORD="..." node scripts/db-find-region.mjs
 */
import pg from 'pg'

const REF = 'xpmnuepaeqkorewovdwr'
const pw = process.env.SUPABASE_DB_PASSWORD
if (!pw) {
  console.error('SUPABASE_DB_PASSWORD belum diset.')
  process.exit(1)
}

const REGIONS = [
  'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
  'ca-central-1', 'sa-east-1',
  'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1', 'eu-central-2', 'eu-north-1',
  'ap-south-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
]

const hosts = REGIONS.flatMap((r) => [`aws-0-${r}.pooler.supabase.com`, `aws-1-${r}.pooler.supabase.com`])

async function probe(host) {
  const client = new pg.Client({
    connectionString: `postgresql://postgres.${REF}:${encodeURIComponent(pw)}@${host}:5432/postgres`,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  try {
    await client.connect()
    return { host, ok: true }
  } catch (err) {
    return { host, ok: false, msg: err.message }
  } finally {
    try { await client.end() } catch {}
  }
}

const results = await Promise.all(hosts.map(probe))
const hit = results.find((r) => r.ok)

if (hit) {
  console.log(`DITEMUKAN → ${hit.host}`)
} else {
  console.log('Tidak ada region yang cocok. Ringkasan:')
  for (const r of results) console.log(`  ${r.host} → ${r.msg}`)
}
